import { sql } from '@vercel/postgres';
import { ensureJobListingsTable } from './db';
import { extractCoreDescription } from './cleanJob';

interface GreenhouseJob {
    id: number;
    title: string;
    location?: { name: string };
    departments?: { name: string }[];
    updated_at?: string;
    content: string; // HTML or markdown
}

export async function syncGreenhouseJobs() {
    await ensureJobListingsTable();

    const res = await fetch('https://boards-api.greenhouse.io/v1/boards/xai/jobs?content=true');
    if (!res.ok) throw new Error('Failed to fetch Greenhouse jobs');
    const json = await res.json();
    const jobs: GreenhouseJob[] = json.jobs;

    for (const job of jobs) {
        const location = job.location?.name ?? null;
        const department = job.departments && job.departments.length > 0 ? job.departments[0].name : null;

        const core = extractCoreDescription(job.content);

        await sql`
      INSERT INTO job_listings (id, title, location, department, description_md, posted_at)
      VALUES (${job.id.toString()}, ${job.title}, ${location}, ${department}, ${core}, ${job.updated_at ?? null})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        location = EXCLUDED.location,
        department = EXCLUDED.department,
        description_md = EXCLUDED.description_md,
        posted_at = EXCLUDED.posted_at;
    `;
    }

    // Remove listings that no longer exist
    const ids = jobs.map(j => j.id.toString());
    if (ids.length > 0) {
        const idsLiteral = `{${ids.join(',')}}`;
        await sql`DELETE FROM job_listings WHERE NOT (id = ANY(${idsLiteral}));`;
    } else {
        await sql`TRUNCATE TABLE job_listings;`;
    }


    return { count: jobs.length };
} 