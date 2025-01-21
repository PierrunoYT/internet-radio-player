import { NextResponse } from 'next/server';
import { getStations, addStation } from '@/lib/db';

interface RadioBrowserStation {
  name: string;
  url: string;
  favicon: string;
  tags: string;
  // Add other potential fields that might be needed
  stationuuid?: string;
  url_resolved?: string;
  codec?: string;
}

async function fetchRadioBrowserStations() {
  try {
    const response = await fetch(
      'https://de1.api.radio-browser.info/json/stations/topclick/100'
    );
    const stations = await response.json() as RadioBrowserStation[];
    return stations.map((station) => ({
      name: station.name,
      url: station.url_resolved || station.url, // Use resolved URL if available
      favicon: station.favicon,
      tags: station.tags,
    }));
  } catch (error) {
    console.error('Failed to fetch from Radio Browser:', error);
    return [];
  }
}

export async function GET() {
  try {
    // First try to get stations from our database
    let stations = getStations();

    // If we don't have any stations, fetch from Radio Browser API and save them
    if (stations.length === 0) {
      const radioBrowserStations = await fetchRadioBrowserStations();
      for (const station of radioBrowserStations) {
        addStation(station);
      }
      stations = getStations();
    }

    return NextResponse.json(stations);
  } catch (error) {
    console.error('Error in stations API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    );
  }
} 