declare module "pdf-parse" {
    import { Buffer } from "node:buffer";

    interface PDFParseResult {
        text: string;
        numpages: number;
        numrender: number;
        info: Record<string, unknown>;
        metadata: unknown;
        version: string;
    }

    function pdfParse(
        dataBuffer: Buffer,
        options?: Record<string, unknown>
    ): Promise<PDFParseResult>;

    export default pdfParse;
} 