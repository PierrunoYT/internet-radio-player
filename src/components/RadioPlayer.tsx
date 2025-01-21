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

export default function RadioPlayer() {
  const [player, setPlayer] = useState<Howl | null>(null);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await fetch('/api/stations');
      const data = await response.json();
      setStations(data);
    } catch (err) {
      console.error('Station fetch error:', err);
      setError('Failed to load radio stations');
    } finally {
      setLoading(false);
    }
  };

  const playStation = (station: RadioStation) => {
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

  if (loading) {
    return <div className="flex justify-center p-8">Loading stations...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8 p-4 bg-gray-800 rounded-lg shadow-lg">
        {currentStation ? (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{currentStation.name}</h2>
              {currentStation.tags && (
                <p className="text-gray-400 text-sm">{currentStation.tags}</p>
              )}
            </div>
            <button
              onClick={stopPlaying}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Stop
            </button>
          </div>
        ) : (
          <p className="text-gray-400">Select a station to start playing</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.map((station) => (
          <button
            key={station.id}
            onClick={() => playStation(station)}
            className={`p-4 rounded-lg transition-all ${
              currentStation?.id === station.id
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              {station.favicon && (
                <Image
                  src={station.favicon}
                  alt={station.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = '/radio-default.png';
                  }}
                />
              )}
              <div className="text-left">
                <h3 className="font-medium">{station.name}</h3>
                {station.tags && (
                  <p className="text-sm text-gray-500">{station.tags}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 