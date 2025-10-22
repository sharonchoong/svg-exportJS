import { InternalOptions } from "../interfaces";
export declare function importDependency(packageName: string, type: string): Promise<any>;
export declare function useCSSfromComputedStyles(element: HTMLElement | SVGElement, elementClone: HTMLElement | SVGElement, options: InternalOptions): void;
export declare function convertImageURLtoDataURI(image: SVGImageElement, options: InternalOptions): Promise<void>;
export declare function getCustomFonts(fontUrls: string[]): Promise<any>[];
export declare function triggerDownload(uri: string, name: string, canvas?: HTMLCanvasElement): void;
