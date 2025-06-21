import pdfParse from "pdf-parse";

// Use the Node.js runtime so we can rely on Node buffers and the pdf-parse
// library (which depends on Node APIs not available in the Edge runtime).
export const runtime = "nodejs";
export const maxDuration = 30; // seconds – generous for large PDFs

export async function POST(req: Request) {
    // Expecting multipart/form-data with a single "file" field (the PDF)
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
        return new Response("Missing 'file' field", { status: 400 });
    }

    // Convert the web File/Blob to a Node Buffer for pdf-parse.
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
        const data = await pdfParse(buffer);
        // pdf-parse returns text with whitespace/newlines preserved.
        return Response.json({ text: data.text });
    } catch (err: any) {
        console.error("Failed to parse PDF", err);
        return new Response("Failed to parse PDF", { status: 500 });
    }
} 