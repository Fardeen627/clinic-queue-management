import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DEFAULT_DB_PATH = path.resolve(process.cwd(), "../../infra/data/clinic-queue.sqlite");
const DEFAULT_SCHEMA_PATH = path.resolve(process.cwd(), "../../docs/schema.sqlite.sql");

export function openDb() {
  const dbPath = process.env.DATABASE_PATH || DEFAULT_DB_PATH;
  const schemaPath = process.env.SCHEMA_PATH || DEFAULT_SCHEMA_PATH;
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");

  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf8");
    db.exec(schema);
  }

  return db;
}

export type Db = ReturnType<typeof openDb>;
