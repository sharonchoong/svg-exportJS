import { getSvgElement, setupSvg } from "./svg";
import { initOptions } from "./options";
import { convertImageURLtoDataURI, triggerDownload, getCustomFonts, importDependency } from "./helpers/helpers";
import { InternalOptions, SVGExportOptions } from "./interfaces";

/**
 * Downloads the SVG element in pdf file format.
 * @param svg SVG DOM Element object to be exported. Alternatively, a string of the serialized SVG can be passed 
 * @param svgName title of the svg document to be exported, to be used as file name
 * @param options export options
 * @returns a Promise that can be awaited until the file export completes
 */
export async function downloadPdf(svg: SVGGraphicsElement | string, svgName: string, options?: SVGExportOptions): Promise<void> {
    //import dependency and check values
    const PDFDocument = await importDependency("pdfkit", "pdf");
    const BlobStream = await importDependency("blob-stream", "pdf");

    //get svg element
    const svgElement = getSvgElement(svg);
    if (!svgElement) { return; }
    const _svgName = svgName ?? "chart";
    const _options = initOptions(svgElement, options);
    const svgCloned = setupSvg(svgElement, svg, _options, true);

    //create PDF doc
    const doc = new PDFDocument(_options.pdfOptions.pageLayout);
    const stream = doc.pipe(BlobStream());

    // -custom images
    const images = svgElement.getElementsByTagName("image");
    const image_promises: Promise<void>[] = [];
    if (images) {
        for (const image of Array.from(images)) {
            if ((image.getAttribute("href") && !image.getAttribute("href")?.includes("data:"))
                || (image.getAttribute("xlink:href") && !image.getAttribute("xlink:href")?.includes("data:"))) {
                image_promises.push(convertImageURLtoDataURI(image, _options));
            }
        }
    }

    // -custom fonts
    await Promise.all(image_promises);
    if (_options.pdfOptions.customFonts.length > 0) {
        const font_promises = getCustomFonts(_options.pdfOptions.customFonts.map((d) => d.url));
        const fonts = await Promise.all(font_promises);
        fonts.forEach((font, index: number) => {
            const thisPdfOptions = _options.pdfOptions.customFonts[index];
            //this ensures that the font fallbacks are removed from inline CSS that contain custom fonts, 
            // as fonts with fallbacks are not parsed correctly by SVG-to-PDFKit
            const fontStyledElements = svgCloned.querySelectorAll("[style*=\"" + thisPdfOptions.fontName + "\"]");
            fontStyledElements.forEach((element) => {
                if (element instanceof HTMLElement) {
                    element.style.fontFamily = thisPdfOptions.fontName;
                }
            });
            if ((thisPdfOptions.url.includes(".ttc") || thisPdfOptions.url.includes(".dfont")) && thisPdfOptions.styleName) {
                doc.registerFont(thisPdfOptions.fontName, font, thisPdfOptions.styleName);
            }
            else {
                doc.registerFont(thisPdfOptions.fontName, font);
            }
        });
    }

    await fillPDFDoc(doc, _svgName, svgCloned, _options);
    doc.end();

    await new Promise<void>(resolve => {
        stream.on("finish", () => {
            const url = stream.toBlobURL("application/pdf");
            triggerDownload(url, _svgName + ".pdf");
            resolve();
        });
    })
    
}

/**
 * Fill the given PDF document with the svg content
 * @param doc 
 * @param svgName 
 * @param svg 
 * @param options 
 */
async function fillPDFDoc(doc, svgName: string, svg: SVGGraphicsElement, options: InternalOptions): Promise<void> {
    // -title
    if (options.pdfOptions.addTitleToPage) {
        doc.font(options.pdfOptions.pdfTextFontFamily)
            .fontSize(options.pdfOptions.pdfTitleFontSize)
        if (Array.isArray(options.pdfOptions.pageLayout.size)) {
            doc.text(svgName,
                {
                    width: options.pdfOptions.pageLayout.size[0] - options.pdfOptions.pageLayout.margins.left 
                        - options.pdfOptions.pageLayout.margins.right
                });
        }
    }
    // -svg
    const SVGtoPDF = await importDependency("svg-to-pdfkit", "pdf");
    SVGtoPDF(doc, svg, options.pdfOptions.pageLayout.margins.left, doc.y + 10,
        { width: options.width, height: options.height, preserveAspectRatio: "none", useCSS: options.useCSS });

    // -caption
    if (options.pdfOptions.chartCaption !== "") {
        doc.font(options.pdfOptions.pdfTextFontFamily)
            .fontSize(options.pdfOptions.pdfCaptionFontSize)
        if (Array.isArray(options.pdfOptions.pageLayout.size)) {
            doc.text(options.pdfOptions.chartCaption, options.pdfOptions.pageLayout.margins.left,
                options.pdfOptions.pageLayout.size[1] - options.pdfOptions.pageLayout.margins.bottom 
                    - options.pdfOptions.pdfCaptionFontSize * 4,
                {
                    width: options.pdfOptions.pageLayout.size[0] - options.pdfOptions.pageLayout.margins.left 
                        - options.pdfOptions.pageLayout.margins.right
                });
        } 
    }
}
