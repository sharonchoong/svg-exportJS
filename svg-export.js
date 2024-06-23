/*
 * svg-export.js - Javascript SVG parser and renderer on Canvas
 * version 1.2.0
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
    var version = "1.2.0";
    var _options = {};

    function warnError(str) {
        if (typeof console !== undefined && typeof console.warn === 'function') {
            console.warn(str);
        }
    };

    function getSvgElement(svg) {
        var div = document.createElement("div");
        div.className = "tempdiv-svg-exportJS";

        if (typeof svg === "string") {
            div.insertAdjacentHTML("beforeend", svg.trim());
            svg = div.firstChild;
        } 
        
        if (!svg.nodeType || svg.nodeType !== 1) {
            warnError("Error svg-export: The input svg was not recognized");
            return null;
        } 

        var svgClone = svg.cloneNode(true);
        svgClone.style.display = null;
        div.appendChild(svgClone);
        div.style.visibility = "hidden";
        div.style.display = "table";
        div.style.position = "absolute";
        document.body.appendChild(div);

        return svgClone;
    }

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
    
    function setOptions(svgElement, options) {
        //initialize options
        _options = {
            originalWidth: 100,
            originalHeight: 100,
            originalMinXViewBox: 0,
            originalMinYViewBox: 0,
            width: 100,
            height: 100, 
            scale: 1,
            useCSS: true,
            transparentBackgroundReplace: "white",
            allowCrossOriginImages: false,
            elementsToExclude: [],
            pdfOptions: {
                customFonts: [],
                pageLayout: { margin: 50, margins: {} },
                addTitleToPage: true,
                chartCaption: "",
                pdfTextFontFamily: "Helvetica",
                pdfTitleFontSize: 20,
                pdfCaptionFontSize: 14
            },
            onDone: null
        };

        //original size
        _options.originalHeight = svgElement.style.getPropertyValue("height").indexOf("%") !== -1 
            || (svgElement.getAttribute("height") && svgElement.getAttribute("height").indexOf("%") !== -1 )
            ? svgElement.getBBox().height * _options.scale
            : svgElement.getBoundingClientRect().height * _options.scale;
        _options.originalWidth = svgElement.style.getPropertyValue("width").indexOf("%") !== -1 
            || (svgElement.getAttribute("width") && svgElement.getAttribute("width").indexOf("%") !== -1 )
            ? svgElement.getBBox().width * _options.scale
            : svgElement.getBoundingClientRect().width * _options.scale;
        _options.originalMinXViewBox = svgElement.getAttribute("viewBox") ? svgElement.getAttribute("viewBox").split(/\s/)[0] : 0;
        _options.originalMinYViewBox = svgElement.getAttribute("viewBox") ? svgElement.getAttribute("viewBox").split(/\s/)[1] : 0;

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
        if (options && options.allowCrossOriginImages) {
            _options.allowCrossOriginImages = options.allowCrossOriginImages;
        }
        if (options && options.excludeByCSSSelector && typeof(options.excludeByCSSSelector) === "string") {
            _options.elementsToExclude = svgElement.querySelectorAll(options.excludeByCSSSelector);
        }
        if (options && options.onDone && typeof(options.onDone) === "function") {
            _options.onDone = options.onDone;
        }

        setPdfOptions(options);
    }

    function useCSSfromComputedStyles(element, elementClone) {
        if (typeof getComputedStyle !== "function"){
            warnError("Warning svg-export: this browser is not able to get computed styles");
            return;
        } 
        
        for (var i = 0; i < _options.elementsToExclude.length; i++) {
            if (_options.elementsToExclude[i] === elementClone) { // prevent continuation of this function if user wants to exclude the child element 
                return;
            }
        }
        
        var compStyles = window.getComputedStyle(element);
        if (compStyles.length > 0) {
            for (const compStyle of compStyles){
                if (["width", "height", "inline-size", "block-size"].indexOf(compStyle) === -1 ) {
                    elementClone.style.setProperty(compStyle, compStyles.getPropertyValue(compStyle));
                }
            };
        }
        
        element.childNodes.forEach(function(child, index){
            if (child.nodeType === 1/*Node.ELEMENT_NODE*/) {
                useCSSfromComputedStyles(child, elementClone.childNodes[parseInt(index, 10)]);
            }
        });
    }

    function setupSvg(svgElement, originalSvg, asString) {
        if (typeof asString === "undefined") { asString = true; }
        if (_options.useCSS && typeof originalSvg === "object") {
            useCSSfromComputedStyles(originalSvg, svgElement);
            svgElement.style.display = null;
        }
        
        _options.elementsToExclude.forEach(function(element) {
            element.remove();
        });

        svgElement.style.width = null;
        svgElement.style.height = null;
        svgElement.setAttribute("width", _options.width);
        svgElement.setAttribute("height", _options.height);
        svgElement.setAttribute("preserveAspectRatio", "none");
        svgElement.setAttribute("viewBox", (_options.originalMinXViewBox) + " " + (_options.originalMinYViewBox) +" " + (_options.originalWidth) + " " + (_options.originalHeight));
       
        var elements = document.getElementsByClassName("tempdiv-svg-exportJS");
        while(elements.length > 0){
            elements[0].parentNode.removeChild(elements[0]);
        }

        //get svg string
        if (asString)
        {
            var serializer = new XMLSerializer();
            //setting currentColor to black matters if computed styles are not used
            var svgString = serializer.serializeToString(svgElement).replace(/currentColor/g, "black");

            //add namespaces
            if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                svgString = svgString.replace(/^<svg/, "<svg xmlns=\"http://www.w3.org/2000/svg\"");
            }
            if (!svgString.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
                svgString = svgString.replace(/^<svg/, "<svg xmlns:xlink=\"http://www.w3.org/1999/xlink\"");
            }
    
            return svgString;
        }
        return svgElement;
    }

    function convertImageURLtoDataURI(image) {
        return new Promise(function(resolve, reject) {
            var newImage = new Image();
                        
            newImage.onload = function () {
                var canvas = document.createElement("canvas");
                canvas.width = this.naturalWidth || this.getAttribute("width") || this.style.getPropertyValue("width") || 300; 
                canvas.height = this.naturalHeight || this.getAttribute("height") || this.style.getPropertyValue("height") || 300; 

                canvas.getContext("2d").drawImage(this, 0, 0);

                var dataURI = canvas.toDataURL("image/png");
                image.setAttribute("href", dataURI);
                resolve();
            };
            if (_options.allowCrossOriginImages)
                newImage.crossOrigin = "anonymous";
            newImage.src = image.getAttribute("href") || image.getAttributeNS("http://www.w3.org/1999/xlink", "href");
        });
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
            navigator.msSaveBlob(blob, name);
        } else {
            var link = document.createElement("a");
            link.download = name;
            link.href = uri;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        if (_options.onDone) {
            _options.onDone();
        }
    }

    function downloadSvg(svg, svgName, options) {
        var svgElement = getSvgElement(svg);
        if (!svgElement) { return; }
        if (svgName == null) {
            svgName = "chart";
        }

        //get svg element
        setOptions(svgElement, options);

        // -custom images
        var images = svgElement.getElementsByTagName("image");
        var image_promises = [];
        if (images){
            for (var image of images) {
                if ((image.getAttribute("href") && image.getAttribute("href").indexOf("data:") === -1)
                || (image.getAttribute("xlink:href") && image.getAttribute("xlink:href").indexOf("data:") === -1)) {
                    image_promises.push(convertImageURLtoDataURI(image));
                }
            }
        }

        Promise.all(image_promises).then(function() {
            //get svg string
            var svgString = setupSvg(svgElement, svg);

            //add xml declaration
            svgString = "<?xml version=\"1.0\" standalone=\"no\"?>\r\n" + svgString;

            //convert svg string to URI data scheme.
            var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

            triggerDownload(url, svgName + ".svg");
        });
    }

    function downloadRaster(svg, svgName, options, imageType) {
        //check dependency and values
        if (typeof canvg !== "object")
        {
            warnError("Error svg-export: PNG/JPEG export requires Canvg.js");
            return;
        }
        imageType = imageType.toLowerCase().replace("jpg", "jpeg");
        if (imageType !== "png" && imageType !== "jpeg") {
            imageType = "png";
        }
        var svgElement = getSvgElement(svg);
        if (!svgElement) { return; }
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
        setOptions(svgElement, options);
        var svgString = setupSvg(svgElement, svg);
        
        if (imageType === "jpeg")
        {
            //change transparent background to white
            svgString = svgString.replace(">", "><rect x=\"0\" y=\"0\" width=\"" + _options.width + "\" height=\"" + _options.height 
                + "\" fill=\"" + _options.transparentBackgroundReplace + "\"/>");
        }

        var ctx = canvas.getContext("2d");
        var v = canvg.Canvg.fromString(ctx, svgString, { anonymousCrossOrigin: _options.allowCrossOriginImages })
        v.start();
        v.ready().then(function(){
            var image = canvas.toDataURL("image/" + imageType);
            triggerDownload(image, svgName + "." + imageType, canvas);
        });
    }
    function downloadPng(svg, svgName, options) {
        downloadRaster(svg, svgName, options, "png");
    }
    function downloadJpeg(svg, svgName, options) {
        downloadRaster(svg, svgName, options, "jpeg");
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
    function downloadPdf(svg, svgName, options) {
        //check dependency and values
        if (typeof PDFDocument !== "function" || typeof SVGtoPDF !== "function" || typeof blobStream !== "function")
        {
            warnError("Error svg-export: PDF export requires PDFKit.js, blob-stream and SVG-to-PDFKit");
            return;
        }
        
        //get svg element
        var svgElement = getSvgElement(svg);
        if (!svgElement) { return; }
        if (svgName == null) {
            svgName = "chart";
        }
        setOptions(svgElement, options);
        var svgCloned = setupSvg(svgElement, svg, false);

        //create PDF doc
        var doc = new PDFDocument(_options.pdfOptions.pageLayout);
        var stream = doc.pipe(blobStream());

        // -custom images
        var images = svgElement.getElementsByTagName("image");
        var image_promises = [];
        if (images){
            for (var image of images) {
                if ((image.getAttribute("href") && image.getAttribute("href").indexOf("data:") === -1)
                || (image.getAttribute("xlink:href") && image.getAttribute("xlink:href").indexOf("data:") === -1)) {
                    image_promises.push(convertImageURLtoDataURI(image));
                }
            }
        }

        // -custom fonts
        Promise.all(image_promises).then(function() {
            if (_options.pdfOptions.customFonts.length > 0) {
                var font_promises = getCustomFonts(_options.pdfOptions.customFonts.map(function(d) { return d.url; }));
                Promise.all(font_promises).then(function(fonts) {
                    fonts.forEach(function(font, index) {
                        var thisPdfOptions = _options.pdfOptions.customFonts[parseInt(index, 10)];
                        //this ensures that the font fallbacks are removed from inline CSS that contain custom fonts, as fonts with fallbacks are not parsed correctly by SVG-to-PDFKit
                        var fontStyledElements = svgCloned.querySelectorAll("[style*=\"" +thisPdfOptions.fontName + "\"]");
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
                    fillPDFDoc(doc, svgName, svgCloned);
                    doc.end();
                });
            } else {
                fillPDFDoc(doc, svgName, svgCloned);
                doc.end();
            }
        });

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
