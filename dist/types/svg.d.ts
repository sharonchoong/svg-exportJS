import { InternalOptions, SVGExportOptions } from "./interfaces";
/**
 * Downloads the SVG element in svg file format.
 * @param svg SVG DOM Element object to be exported. Alternatively, a string of the serialized SVG can be passed
 * @param svgName title of the svg document to be exported, to be used as file name
 * @param options export options
 * @returns a Promise that can be awaited until the file export completes
 */
export declare function downloadSvg(svg: SVGGraphicsElement | string, svgName: string, options?: SVGExportOptions): Promise<void>;
/**
 * Validates an HTML element or string as SVG, and returns the SVG element
 * @param svg
 * @returns
 */
export declare function getSvgElement(svg: SVGGraphicsElement | string): SVGGraphicsElement | null;
/**
 * Reviews and sets up the properties of the SVG element or string, and optionally converts it into a serialized string
 * @param svgElement
 * @param originalSvg
 * @param options
 * @param asElement if true, keeps it as an element instead of serializing into a string
 */
export declare function setupSvg(svgElement: SVGGraphicsElement, originalSvg: string | SVGGraphicsElement, options: InternalOptions, asElement: true): SVGGraphicsElement;
export declare function setupSvg(svgElement: SVGGraphicsElement, originalSvg: string | SVGGraphicsElement, options: InternalOptions): string;
