import { warnError } from "./warnError";

export async function importDependencyInternal(packageName: string, type: string): Promise<any> {
    try {
        let module;
        switch (packageName) {
            case "canvg":
                module = await import("canvg");
                if (!module.Canvg) {
                    module = undefined;
                }
                break;
            case "pdfkit":
                module = (window as any)?.PDFDocument ?? (await import("pdfkit")).default;
                break;
            case "svg-to-pdfkit":
                module = (window as any)?.SVGtoPDF ?? (await import("svg-to-pdfkit")).default;
                break;
            case "blob-stream":
                module = (window as any)?.blobStream ?? (await import("blob-stream")).default;
                break;
            default:
                break;
        }
        if (!module) {
            throw new Error("Module is undefined");
        }
        return module;
    } catch (er) {
        warnError(er);
        throw new Error(`Error svg-export: ${type} export requires the package "${packageName}"`);
    }
}