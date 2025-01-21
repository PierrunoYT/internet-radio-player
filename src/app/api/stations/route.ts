import { NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';

const resolveSrv = promisify(dns.resolveSrv);

interface RadioBrowserStation {
  name: string;
  url: string;
  favicon: string;
  tags: string;
  stationuuid: string;
  url_resolved?: string;
  codec?: string;
  votes?: number;
  clickcount?: number;
}

// Cache the server list for 1 hour
let cachedServers: string[] = [];
let lastServerFetch: number = 0;

async function getRadioBrowserServers(): Promise<string[]> {
  const ONE_HOUR = 3600000;
  
  // Return cached servers if available and not expired
  if (cachedServers.length > 0 && (Date.now() - lastServerFetch) < ONE_HOUR) {
    return cachedServers;
  }

  try {
    // Get list of radio browser servers using DNS SRV lookup
    const servers = await resolveSrv('_api._tcp.radio-browser.info');
    cachedServers = servers.map(server => server.name);
    lastServerFetch = Date.now();
    return cachedServers;
  } catch (error) {
    console.error('Failed to fetch radio browser servers:', error);
    // Fallback servers if DNS lookup fails
    return ['de1.api.radio-browser.info', 'nl1.api.radio-browser.info', 'at1.api.radio-browser.info'];
  }
}

async function fetchRadioBrowserStations(offset: number = 0, limit: number = 100, searchQuery: string = '') {
  try {
    const servers = await getRadioBrowserServers();
    // Randomly select a server
    const server = servers[Math.floor(Math.random() * servers.length)];

    // Build search parameters
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
      order: 'clickcount',  // Sort by popularity
      reverse: 'true',
      hidebroken: 'true',   // Hide broken stations
    });

    // Add search parameters if query exists
    if (searchQuery) {
      params.append('name', searchQuery);
      params.append('tagList', searchQuery);
      params.append('nameExact', 'false');
    }

    const response = await fetch(
      `https://${server}/json/stations/search?${params.toString()}`,
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
    
    return stations
      .filter(station => station.url && station.name && station.name.trim() !== '')
      .map((station) => ({
        id: station.stationuuid,
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

// Track station clicks
async function trackStationClick(stationId: string) {
  try {
    const servers = await getRadioBrowserServers();
    const server = servers[Math.floor(Math.random() * servers.length)];
    
    await fetch(`https://${server}/json/url/${stationId}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'InternetRadioApp/1.0',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to track station click:', error);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action');
    const stationId = searchParams.get('stationId');
    const offset = (page - 1) * limit;

    // Handle click tracking
    if (action === 'click' && stationId) {
      await trackStationClick(stationId);
      return NextResponse.json({ success: true });
    }

    // Handle station search
    const stations = await fetchRadioBrowserStations(offset, limit, search);
    return NextResponse.json({
      stations,
      page,
      limit,
      hasMore: stations.length === limit
    });
  } catch (error) {
    console.error('Error in stations API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    );
  }
} 