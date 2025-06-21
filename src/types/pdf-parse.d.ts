declare module "pdf-parse" {
    import { Buffer } from "node:buffer";

    interface PDFParseResult {
        text: string;
        numpages: number;
        numrender: number;
        info: any;
        metadata: any;
        version: string;
    }

    function pdfParse(dataBuffer: Buffer, options?: any): Promise<PDFParseResult>;

    export default pdfParse;
} 