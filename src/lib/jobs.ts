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

    // @vercel/postgres sql tag only accepts Primitive values, not arrays.
    // Build a combined ILIKE pattern with OR-style matching using '%loc1%|%loc2%'
    // won't work either — instead join filter values into a single regex-style
    // pattern and use the ~* (case-insensitive regex match) operator.
    const locPattern = hasLocations
        ? opts!.locations!.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
        : '';
    const deptPattern = hasDepartments
        ? opts!.departments!.map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
        : '';

    const result = await sql`
        SELECT id, title, location, department, description_md
        FROM job_listings
        WHERE
            (${!hasLocations} OR location ~* ${locPattern})
            AND
            (${!hasDepartments} OR department ~* ${deptPattern})
        ORDER BY posted_at DESC
    `;

    return result.rows as unknown as JobListing[];
} 