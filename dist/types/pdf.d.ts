import { SVGExportOptions } from "./interfaces";
/**
 * Downloads the SVG element in pdf file format.
 * @param svg SVG DOM Element object to be exported. Alternatively, a string of the serialized SVG can be passed
 * @param svgName title of the svg document to be exported, to be used as file name
 * @param options export options
 * @returns a Promise that can be awaited until the file export completes
 */
export declare function downloadPdf(svg: SVGGraphicsElement | string, svgName: string, options?: SVGExportOptions): Promise<void>;
