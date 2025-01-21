'use client';

import { useEffect, useState } from 'react';
import { Howl } from 'howler';
import Image from 'next/image';

export interface RadioStation {
  id: number;
  name: string;
  url: string;
  favicon?: string;
  tags?: string;
}

const STATIONS_PER_PAGE = 24; // Increased for better grid layout

export default function RadioPlayer() {
  const [player, setPlayer] = useState<Howl | null>(null);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchStations = async (page: number) => {
    try {
      setLoadingMore(true);
      const response = await fetch(`/api/stations?page=${page}&limit=${STATIONS_PER_PAGE}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (page === 1) {
        setStations(data.stations);
      } else {
        setStations(prev => [...prev, ...data.stations]);
      }
      
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Station fetch error:', err);
      setError('Failed to load radio stations');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchStations(1);
  }, []);

  // Reset stations when search query changes
  useEffect(() => {
    setStations([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchStations(1);
  }, [searchQuery]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchStations(nextPage);
    }
  };

  const filteredStations = stations.filter(station => {
    const searchLower = searchQuery.toLowerCase();
    return (
      station.name.toLowerCase().includes(searchLower) ||
      (station.tags && station.tags.toLowerCase().includes(searchLower))
    );
  });

  const playStation = (station: RadioStation) => {
    if (currentStation?.id === station.id) {
      stopPlaying();
      return;
    }

    if (player) {
      player.unload();
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
              ✕
            </button>
          )}
        </div>
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
        {filteredStations.map((station) => (
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
            disabled={loadingMore}
            className={`px-6 py-2 rounded-lg ${
              loadingMore
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {loadingMore ? 'Loading...' : 'Load More Stations'}
          </button>
        </div>
      )}

      {/* No results message */}
      {filteredStations.length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-8">
          No stations found matching &ldquo;{searchQuery}&rdquo;
        </div>
      )}
    </div>
  );
} 