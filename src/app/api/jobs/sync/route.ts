import { syncGreenhouseJobs } from '@/lib/greenhouse';

export const runtime = 'nodejs';

export async function POST() {
    try {
        const result = await syncGreenhouseJobs();
        return new Response(JSON.stringify({ ok: true, ...result }), { status: 200 });
    } catch (err: unknown) {
        console.error('Sync error', err);
        const message = err instanceof Error ? err.message : 'unknown error';
        return new Response(JSON.stringify({ ok: false, error: message }), { status: 500 });
    }
}

export async function GET() {
    return POST();
} 