'use client';

import { useEffect, useState, useCallback } from 'react';
import { Howl } from 'howler';
import Image from 'next/image';

export interface RadioStation {
  id: string;
  name: string;
  url: string;
  favicon?: string;
  tags?: string;
  codec?: string;
  votes?: number;
  clickcount?: number;
}

const STATIONS_PER_PAGE = 24;

export default function RadioPlayer() {
  const [player, setPlayer] = useState<Howl | null>(null);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Input states
  const [searchInput, setSearchInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [countryInput, setCountryInput] = useState('');
  
  // Applied filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const handleKeyPress = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    value: string,
    setter: (value: string) => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setter(value);
    }
  }, []);

  const fetchStations = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: STATIONS_PER_PAGE.toString(),
        offset: ((page - 1) * STATIONS_PER_PAGE).toString()
      });

      if (searchQuery) params.append('query', searchQuery);
      if (selectedTag) params.append('tag', selectedTag);
      if (selectedCountry) params.append('country', selectedCountry);

      const response = await fetch(`/api/stations?${params}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (page === 1) {
        setStations(data);
      } else {
        setStations(prev => [...prev, ...data]);
      }

      setHasMore(data.length === STATIONS_PER_PAGE);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stations');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTag, selectedCountry]);

  // Reset and fetch when applied filters change
  useEffect(() => {
    setCurrentPage(1);
    setStations([]);
    fetchStations(1);
  }, [searchQuery, selectedTag, selectedCountry, fetchStations]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchStations(nextPage);
    }
  }, [currentPage, loading, hasMore, fetchStations]);

  const playStation = async (station: RadioStation) => {
    if (player) {
      player.unload();
    }

    const newPlayer = new Howl({
      src: [station.url],
      html5: true,
      format: ['mp3', 'aac'],
    });

    newPlayer.play();
    setPlayer(newPlayer);
    setCurrentStation(station);
  };

  const stopPlaying = () => {
    if (player) {
      player.unload();
      setPlayer(null);
      setCurrentStation(null);
    }
  };

  const formatTags = (tags: string) => {
    return tags.split(',').map(tag => tag.trim()).join(', ');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search stations... (press Enter)"
              className="w-full p-2 border rounded"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, searchInput, setSearchQuery)}
            />
            {searchQuery && (
              <p className="text-sm text-gray-600 mt-1">
                Searching for: {searchQuery}
              </p>
            )}
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Filter by tag... (press Enter)"
              className="w-full p-2 border rounded"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, tagInput, setSelectedTag)}
            />
            {selectedTag && (
              <p className="text-sm text-gray-600 mt-1">
                Tag filter: {selectedTag}
              </p>
            )}
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Filter by country... (press Enter)"
              className="w-full p-2 border rounded"
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, countryInput, setSelectedCountry)}
            />
            {selectedCountry && (
              <p className="text-sm text-gray-600 mt-1">
                Country filter: {selectedCountry}
              </p>
            )}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded">
            {error}
          </div>
        )}

        {currentStation && (
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="flex items-center gap-4">
              {currentStation.favicon && (
                <Image
                  src={currentStation.favicon}
                  alt={currentStation.name}
                  width={48}
                  height={48}
                  className="rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{currentStation.name}</h3>
                {currentStation.tags && (
                  <p className="text-sm text-gray-600">{formatTags(currentStation.tags)}</p>
                )}
              </div>
              <button
                onClick={stopPlaying}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Stop
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.map((station) => (
          <div
            key={station.id}
            className="p-4 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => playStation(station)}
          >
            <div className="flex items-center gap-3">
              {station.favicon && (
                <Image
                  src={station.favicon}
                  alt={station.name}
                  width={40}
                  height={40}
                  className="rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{station.name}</h3>
                {station.tags && (
                  <p className="text-sm text-gray-600 truncate">
                    {formatTags(station.tags)}
                  </p>
                )}
                {station.codec && (
                  <p className="text-xs text-gray-500">
                    {station.codec.toUpperCase()} • {station.clickcount?.toLocaleString()} plays
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={loadMore}
          className="w-full py-2 mt-8 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Load More
        </button>
      )}

      {stations.length === 0 && !loading && (
        <div className="text-center text-gray-500 my-8">
          No stations found. Try adjusting your search filters.
        </div>
      )}
    </div>
  );
} 