import { warnError } from "./warnError";

/**
 * Attempt to import optional third-party dependency dynamically for ESM module, and show an error in the console if that fails.
 * @param packageName 
 * @param type 
 * @returns 
 */
export async function importDependencyInternal(packageName: string, type: string): Promise<any> {
    try {
        let module;
        switch (packageName) {
            case "canvg":
                module = await import(/* webpackIgnore: true */ "canvg");
                if (!module.Canvg) {
                    module = undefined;
                }
                break;
            case "pdfkit":
                module = "PDFDocument" in window ? window.PDFDocument : (await import(/* webpackIgnore: true */ "pdfkit")).default;
                break;
            case "svg-to-pdfkit":
                module = "SVGtoPDF" in window ? window.SVGtoPDF : (await import(/* webpackIgnore: true */ "svg-to-pdfkit")).default;
                break;
            case "blob-stream":
                module = "blobStream" in window ? window.blobStream : (await import(/* webpackIgnore: true */ "blob-stream")).default;
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
