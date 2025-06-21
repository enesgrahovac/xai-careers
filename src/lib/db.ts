import { sql } from '@vercel/postgres';

export async function ensureJobListingsTable() {
    // Enable pgvector extension (safe if already enabled)
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;

    // Create job_listings table if it does not exist
    await sql`
    CREATE TABLE IF NOT EXISTS job_listings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT,
      department TEXT,
      description_md TEXT,
      posted_at TIMESTAMPTZ,
      embedding VECTOR(1536)
    );
  `;
} 