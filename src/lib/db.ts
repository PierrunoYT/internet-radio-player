import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'radio.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    favicon TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(station_id) REFERENCES stations(id)
  );
`);

export function getStations() {
  return db.prepare('SELECT * FROM stations ORDER BY name').all();
}

export function addStation(station: { name: string; url: string; favicon?: string; tags?: string }) {
  const stmt = db.prepare('INSERT INTO stations (name, url, favicon, tags) VALUES (?, ?, ?, ?)');
  return stmt.run(station.name, station.url, station.favicon, station.tags);
}

export function getFavorites() {
  return db.prepare(`
    SELECT stations.* FROM stations 
    INNER JOIN favorites ON stations.id = favorites.station_id 
    ORDER BY favorites.created_at DESC
  `).all();
}

export function toggleFavorite(stationId: number) {
  const exists = db.prepare('SELECT id FROM favorites WHERE station_id = ?').get(stationId);
  if (exists) {
    return db.prepare('DELETE FROM favorites WHERE station_id = ?').run(stationId);
  }
  return db.prepare('INSERT INTO favorites (station_id) VALUES (?)').run(stationId);
}

export default db; 