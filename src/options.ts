import { InternalOptions, InternalPDFOptions, SVGExportOptions } from "./interfaces";

export function initOptions(svgElement: SVGGraphicsElement, options?: SVGExportOptions): InternalOptions {
    //initialize options
    const _options: InternalOptions = {
        originalWidth: 100,
        originalHeight: 100,
        originalMinXViewBox: "0",
        originalMinYViewBox: "0",
        width: 100,
        height: 100, 
        scale: 1,
        useCSS: true,
        transparentBackgroundReplace: "white",
        allowCrossOriginImages: false,
        elementsToExclude: [],
        pdfOptions: {
            customFonts: [],
            pageLayout: { margin: 50 } as any,
            addTitleToPage: true,
            chartCaption: "",
            pdfTextFontFamily: "Helvetica",
            pdfTitleFontSize: 20,
            pdfCaptionFontSize: 14
        }
    };

    //original size
    _options.originalHeight = svgElement.style.getPropertyValue("height").indexOf("%") !== -1 
        || (svgElement.getAttribute("height") && svgElement.getAttribute("height")?.indexOf("%") !== -1 )
        ? svgElement.getBBox().height * _options.scale
        : svgElement.getBoundingClientRect().height * _options.scale;
    _options.originalWidth = svgElement.style.getPropertyValue("width").indexOf("%") !== -1 
        || (svgElement.getAttribute("width") && svgElement.getAttribute("width")?.indexOf("%") !== -1 )
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
                _pdfOptions.pageLayout.margins = {
                    top: userOptions.pdfOptions.pageLayout?.margins?.top ?? userOptions.pdfOptions.pageLayout?.margin ?? _pdfOptions.pageLayout.margin!,
                    bottom: userOptions.pdfOptions.pageLayout?.margins?.bottom ?? userOptions.pdfOptions.pageLayout?.margin ?? _pdfOptions.pageLayout.margin!,
                    left: userOptions.pdfOptions.pageLayout?.margins?.left ?? userOptions.pdfOptions.pageLayout?.margin ?? _pdfOptions.pageLayout.margin!,
                    right: userOptions.pdfOptions.pageLayout?.margins?.right ?? userOptions.pdfOptions.pageLayout?.margin ?? _pdfOptions.pageLayout.margin!
                }

                delete _pdfOptions.pageLayout.margin;
                const layoutExMargins = { ...(userOptions.pdfOptions.pageLayout ?? {}) };
                delete layoutExMargins.margin;
                delete layoutExMargins.margins;
                _pdfOptions.pageLayout = {
                    ..._pdfOptions.pageLayout,
                    ...layoutExMargins
                }
            }
            else if (userOptions.pdfOptions?.hasOwnProperty(opt) && typeof userOptions.pdfOptions[opt] === typeof _pdfOptions[opt]) {
                if (!!userOptions.pdfOptions[opt] || userOptions.pdfOptions[opt] === 0) {
                    _pdfOptions[opt] = userOptions.pdfOptions[opt];
                }
                
            }
        });
    }

    if (!_pdfOptions.pageLayout.size) {
        _pdfOptions.pageLayout.size = [
            Math.max(300, internalOptions.width) + _pdfOptions.pageLayout.margins!.left! + _pdfOptions.pageLayout.margins!.right!, 
            Math.max(300, internalOptions.height) + _pdfOptions.pageLayout.margins!.top! + _pdfOptions.pageLayout.margins!.bottom! +
                (_pdfOptions.addTitleToPage ? _pdfOptions.pdfTitleFontSize * 2 + 10: 0) + 
                (_pdfOptions.chartCaption !== "" ? _pdfOptions.pdfCaptionFontSize * 4 + 10: 0)
        ];
    }

    return _pdfOptions;
}