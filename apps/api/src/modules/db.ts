import { openDb } from '../db/sqlite.js';

export function getDB() {
  return openDb();
}
