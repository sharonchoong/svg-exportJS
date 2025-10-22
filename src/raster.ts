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
export async function downloadPng(svg: SVGGraphicsElement | string, svgName: string, options?: SVGExportOptions) {
    return downloadRaster(svg, svgName, "png", options);
}

/**
 * Downloads the SVG element in jpeg file format.
 * @param svg SVG DOM Element object to be exported. Alternatively, a string of the serialized SVG can be passed 
 * @param svgName title of the svg document to be exported, to be used as file name
 * @param options export options
 * @returns a Promise that can be awaited until the file export completes
 */
export async function downloadJpeg(svg: SVGGraphicsElement | string, svgName: string, options?: SVGExportOptions) {
    return downloadRaster(svg, svgName, "jpeg", options);
}

async function downloadRaster(svg: SVGGraphicsElement | string, svgName: string, imageType: "png" | "jpeg", options?: SVGExportOptions) {
    //import dependency and check values
    const canvg = await importDependency("canvg", imageType);
    if (imageType !== "png" && imageType !== "jpeg") {
        imageType = "png";
    }
    const svgElement = getSvgElement(svg);
    if (!svgElement) { return; }
    if (svgName == null) {
        svgName = "chart";
    }

    //get canvas and svg element.
    const canvas = document.createElement("canvas");
    if (!(options && (options.width || options.height))) {
        if (!options) {
            options = {};
        }
        options.scale = 10;
    }
    
    const _options = initOptions(svgElement, options);
    let svgString = setupSvg(svgElement, svg, _options);

    if (imageType === "jpeg") {
        //change transparent background to white
        svgString = svgString.replace(">", "><rect x=\"0\" y=\"0\" width=\"" + _options.width + "\" height=\"" + _options.height
            + "\" fill=\"" + _options.transparentBackgroundReplace + "\"/>");
    }

    const ctx = canvas!.getContext("2d");
    const v = canvg.Canvg.fromString(ctx, svgString, { anonymousCrossOrigin: _options.allowCrossOriginImages });
    v.start();
    await v.ready();
    const image = canvas.toDataURL("image/" + imageType);
    triggerDownload(image, svgName + "." + imageType, canvas);
}