import { InternalOptions } from "../interfaces";
import { warnError } from "./warnError";
import { importDependencyInternal } from "./importDependencyUMD";

/**
 * Attempt to import optional third-party dependency, and show an error in the console if that fails.
 * @param packageName 
 * @param type 
 * @returns 
 */
export async function importDependency(packageName: string, type: string): Promise<any> {
    return importDependencyInternal(packageName, type);
}

/**
 * Retrieves the computed styles of the given element and sets these styles to the element inline
 * @param element 
 * @param elementClone 
 * @param options 
 * @returns 
 */
export function useCSSfromComputedStyles(element: HTMLElement | SVGElement, 
        elementClone: HTMLElement | SVGElement, options: InternalOptions): void {
    if (typeof getComputedStyle !== "function") {
        warnError("Warning svg-export: this browser is not able to get computed styles");
        return;
    }

    for (const option of options.elementsToExclude) {
        if (option === elementClone) { // prevent continuation of this function if user wants to exclude the child element 
            return;
        }
    }

    const compStyles = window.getComputedStyle(element);
    if (compStyles.length > 0) {
        for (const compStyle of Array.from(compStyles)) {
            if (!["width", "height", "inline-size", "block-size", "mask-size"].includes(compStyle)) {
                elementClone.style.setProperty(compStyle, compStyles.getPropertyValue(compStyle));
            }
        };
    }

    element.childNodes.forEach((child: ChildNode, index: number) => {
        if (child.nodeType === 1/*Node.ELEMENT_NODE*/ 
                && (child instanceof SVGElement || child instanceof HTMLElement)) {
            const clone = elementClone.childNodes[index];
            if (clone instanceof SVGElement || clone instanceof HTMLElement) {
                useCSSfromComputedStyles(child, clone, options);
            }
        }
    });
}

/**
 * obtain the data URI of an image element and set the image's `href` to that data URI
 * @param image 
 * @param options 
 * @returns 
 */
export function convertImageURLtoDataURI(image: SVGImageElement, options: InternalOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const newImage = new Image();

        newImage.onload = (event) => {
            const imageElement = event.target as HTMLImageElement;
            const canvas = document.createElement("canvas");
            canvas.width = imageElement.naturalWidth || Number(imageElement.getAttribute("width")) 
                || Number(imageElement.style.getPropertyValue("width")) || 300;
            canvas.height = imageElement.naturalHeight || Number(imageElement.getAttribute("height")) 
                || Number(imageElement.style.getPropertyValue("height")) || 300;

            canvas.getContext("2d")?.drawImage(imageElement, 0, 0);

            const dataURI = canvas.toDataURL("image/png");
            image.setAttribute("href", dataURI);
            resolve();
        };
        if (options.allowCrossOriginImages) {
            newImage.crossOrigin = "anonymous";
        }
        const src = image.getAttribute("href") || image.getAttributeNS("http://www.w3.org/1999/xlink", "href");
        if (src) {
            newImage.src = src;
        }
    });
}

/**
 * Load the font from its url and obtain the font in binary data format
 * @param fontUrls 
 * @returns 
 */
export function getCustomFonts(fontUrls: string[]): Promise<any>[] {
    const promises: Promise<any>[] = [];
    fontUrls.forEach((fontUrl) => {
        const promise = new Promise((resolve) => {
            const req = new XMLHttpRequest();
            req.onreadystatechange = () => {
                if (req.readyState === 4 && req.status === 200) {
                    resolve(req.response);
                }
            };
            req.open("GET", fontUrl, true);
            req.responseType = "arraybuffer";
            req.send(null);
        });
        promises.push(promise);
    });
    return promises;
}

/**
 * Trigger a download of a file (represented by data URI) in the browser 
 * @param uri 
 * @param name 
 * @param canvas 
 */
export function triggerDownload(uri: string, name: string, canvas?: HTMLCanvasElement): void {
    const sanitizedName = name.replace(/[/\\?%*:|"<>]/g, "_");

    const link = document.createElement("a");
    link.download = sanitizedName;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
