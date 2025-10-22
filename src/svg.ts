import { initOptions } from "./options";
import { convertImageURLtoDataURI, triggerDownload, useCSSfromComputedStyles } from "./helpers/helpers";
import { InternalOptions, SVGExportOptions } from "./interfaces";
import { warnError } from "./helpers/warnError";

/**
 * Downloads the SVG element in svg file format.
 * @param svg SVG DOM Element object to be exported. Alternatively, a string of the serialized SVG can be passed 
 * @param svgName title of the svg document to be exported, to be used as file name
 * @param options export options
 * @returns a Promise that can be awaited until the file export completes
 */
export async function downloadSvg(svg: SVGGraphicsElement | string, svgName: string, options?: SVGExportOptions) {
    const svgElement = getSvgElement(svg);
    if (!svgElement) { return; }
    if (svgName == null) {
        svgName = "chart";
    }

    //get svg element
    const _options = initOptions(svgElement, options);

    // -custom images
    const images = svgElement.getElementsByTagName("image");
    const image_promises: Promise<void>[] = [];
    if (images) {
        for (const image of Array.from(images)) {
            if ((image.getAttribute("href") && image.getAttribute("href")?.indexOf("data:") === -1)
                || (image.getAttribute("xlink:href") && image.getAttribute("xlink:href")?.indexOf("data:") === -1)) {
                image_promises.push(convertImageURLtoDataURI(image, _options));
            }
        }
    }

    await Promise.all(image_promises);
    //get svg string
    let svgString = setupSvg(svgElement, svg, _options);

    //add xml declaration
    svgString = "<?xml version=\"1.0\" standalone=\"no\"?>\r\n" + svgString;

    //convert svg string to URI data scheme.
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

    triggerDownload(url, svgName + ".svg");
}

export function getSvgElement(svg: SVGGraphicsElement | string) {
    const div = document.createElement("div");
    div.className = "tempdiv-svg-exportJS";

    let svgElement: SVGGraphicsElement | undefined = undefined;

    if (typeof svg === "string") {
        div.insertAdjacentHTML("beforeend", svg.trim());
        if (div.firstChild instanceof SVGGraphicsElement) {
            svgElement = div.firstChild as SVGGraphicsElement;
        }
    } else {
        svgElement = svg;
    }

    if (!svgElement?.nodeType || svgElement.nodeType !== 1) {
        warnError("Error svg-export: The input svg was not recognized");
        return null;
    }

    const svgClone = svgElement.cloneNode(true) as SVGGraphicsElement;
    svgClone.style.display = "";
    div.appendChild(svgClone);
    div.style.visibility = "hidden";
    div.style.display = "table";
    div.style.position = "absolute";
    document.body.appendChild(div);

    return svgClone;
}

export function setupSvg(svgElement: SVGGraphicsElement, originalSvg: string | SVGGraphicsElement, options: InternalOptions, asElement: true): SVGGraphicsElement;
export function setupSvg(svgElement: SVGGraphicsElement, originalSvg: string | SVGGraphicsElement, options: InternalOptions): string;
export function setupSvg(svgElement: SVGGraphicsElement, originalSvg: string | SVGGraphicsElement, options: InternalOptions, asElement?: boolean): string | SVGGraphicsElement {
    if (options.useCSS && typeof originalSvg === "object") {
        useCSSfromComputedStyles(originalSvg, svgElement, options);
        svgElement.style.display = "";
    }

    options.elementsToExclude.forEach((element) => {
        element.remove();
    });

    svgElement.style.width = "";
    svgElement.style.height = "";
    svgElement.setAttribute("width", options.width?.toString());
    svgElement.setAttribute("height", options.height?.toString());
    svgElement.setAttribute("preserveAspectRatio", "none");
    svgElement.setAttribute("viewBox", (options.originalMinXViewBox) + " " + (options.originalMinYViewBox) + " " + (options.originalWidth) + " " + (options.originalHeight));

    const elements = document.getElementsByClassName("tempdiv-svg-exportJS");
    while (elements.length > 0) {
        elements[0].parentNode?.removeChild(elements[0]);
    }

    //get svg string
    if (asElement) {
        return svgElement;
    } else {
        const serializer = new XMLSerializer();
        //setting currentColor to black matters if computed styles are not used
        let svgString = serializer.serializeToString(svgElement).replace(/currentColor/g, "black");

        //add namespaces
        if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            svgString = svgString.replace(/^<svg/, "<svg xmlns=\"http://www.w3.org/2000/svg\"");
        }
        if (!svgString.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
            svgString = svgString.replace(/^<svg/, "<svg xmlns:xlink=\"http://www.w3.org/1999/xlink\"");
        }

        return svgString;
    }
}