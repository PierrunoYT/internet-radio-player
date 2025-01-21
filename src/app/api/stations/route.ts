import { NextResponse } from 'next/server';

interface RadioBrowserStation {
  name: string;
  url: string;
  favicon: string;
  tags: string;
  // Add other potential fields that might be needed
  stationuuid?: string;
  url_resolved?: string;
  codec?: string;
  votes?: number;
  clickcount?: number;
}

async function fetchRadioBrowserStations(offset: number = 0, limit: number = 100) {
  try {
    // Get stations with pagination
    const response = await fetch(
      `https://de1.api.radio-browser.info/json/stations/search?offset=${offset}&limit=${limit}&order=votes&reverse=true&minimum_votes=1`,
      {
        headers: {
          'User-Agent': 'InternetRadioApp/1.0',
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const stations = await response.json() as RadioBrowserStation[];
    
    // Filter out stations without valid URLs or names
    return stations
      .filter(station => station.url && station.name && station.name.trim() !== '')
      .map((station) => ({
        name: station.name.trim(),
        url: station.url_resolved || station.url,
        favicon: station.favicon,
        tags: station.tags,
      }));
  } catch (error) {
    console.error('Failed to fetch from Radio Browser:', error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    const stations = await fetchRadioBrowserStations(offset, limit);
    return NextResponse.json({
      stations,
      page,
      limit,
      hasMore: stations.length === limit // If we got a full page, there might be more
    });
  } catch (error) {
    console.error('Error in stations API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    );
  }
} 