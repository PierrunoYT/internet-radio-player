'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Howl } from 'howler';
import Image from 'next/image';

export interface RadioStation {
  id: string;
  name: string;
  url: string;
  favicon?: string;
  tags?: string;
}

const STATIONS_PER_PAGE = 24;

export default function RadioPlayer() {
  const [player, setPlayer] = useState<Howl | null>(null);
  const [allStations, setAllStations] = useState<RadioStation[]>([]);
  const [displayedStations, setDisplayedStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchQuery]);

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stations');
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setAllStations(data.stations);
    } catch (err) {
      console.error('Station fetch error:', err);
      setError('Failed to load radio stations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load of all stations
  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Filter stations based on search query
  const normalizeText = (text: string) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
      .toLowerCase()
      .trim();
  };

  const filteredStations = useMemo(() => {
    if (!debouncedSearchQuery) {
      return allStations;
    }

    const searchTerms = normalizeText(debouncedSearchQuery).split(/\s+/);
    
    return allStations.filter(station => {
      const normalizedName = normalizeText(station.name);
      const normalizedTags = station.tags ? normalizeText(station.tags) : '';
      
      // Match all search terms against both name and tags
      return searchTerms.every(term => 
        normalizedName.includes(term) || normalizedTags.includes(term)
      );
    });
  }, [allStations, debouncedSearchQuery]);

  // Update displayed stations based on current page and filtered results
  useEffect(() => {
    if (debouncedSearchQuery) {
      // Show all filtered results when searching
      setDisplayedStations(filteredStations);
    } else {
      // Use pagination only for the initial view
      const endIndex = currentPage * STATIONS_PER_PAGE;
      const stationsToShow = filteredStations.slice(0, endIndex);
      setDisplayedStations(stationsToShow);
    }
  }, [currentPage, filteredStations, debouncedSearchQuery]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  // Only show "Load More" when not searching and there are more stations to show
  const hasMore = !debouncedSearchQuery && currentPage * STATIONS_PER_PAGE < filteredStations.length;

  const playStation = async (station: RadioStation) => {
    if (currentStation?.id === station.id) {
      stopPlaying();
      return;
    }

    if (player) {
      player.unload();
    }

    // Track station click
    try {
      await fetch(`/api/stations?action=click&stationId=${station.id}`);
    } catch (error) {
      console.error('Failed to track station click:', error);
    }

    const sound = new Howl({
      src: [station.url],
      html5: true,
      format: ['mp3', 'aac'],
      onplay: () => setCurrentStation(station),
      onloaderror: () => {
        setError(`Failed to load station: ${station.name}`);
        setCurrentStation(null);
      },
    });

    sound.play();
    setPlayer(sound);
  };

  const stopPlaying = () => {
    if (player) {
      player.unload();
      setCurrentStation(null);
    }
  };

  const formatTags = (tags: string) => {
    return tags.split(',')
      .slice(0, 3) // Take only first 3 tags
      .map(tag => tag.trim())
      .join(', ');
  };

  if (loading && currentPage === 1) {
    return <div className="flex justify-center p-8">Loading stations...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Search field */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search stations by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {isSearching ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <span>✕</span>
              )}
            </button>
          )}
        </div>
        {isSearching && searchQuery && (
          <p className="text-sm text-gray-500 mt-1">Searching...</p>
        )}
      </div>

      {/* Current station player */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg shadow-lg">
        {currentStation ? (
          <div className="flex items-center justify-between">
            <div className="max-w-[80%]">
              <h2 className="text-xl font-bold text-white truncate">{currentStation.name}</h2>
              {currentStation.tags && (
                <p className="text-gray-400 text-sm truncate">{formatTags(currentStation.tags)}</p>
              )}
            </div>
            <button
              onClick={stopPlaying}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              Stop
            </button>
          </div>
        ) : (
          <p className="text-gray-400">Select a station to start playing</p>
        )}
      </div>

      {/* Station grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {displayedStations.map((station) => (
          <button
            key={station.id}
            onClick={() => playStation(station)}
            className={`p-4 rounded-lg transition-all h-24 flex items-center ${
              currentStation?.id === station.id
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3 w-full min-w-0">
              <div className="shrink-0">
                {station.favicon ? (
                  <div className="relative w-12 h-12">
                    <Image
                      src={station.favicon}
                      alt={station.name}
                      fill
                      className="rounded-full object-cover"
                      onError={() => {
                        const imgElement = document.getElementById(`station-img-${station.id}`);
                        if (imgElement) {
                          imgElement.style.backgroundImage = 'url(/radio-default.png)';
                        }
                      }}
                      id={`station-img-${station.id}`}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-2xl">📻</span>
                  </div>
                )}
              </div>
              <div className="text-left min-w-0 flex-1">
                <h3 className="font-medium truncate">{station.name}</h3>
                {station.tags && (
                  <p className={`text-sm ${currentStation?.id === station.id ? 'text-gray-200' : 'text-gray-500'} truncate`}>
                    {formatTags(station.tags)}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            className={`px-6 py-2 rounded-lg ${
              'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Load More Stations
          </button>
        </div>
      )}

      {/* No results message */}
      {displayedStations.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-8">
          No stations found matching &ldquo;{searchQuery}&rdquo;
        </div>
      )}
    </div>
  );
} 