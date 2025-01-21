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

async function fetchRadioBrowserStations() {
  try {
    const servers = await getRadioBrowserServers();
    const server = servers[Math.floor(Math.random() * servers.length)];

    // Build base parameters - get all stations at once
    const params = new URLSearchParams({
      offset: '0',
      limit: '1000',  // Get maximum stations in one request
      hidebroken: 'true',
      order: 'clickcount',
      reverse: 'true'
    });

    const response = await fetch(
      `https://${server}/json/stations?${params.toString()}`,
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
    const action = searchParams.get('action');
    const stationId = searchParams.get('stationId');

    // Handle click tracking
    if (action === 'click' && stationId) {
      await trackStationClick(stationId);
      return NextResponse.json({ success: true });
    }

    // Handle station fetch - now returns all stations
    const stations = await fetchRadioBrowserStations();
    return NextResponse.json({
      stations,
      hasMore: false // Since we're loading all stations at once
    });
  } catch (error) {
    console.error('Error in stations API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stations' },
      { status: 500 }
    );
  }
}