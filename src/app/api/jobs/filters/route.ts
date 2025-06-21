import { getOpenJobs } from "@/lib/jobs";

export const runtime = "edge";

export async function GET() {
    const jobs = await getOpenJobs();

    const uniqueLocations = Array.from(
        new Set(
            jobs
                .map((job) => job.location ?? "")
                .filter((loc) => loc && loc.trim().length > 0)
        )
    );

    const uniqueDepartments = Array.from(
        new Set(
            jobs
                .map((job) => job.department ?? "")
                .filter((dept) => dept && dept.trim().length > 0)
        )
    );

    return new Response(JSON.stringify({
        locations: uniqueLocations,
        departments: uniqueDepartments,
    }), {
        headers: {
            "Content-Type": "application/json",
        },
    });
} 