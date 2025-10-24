import { InternalOptions } from "../interfaces";
/**
 * Attempt to import optional third-party dependency, and show an error in the console if that fails.
 * @param packageName
 * @param type
 * @returns
 */
export declare function importDependency(packageName: string, type: string): Promise<any>;
/**
 * Retrieves the computed styles of the given element and sets these styles to the element inline
 * @param element
 * @param elementClone
 * @param options
 * @returns
 */
export declare function useCSSfromComputedStyles(element: HTMLElement | SVGElement, elementClone: HTMLElement | SVGElement, options: InternalOptions): void;
/**
 * obtain the data URI of an image element and set the image's `href` to that data URI
 * @param image
 * @param options
 * @returns
 */
export declare function convertImageURLtoDataURI(image: SVGImageElement, options: InternalOptions): Promise<void>;
/**
 * Load the font from its url and obtain the font in binary data format
 * @param fontUrls
 * @returns
 */
export declare function getCustomFonts(fontUrls: string[]): Promise<any>[];
/**
 * Trigger a download of a file (represented by data URI) in the browser
 * @param uri
 * @param name
 */
export declare function triggerDownload(uri: string, name: string): void;
