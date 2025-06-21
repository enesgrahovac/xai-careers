export interface JobListing {
    id: string;
    title: string;
    location: string | null;
    department: string | null;
    description_md: string | null;
}

/**
 * Fetch all open job listings from the database.
 * NOTE: This currently returns every listing.  Filtering by location/department
 * should be done by the caller for now.  In the future this can become a full
 * RAG retrieval function that embeds the listing descriptions and performs
 * semantic search based on the user query.
 */
export async function getOpenJobs(): Promise<JobListing[]> {
    // We rely on the edge-compatible @vercel/postgres client that is already used
    // elsewhere in the codebase.
    const { sql } = await import('@vercel/postgres');

    const result = await sql`
    SELECT id, title, location, department, description_md
    FROM job_listings
    ORDER BY posted_at DESC
  `;

    return result.rows as unknown as JobListing[];
} 