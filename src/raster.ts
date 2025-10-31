import { importDependency, triggerDownload } from "./helpers/helpers";
import { getSvgElement, setupSvg } from "./svg";
import { initOptions } from "./options";
import { SVGExportOptions } from "./interfaces";

/**
 * Downloads the SVG element in png file format.
 * @param svg SVG DOM Element object to be exported. Alternatively, a string of the serialized SVG can be passed 
 * @param svgName title of the svg document to be exported, to be used as file name
 * @param options export options
 * @returns a Promise that can be awaited until the file export completes
 */
export async function downloadPng(svg: SVGGraphicsElement | string, svgName: string, options?: SVGExportOptions): Promise<void> {
    return downloadRaster(svg, svgName, "png", options ?? {});
}

/**
 * Downloads the SVG element in jpeg file format.
 * @param svg SVG DOM Element object to be exported. Alternatively, a string of the serialized SVG can be passed 
 * @param svgName title of the svg document to be exported, to be used as file name
 * @param options export options
 * @returns a Promise that can be awaited until the file export completes
 */
export async function downloadJpeg(svg: SVGGraphicsElement | string, svgName: string, options?: SVGExportOptions): Promise<void> {
    return downloadRaster(svg, svgName, "jpeg", options ?? {});
}

/**
 * Downloads the SVG element in jpeg or png file format.
 * @param svg 
 * @param svgName 
 * @param imageType 
 * @param options 
 * @returns 
 */
async function downloadRaster(svg: SVGGraphicsElement | string, svgName: string, 
        imageType: "png" | "jpeg", options: SVGExportOptions): Promise<void> {
    //import dependency and check values
    const canvg = await importDependency("canvg", imageType);
    const svgElement = getSvgElement(svg);
    if (!svgElement) { return; }
    const _svgName = svgName ?? "chart";

    //get canvas and svg element.
    const canvas = document.createElement("canvas");
    if (!(options && (options.width || options.height))) {
        options.scale = 10;
    }
    
    const _options = initOptions(svgElement, options);

    const nestedSvgs = svgElement.getElementsByTagName("svg");
    for (const nestedSvg of nestedSvgs) {
        const viewBoxValues = Array.from((nestedSvg.getAttribute("viewBox") ?? "").matchAll(/\b(\d+)\b/g));
        let nestedSvgWidth = nestedSvg.getAttribute("width");
        let nestedSvgHeight = nestedSvg.getAttribute("height");

        if (!nestedSvgHeight) {
            if (nestedSvgWidth && viewBoxValues[3]?.[0]) {
                nestedSvg.setAttribute("height", (Number(nestedSvgWidth) / Number(viewBoxValues[2]?.[0]) 
                    * Number(viewBoxValues[3]?.[0])).toString());
            } else {
                nestedSvg.setAttribute("height", _options.originalHeight.toString());
            }
        }
        
        if (!nestedSvgWidth) {
            if (nestedSvgHeight && !nestedSvgWidth && viewBoxValues[2]?.[0]) {
                nestedSvg.setAttribute("width", (Number(nestedSvgHeight) / Number(viewBoxValues[3]?.[0]) 
                    * Number(viewBoxValues[2]?.[0])).toString());
            } else {
                nestedSvg.setAttribute("width", _options.originalWidth.toString());
            }
        }
    }
    
    let svgString = setupSvg(svgElement, svg, _options);

    const hasBackgroundColor = svgElement.style.backgroundColor 
        && svgElement.style.backgroundColor.toLowerCase().replace(/\s/g, "") !== "rgba(0,0,0,0)" 
        && svgElement.style.backgroundColor.toLowerCase() !== "transparent";

    if (imageType === "jpeg") {
        //change transparent background to white
        svgString = svgString.replace(">", "><rect x=\"0\" y=\"0\" width=\"" 
            + _options.width + "\" height=\"" + _options.height
            + "\" fill=\"" + (hasBackgroundColor ? svgElement.style.backgroundColor : _options.transparentBackgroundReplace) + "\" />");
    } else if (hasBackgroundColor) {
        svgString = svgString.replace(">", "><rect x=\"0\" y=\"0\" width=\"" 
            + _options.width + "\" height=\"" + _options.height + "\" " 
            + "fill=\"" + svgElement.style.backgroundColor + "\" "
            + "/>");
    }

    const ctx = canvas.getContext("2d");
    const v = canvg.Canvg.fromString(ctx, svgString, { anonymousCrossOrigin: _options.allowCrossOriginImages });
    v.start();
    await v.ready();
    const image = canvas.toDataURL("image/" + imageType, 1);
    triggerDownload(image, _svgName + "." + imageType);
}
