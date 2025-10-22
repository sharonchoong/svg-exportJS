import { warnError } from "./warnError";

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
                module = (window as any)?.PDFDocument ?? (await import(/* webpackIgnore: true */ "pdfkit")).default;
                break;
            case "svg-to-pdfkit":
                module = (window as any)?.SVGtoPDF ?? (await import(/* webpackIgnore: true */ "svg-to-pdfkit")).default;
                break;
            case "blob-stream":
                module = (window as any)?.blobStream ?? (await import(/* webpackIgnore: true */ "blob-stream")).default;
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