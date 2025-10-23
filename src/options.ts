import { InternalOptions, InternalPDFOptions, InternalPDFPageLayoutMargin, InternalPDFPageLayoutMargins, SVGExportOptions } from "./interfaces";

export function initOptions(svgElement: SVGGraphicsElement, options?: SVGExportOptions): InternalOptions {
    //initialize options
    const _options: InternalOptions = {
        allowCrossOriginImages: false,
        elementsToExclude: [],
        height: 100, 
        originalHeight: 100,
        originalMinXViewBox: "0",
        originalMinYViewBox: "0",
        originalWidth: 100,
        pdfOptions: {
            addTitleToPage: true,
            chartCaption: "",
            customFonts: [],
            pageLayout: { margins: { bottom: 50, left: 50, right: 50, top: 50 } },
            pdfCaptionFontSize: 14,
            pdfTextFontFamily: "Helvetica",
            pdfTitleFontSize: 20,
        },
        scale: 1,
        transparentBackgroundReplace: "white",
        useCSS: true,
        width: 100
    };

    //original size
    _options.originalHeight = svgElement.style.getPropertyValue("height").includes("%")
        || (svgElement.getAttribute("height") && svgElement.getAttribute("height")?.includes("%") )
        ? svgElement.getBBox().height * _options.scale
        : svgElement.getBoundingClientRect().height * _options.scale;
    _options.originalWidth = svgElement.style.getPropertyValue("width").includes("%") 
        || (svgElement.getAttribute("width") && svgElement.getAttribute("width")?.includes("%") )
        ? svgElement.getBBox().width * _options.scale
        : svgElement.getBoundingClientRect().width * _options.scale;

    if (svgElement.getAttribute("viewBox")) {
        const viewBoxValues = Array.from((svgElement.getAttribute("viewBox") ?? "").matchAll(/\b(\d+)\b/g));
        _options.originalMinXViewBox = viewBoxValues[0]?.[0] ?? "0";
        _options.originalMinYViewBox = viewBoxValues[1]?.[0] ?? "0";
        
    } else {
        _options.originalMinXViewBox = "0";
        _options.originalMinYViewBox = "0";
    }

    //custom options
    if (options?.scale && typeof options.scale === "number") {
        _options.scale = options.scale;
    }
    if (!options?.height) {
        _options.height = _options.originalHeight * _options.scale;
    }
    else if (typeof options.height === "number") {
        _options.height = options.height * _options.scale;
    }
    if (!options?.width) {
        _options.width = _options.originalWidth * _options.scale;
    }
    else if (typeof options.width === "number") {
        _options.width = options.width * _options.scale;
    } 
    if (options?.useCSS === false) {
        _options.useCSS = false;
    }
    if (options?.transparentBackgroundReplace) {
        _options.transparentBackgroundReplace = options.transparentBackgroundReplace;
    }
    if (options?.allowCrossOriginImages) {
        _options.allowCrossOriginImages = options.allowCrossOriginImages;
    }
    if (options?.excludeByCSSSelector && typeof(options.excludeByCSSSelector) === "string") {
        _options.elementsToExclude = Array.from(svgElement.querySelectorAll(options.excludeByCSSSelector));
    }

    if (options?.pdfOptions) {
        _options.pdfOptions = initPdfOptions(options, _options);
    }

    return _options;
}

function initPdfOptions(userOptions: SVGExportOptions, internalOptions: InternalOptions): InternalPDFOptions {
    const _pdfOptions = internalOptions.pdfOptions;

    if (userOptions?.pdfOptions)
    {
        Object.keys(_pdfOptions).forEach((opt) => {
            if (userOptions.pdfOptions && opt === "pageLayout") {
                
                const margins = {
                    bottom: (userOptions.pdfOptions.pageLayout as InternalPDFPageLayoutMargins)?.margins?.bottom 
                        ?? (userOptions.pdfOptions.pageLayout as InternalPDFPageLayoutMargin)?.margin 
                        ?? _pdfOptions.pageLayout.margins.bottom,
                    left: (userOptions.pdfOptions.pageLayout as InternalPDFPageLayoutMargins)?.margins?.left 
                        ?? (userOptions.pdfOptions.pageLayout as InternalPDFPageLayoutMargin)?.margin 
                        ?? _pdfOptions.pageLayout.margins.left,
                    right: (userOptions.pdfOptions.pageLayout as InternalPDFPageLayoutMargins)?.margins?.right 
                        ?? (userOptions.pdfOptions.pageLayout as InternalPDFPageLayoutMargin)?.margin 
                        ?? _pdfOptions.pageLayout.margins.right,
                    top: (userOptions.pdfOptions.pageLayout as InternalPDFPageLayoutMargins)?.margins?.top 
                        ?? (userOptions.pdfOptions.pageLayout as InternalPDFPageLayoutMargin)?.margin 
                        ?? _pdfOptions.pageLayout.margins.top
                }

                _pdfOptions.pageLayout = {
                    ...userOptions.pdfOptions.pageLayout ?? {},
                    margins
                }
            }
            else if (userOptions.pdfOptions?.hasOwnProperty(opt) 
                && typeof userOptions.pdfOptions[opt] === typeof _pdfOptions[opt]) {
                if (!!userOptions.pdfOptions[opt] || userOptions.pdfOptions[opt] === 0) {
                    _pdfOptions[opt] = userOptions.pdfOptions[opt];
                }
                
            }
        });
    }

    if (!_pdfOptions.pageLayout.size) {
        _pdfOptions.pageLayout.size = [
            Math.max(300, internalOptions.width) + _pdfOptions.pageLayout.margins.left
                + _pdfOptions.pageLayout.margins.right, 
            Math.max(300, internalOptions.height) + _pdfOptions.pageLayout.margins.top 
                + _pdfOptions.pageLayout.margins.bottom +
                (_pdfOptions.addTitleToPage ? _pdfOptions.pdfTitleFontSize * 2 + 10: 0) + 
                (_pdfOptions.chartCaption !== "" ? _pdfOptions.pdfCaptionFontSize * 4 + 10: 0)
        ];
    }

    return _pdfOptions;
}
