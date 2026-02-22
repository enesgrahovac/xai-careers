export interface JobListing {
    id: string;
    title: string;
    location: string | null;
    department: string | null;
    description_md: string | null;
}

interface GetOpenJobsOptions {
    locations?: string[];
    departments?: string[];
}

/**
 * Fetch open job listings from the database, optionally filtered by
 * location and/or department.  Filters are applied with ILIKE so that
 * partial / case-insensitive matches work (e.g. "Palo Alto" matches
 * "Palo Alto, CA").
 */
export async function getOpenJobs(opts?: GetOpenJobsOptions): Promise<JobListing[]> {
    const { sql } = await import('@vercel/postgres');

    const hasLocations = opts?.locations?.length && !opts.locations.includes("Any");
    const hasDepartments = opts?.departments?.length && !opts.departments.includes("Any");

    // Build a single query with optional WHERE clauses.  When no filters are
    // active the conditions evaluate to TRUE so every row is returned.
    const result = await sql`
        SELECT id, title, location, department, description_md
        FROM job_listings
        WHERE
            (${!hasLocations} OR location ILIKE ANY(${hasLocations ? opts!.locations!.map(l => `%${l}%`) : []}))
            AND
            (${!hasDepartments} OR department ILIKE ANY(${hasDepartments ? opts!.departments!.map(d => `%${d}%`) : []}))
        ORDER BY posted_at DESC
    `;

    return result.rows as unknown as JobListing[];
} 