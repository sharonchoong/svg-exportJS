/*
 * svg-export.js - Javascript SVG parser and renderer on Canvas
 * version 1.0.0
 * MIT Licensed
 * Sharon Choong (https://sharonchoong.github.io/about.html)
 * https://sharonchoong.github.io/svg-export
 *
 */

(function (global, factory) {
    /*global globalThis a*/ 
    typeof exports === "object" && typeof module !== "undefined" ? factory(exports) :
    typeof define === "function" && define.amd ? define(["exports"], factory) :
    (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.svgExport = global.svgExport || {}));
} (this, (function (exports) {
    "use strict";
    var version = "1.0.0";
    var _options = {};

    function setPdfOptions(options) {
        if (options && options.pdfOptions)
        {
            Object.keys(_options.pdfOptions).forEach(function(opt) {
                if (options.pdfOptions.hasOwnProperty(opt) && typeof options.pdfOptions[opt] === typeof _options.pdfOptions[opt]) {
                    if (options.pdfOptions[opt] === "") { return; }
                    _options.pdfOptions[opt] = options.pdfOptions[opt];
                }
            });
            
            if (!_options.pdfOptions.pageLayout.margin) {
                _options.pdfOptions.pageLayout.margin = 50;
            }
            if (!_options.pdfOptions.pageLayout.margins) {
                _options.pdfOptions.pageLayout.margins = {};
            }
        }
        _options.pdfOptions.pageLayout.margins.top = _options.pdfOptions.pageLayout.margins.top || _options.pdfOptions.pageLayout.margin;
        _options.pdfOptions.pageLayout.margins.bottom = _options.pdfOptions.pageLayout.margins.bottom || _options.pdfOptions.pageLayout.margin;
        _options.pdfOptions.pageLayout.margins.left = _options.pdfOptions.pageLayout.margins.left || _options.pdfOptions.pageLayout.margin;
        _options.pdfOptions.pageLayout.margins.right = _options.pdfOptions.pageLayout.margins.top || _options.pdfOptions.pageLayout.margin;
        delete _options.pdfOptions.pageLayout.margin; 
        if (!(options && _options.pdfOptions.pageLayout.size)) {
            _options.pdfOptions.pageLayout.size = [
                Math.max(300, _options.width) + _options.pdfOptions.pageLayout.margins.left + _options.pdfOptions.pageLayout.margins.right, 
                Math.max(300, _options.height) + _options.pdfOptions.pageLayout.margins.top + _options.pdfOptions.pageLayout.margins.bottom +
                    (_options.pdfOptions.addTitleToPage ? _options.pdfOptions.pdfTitleFontSize * 2 + 10: 0) + 
                    (_options.pdfOptions.chartCaption !== "" ? _options.pdfOptions.pdfCaptionFontSize * 4 + 10: 0)
            ];
        }
    }

    function setOptions(svgSelector, options) {
        //initialize options
        _options = {
            originalWidth: 100,
            originalHeight: 100,
            width: 100,
            height: 100, 
            scale: 1,
            useCSS: true,
            transparentBackgroundReplace: "white",
            pdfOptions: {
                customFonts: [],
                pageLayout: { margin: 50, margins: {} },
                addTitleToPage: true,
                chartCaption: "",
                pdfTextFontFamily: "Helvetica",
                pdfTitleFontSize: 20,
                pdfCaptionFontSize: 14
            }
        };

        //original size
        _options.originalHeight = document.querySelector(svgSelector).style.getPropertyValue("height").indexOf("%") !== -1 
            || document.querySelector(svgSelector).getAttribute("height").indexOf("%") !== -1 
            ? document.querySelector(svgSelector).getBBox().height * _options.scale
            : document.querySelector(svgSelector).getBoundingClientRect().height * _options.scale;
        _options.originalWidth = document.querySelector(svgSelector).style.getPropertyValue("width").indexOf("%") !== -1 
            || document.querySelector(svgSelector).getAttribute("width").indexOf("%") !== -1
            ? document.querySelector(svgSelector).getBBox().width * _options.scale
            : document.querySelector(svgSelector).getBoundingClientRect().width * _options.scale;

        //custom options
        if (options && options.scale && typeof options.scale === "number") {
            _options.scale = options.scale;
        }
        if (!options || !options.height) {
            _options.height = _options.originalHeight * _options.scale;
        }
        else if (typeof options.height === "number") {
            _options.height = options.height * _options.scale;
        }
        if (!options || !options.width) {
            _options.width = _options.originalWidth * _options.scale;
        }
        else if (typeof options.width === "number") {
            _options.width = options.width * _options.scale;
        } 
        if (options && options.useCSS === false) {
            _options.useCSS = false;
        }
        if (options && options.transparentBackgroundReplace) {
            _options.transparentBackgroundReplace = options.transparentBackgroundReplace;
        }

        setPdfOptions(options);
    }

    function useCSSfromComputedStyles(element, elementClone) {
        if (typeof getComputedStyle !== "function"){
            alert("Warning svg-export: this browser is not able to get computed styles");
            return;
        } 
        element.children.forEach(function(child, index){
            useCSSfromComputedStyles(child, elementClone.children[parseInt(index)]);
        });
        
        var compStyles = window.getComputedStyle(element);
        compStyles.forEach(function (compStyle){
            if (["width", "height", "inline-size", "block-size"].indexOf(compStyle) === -1 ) {
                elementClone.style.setProperty(compStyle, compStyles.getPropertyValue(compStyle));
            }
        });
    }

    function getSvg(svgSelector, asString = true)
    {
        var svg = document.querySelector(svgSelector).cloneNode(true);
        if (_options.useCSS) {
            useCSSfromComputedStyles(document.querySelector(svgSelector), svg);
        }

        svg.style.width = null;
        svg.style.height = null;
        svg.setAttribute("width", _options.width);
        svg.setAttribute("height", _options.height);
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("viewBox", "0 0 " + (_options.originalWidth) + " " + (_options.originalHeight));

        //get svg string
        if (asString)
        {
            var serializer = new XMLSerializer();
            //setting currentColor to black matters if computed styles are not used
            var svgString = serializer.serializeToString(svg).replace(/currentColor/g, "black");

            //add namespaces
            if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                svgString = svgString.replace(/^<svg/, "<svg xmlns=\"http://www.w3.org/2000/svg\"");
            }
            if (!svgString.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
                svgString = svgString.replace(/^<svg/, "<svg xmlns:xlink=\"http://www.w3.org/1999/xlink\"");
            }
    
            return svgString;
        }
        return svg;
    }

    function getCustomFonts(fontUrls) {
        var promises = [];
        fontUrls.forEach(function(fontUrl) {
            var promise = new Promise(function(resolve, reject) {
                var req = new XMLHttpRequest();
                req.onreadystatechange = function() { 
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

    function triggerDownload(uri, name, canvas) {
        name = name.replace(/[/\\?%*:|"<>]/g, "_");
        if (navigator.msSaveBlob) {
            var binary = (decodeURIComponent(uri.split(",")[1])), array = [];
            var mimeString = uri.split(",")[0].split(":")[1].split(";")[0];
            for (var i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i));
            }
            var blob = null;
            if (canvas != null) {
                blob = canvas.msToBlob();
            } else {
                blob = new Blob([new Uint8Array(array)], { type: mimeString });
            }
            return navigator.msSaveBlob(blob, name);
        } else {
            var link = document.createElement("a");
            link.download = name;
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function downloadSvg(svgSelector, svgName, options) {
        if (svgName == null) {
            svgName = "chart";
        }

        //get svg element
        setOptions(svgSelector, options);
        var svgString = getSvg(svgSelector);

        //add xml declaration
        svgString = "<?xml version=\"1.0\" standalone=\"no\"?>\r\n" + svgString;

        //convert svg string to URI data scheme.
        var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

        triggerDownload(url, svgName + ".svg");
    }

    function downloadRaster(svgSelector, svgName, options, imageType) {
        //check dependency and values
        if (typeof canvg !== "object")
        {
            alert("Error svg-export: PNG/JPEG export requires Canvg.js");
            return;
        }
        imageType = imageType.toLowerCase().replace("jpg", "jpeg");
        if (imageType !== "png" && imageType !== "jpeg") {
            imageType = "png";
        }

        if (svgName == null) {
            svgName = "chart";
        }

        //get canvas and svg element.
        var canvas = document.createElement("canvas");
        if (!(options && (options.width || options.height))) {
            if (!options) {
                options = {};
            }
            options.scale = 10;
        }
        setOptions(svgSelector, options);
        var svgString = getSvg(svgSelector);

        if (imageType === "jpeg")
        {
            //change transparent background to white
            svgString = svgString.replace(">", "><rect x=\"0\" y=\"0\" width=\"" + _options.width + "\" height=\"" + _options.height 
                + "\" fill=\"" + _options.transparentBackgroundReplace + "\"/>");
        }

        var ctx = canvas.getContext("2d");
        canvg.Canvg.fromString(ctx, svgString).start();

        var image = canvas.toDataURL("image/" + imageType);
        triggerDownload(image, svgName + "." + imageType, canvas);
    }
    function downloadPng(svgSelector, svgName, options) {
        downloadRaster(svgSelector, svgName, options, "png");
    }
    function downloadJpeg(svgSelector, svgName, options) {
        downloadRaster(svgSelector, svgName, options, "jpeg");
    }

    function fillPDFDoc(doc, svgName, svg) {
        // -title
        if (_options.pdfOptions.addTitleToPage){
            doc.font(_options.pdfOptions.pdfTextFontFamily)
                .fontSize(_options.pdfOptions.pdfTitleFontSize)
                .text(svgName,
                { 
                    width: _options.pdfOptions.pageLayout.size[0] - _options.pdfOptions.pageLayout.margins.left - _options.pdfOptions.pageLayout.margins.right
                });              
        }
        // -svg
        SVGtoPDF(doc, svg, _options.pdfOptions.pageLayout.margins.left, doc.y + 10, 
            { width: _options.width, height: _options.height, preserveAspectRatio: "none", useCSS: _options.useCSS });

        // -caption
        if (_options.pdfOptions.chartCaption !== ""){
            doc.font(_options.pdfOptions.pdfTextFontFamily)
                .fontSize(_options.pdfOptions.pdfCaptionFontSize)
                .text(_options.pdfOptions.chartCaption, _options.pdfOptions.pageLayout.margins.left, 
                    _options.pdfOptions.pageLayout.size[1] - _options.pdfOptions.pageLayout.margins.bottom - _options.pdfOptions.pdfCaptionFontSize * 4,
                { 
                    width: _options.pdfOptions.pageLayout.size[0] - _options.pdfOptions.pageLayout.margins.left - _options.pdfOptions.pageLayout.margins.right
                });              
        }
    }
    function downloadPdf(svgSelector, svgName, options) {
        //check dependency and values
        if (typeof PDFDocument !== "function" || typeof SVGtoPDF !== "function" || typeof blobStream !== "function")
        {
            alert("Error svg-export: PDF export requires PDFKit.js, blob-stream and SVG-to-PDFKit");
            return;
        }
        if (svgName == null) {
            svgName = "chart";
        }

        //get svg element
        setOptions(svgSelector, options);
        var svg = getSvg(svgSelector, false);

        //create PDF doc
        var doc = new PDFDocument(_options.pdfOptions.pageLayout);
        var stream = doc.pipe(blobStream());
        
        // -custom fonts
        if (_options.pdfOptions.customFonts.length > 0){
            var promises = getCustomFonts(_options.pdfOptions.customFonts.map(function(d) { return d.url; }));
            Promise.all(promises).then(function(fonts) {
                fonts.forEach(function(font, index) {
                    var thisPdfOptions = _options.pdfOptions.customFonts[parseInt(index)];
                    //this ensures that the font fallbacks are removed from inline CSS that contain custom fonts, as fonts with fallbacks are not parsed correctly by SVG-to-PDFKit
                    var fontStyledElements = svg.querySelectorAll("[style*=\"" +thisPdfOptions.fontName + "\"]");
                    fontStyledElements.forEach(function(element) {
                        element.style.fontFamily = thisPdfOptions.fontName;
                    });
                    if ((thisPdfOptions.url.indexOf(".ttc") !== -1 || thisPdfOptions.url.indexOf(".dfont") !== -1) && thisPdfOptions.styleName) {
                        doc.registerFont(thisPdfOptions.fontName, font, thisPdfOptions.styleName);
                    }
                    else {
                        doc.registerFont(thisPdfOptions.fontName, font);
                    }
                });
                fillPDFDoc(doc, svgName, svg);
                doc.end();
            });
        } else {
            fillPDFDoc(doc, svgName, svg);
            doc.end();
        }

        stream.on("finish", function() {
            var url = stream.toBlobURL("application/pdf");
            triggerDownload(url, svgName + ".pdf");
        });
    }

    exports.version = version;
    exports.downloadSvg = downloadSvg;
    exports.downloadPng = downloadPng;
    exports.downloadJpeg = downloadJpeg;
    exports.downloadPdf = downloadPdf;
    Object.defineProperty(exports, "__esModule", { value: true });
})
));