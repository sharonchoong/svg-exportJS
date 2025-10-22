import { InternalOptions } from "../interfaces";
import { warnError } from "./warnError";
import { importDependencyInternal } from "./importDependencyUMD";

export async function importDependency(packageName: string, type: string): Promise<any> {
    return importDependencyInternal(packageName, type);
}

export function useCSSfromComputedStyles(element: HTMLElement | SVGElement, elementClone: HTMLElement | SVGElement, options: InternalOptions) {
    if (typeof getComputedStyle !== "function") {
        warnError("Warning svg-export: this browser is not able to get computed styles");
        return;
    }

    for (let i = 0; i < options.elementsToExclude.length; i++) {
        if (options.elementsToExclude[i] === elementClone) { // prevent continuation of this function if user wants to exclude the child element 
            return;
        }
    }

    const compStyles = window.getComputedStyle(element);
    if (compStyles.length > 0) {
        for (const compStyle of Array.from(compStyles)) {
            if (["width", "height", "inline-size", "block-size", "mask-size"].indexOf(compStyle) === -1) {
                elementClone.style.setProperty(compStyle, compStyles.getPropertyValue(compStyle));
            }
        };
    }

    element.childNodes.forEach((child: ChildNode, index: number) => {
        if (child.nodeType === 1/*Node.ELEMENT_NODE*/ && (child instanceof SVGElement || child instanceof HTMLElement)) {
            const clone = elementClone.childNodes[index];
            if (clone instanceof SVGElement || clone instanceof HTMLElement) {
                useCSSfromComputedStyles(child, clone, options);
            }
        }
    });
}

export function convertImageURLtoDataURI(image: SVGImageElement, options: InternalOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const newImage = new Image();

        newImage.onload = (event) => {
            const imageElement = event.target as HTMLImageElement;
            const canvas = document.createElement("canvas");
            canvas.width = imageElement.naturalWidth || Number(imageElement.getAttribute("width")) || Number(imageElement.style.getPropertyValue("width")) || 300;
            canvas.height = imageElement.naturalHeight || Number(imageElement.getAttribute("height")) || Number(imageElement.style.getPropertyValue("height")) || 300;

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

export function triggerDownload(uri: string, name: string, canvas?: HTMLCanvasElement): void {
    name = name.replace(/[/\\?%*:|"<>]/g, "_");
    if (navigator["msSaveBlob"]) { // for Internet Explorer
        const binary = (decodeURIComponent(uri.split(",")[1]));
        const array: number[] = [];
        const mimeString = uri.split(",")[0].split(":")[1].split(";")[0];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        let blob: Blob | undefined = undefined;
        if ((canvas as any)?.msToBlob) {
            blob = (canvas as any).msToBlob(); // legacy for IE
        } else {
            blob = new Blob([new Uint8Array(array)], { type: mimeString });
        }
        (navigator as any).msSaveBlob(blob, name);
    } else {
        const link = document.createElement("a");
        link.download = name;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
