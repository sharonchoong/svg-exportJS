/*
 * svg-export.js - Javascript SVG parser and renderer on Canvas
 * version 1.0.0
 * MIT Licensed
 * Sharon Choong (https://sharonchoong.github.io/about.html)
 * https://sharonchoong.github.io/svg-export
 *
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.svgExport = global.svgExport || {}));
} (this, (function (exports) {
    "use strict";
    var version = "1.0.0";
    var _options = {};

    function setOptions(svg_selector, options) {
        //initialize options
        _options = {
            width: 100,
            height: 100, 
            scale: 1,
            useCSS: true,
            PDFOptions: {
                customFonts: [],
                pageLayout: { margin: 50, margins: {} },
                addTitleToPage: true,
                chartCaption: "",
                PDFtextFontFamily: "Helvetica",
                PDFTitleFontSize: 20,
                PDFCaptionFontSize: 14
            }
        };

        //custom options
        if (!options || !options.height) {
            _options.height = document.querySelector(svg_selector).getBBox().height * _options.scale;
        }
        else if (typeof options.height === "number") {
            _options.height = options.height * _options.scale;
        }
        if (!options || !options.width) {
            _options.width = document.querySelector(svg_selector).getBBox().width * _options.scale;
        }
        else if (typeof options.width === "number") {
            _options.width = options.width * _options.scale;
        } 
        if (options && options.scale && typeof options.scale === "number") {
            _options.scale = options.scale;
        }
        if (options && options.useCSS && typeof getComputedStyle !== 'function'){
            _options.useCSS = false;
            alert("Warning svg-export: this browser is not able to get computed styles");
        } else if (options && options.useCSS === false) {
            _options.useCSS = false;
        }

        ["customFonts", "pageLayout", "addTitleToPage", "chartCaption", "PDFtextFontFamily", "PDFTitleFontSize", "PDFCaptionFontSize"].forEach(function(opt) {
            if (options && options.PDFOptions && options.PDFOptions[opt] && typeof options.PDFOptions[opt] === typeof _options.PDFOptions[opt]) {
                if (options.PDFOptions[opt] === "") return;
                _options.PDFOptions[opt] = options.PDFOptions[opt];
            }
            if (opt === "pageLayout") {
                if (!_options.PDFOptions.pageLayout.margin) {
                    _options.PDFOptions.pageLayout.margin = 50;
                }
                if (!_options.PDFOptions.pageLayout.margins) {
                    _options.PDFOptions.pageLayout.margins = {};
                }
            }
        });

        _options.PDFOptions.pageLayout.margins.top = _options.PDFOptions.pageLayout.margins.top || _options.PDFOptions.pageLayout.margin;
        _options.PDFOptions.pageLayout.margins.bottom = _options.PDFOptions.pageLayout.margins.bottom || _options.PDFOptions.pageLayout.margin;
        _options.PDFOptions.pageLayout.margins.left = _options.PDFOptions.pageLayout.margins.left || _options.PDFOptions.pageLayout.margin;
        _options.PDFOptions.pageLayout.margins.right = _options.PDFOptions.pageLayout.margins.top || _options.PDFOptions.pageLayout.margin;
        delete _options.PDFOptions.pageLayout.margin; 
        if (!(options && _options.PDFOptions.pageLayout.size)) {
            _options.PDFOptions.pageLayout.size = [
                _options.width + _options.PDFOptions.pageLayout.margins.left + _options.PDFOptions.pageLayout.margins.right, 
                _options.height + _options.PDFOptions.pageLayout.margins.top + _options.PDFOptions.pageLayout.margins.bottom +
                    (_options.PDFOptions.addTitleToPage ? _options.PDFOptions.PDFTitleFontSize * 2 + 10: 0) + 
                    (_options.PDFOptions.chartCaption !== "" ? _options.PDFOptions.PDFCaptionFontSize * 4 + 10: 0)
            ];
        }
    }

    function useCSSfromComputedStyles(element, elementClone) {
        for (var i = 0; i < element.children.length; i++){
            useCSSfromComputedStyles(element.children[i], elementClone.children[i]);
        }
        
        var compStyles = window.getComputedStyle(element);
        for (var j = 0; j < compStyles.length; j++){
            if (["width", "height", "inline-size", "block-size"].indexOf(compStyles[j]) === -1 ) {
                elementClone.style[compStyles[j]] = compStyles.getPropertyValue(compStyles[j]);
            }
        }
    }

    function getSvg(svg_selector, asString = true)
    {
        var svg = document.querySelector(svg_selector).cloneNode(true);
        if (_options.useCSS) {
            useCSSfromComputedStyles(document.querySelector(svg_selector), svg);
        }

        svg.setAttribute("width", _options.width);
        svg.setAttribute("height", _options.height);
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("viewBox", "0 0 " + (document.querySelector(svg_selector).getBBox().width) + " " + (document.querySelector(svg_selector).getBBox().height));

        //get svg string
        if (asString)
        {
            var serializer = new XMLSerializer();
            var svgString = serializer.serializeToString(svg).replace(/currentColor/g, "black");

            //add namespaces
            if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            if (!svgString.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
                svgString = svgString.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
            }
    
            return svgString;
        }
        return svg;
    }

    function getCustomFonts(font_urls) {
        var promises = [];
        for (var i = 0; i < font_urls.length; i++) {
            var promise = new Promise((resolve, reject) => {
                var req = new XMLHttpRequest();
                req.onreadystatechange = function() { 
                    if (req.readyState == 4 && req.status == 200) {
                        resolve(req.response);
                    }
                }
                req.open("GET", font_urls[i], true); 
                req.responseType = "arraybuffer";
                req.send(null);
            });
            promises.push(promise);
        }
        return promises;
    }

    function triggerDownload(uri, name, canvas) {
        name = name.replace(/[/\\?%*:|"<>]/g, '_');
        if (navigator.msSaveBlob) {
            var binary = (decodeURIComponent(uri.split(',')[1])), array = [];
            var mimeString = uri.split(',')[0].split(':')[1].split(';')[0];
            for (var i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
            var blob = null;
            if (canvas != null)
                blob = canvas.msToBlob()
            else
                blob = new Blob([new Uint8Array(array)], { type: mimeString });
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

    function download_svg(svg_selector, svg_name, options) {
        if (svg_name == null)
            svg_name = "chart";

        //get svg element
        setOptions(svg_selector, options);
        var svgString = getSvg(svg_selector);

        //add xml declaration
        svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;

        //convert svg string to URI data scheme.
        var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

        triggerDownload(url, svg_name + ".svg");
    }

    function download_png(svg_selector, svg_name, options) {
        download_raster(svg_selector, svg_name, options, "png");
    }
    function download_jpeg(svg_selector, svg_name, options) {
        download_raster(svg_selector, svg_name, options, "jpeg");
    }
    function download_raster(svg_selector, svg_name, options, image_type) {
        //check dependency and values
        if (typeof canvg !== 'object')
        {
            alert("Error svg-export: PNG/JPEG export requires Canvg.js");
            return;
        }
        image_type = image_type.toLowerCase().replace("jpg", "jpeg");
        if (image_type !== "png" && image_type !== "jpeg")
            image_type = "png";

        if (svg_name == null)
            svg_name = "chart";

        //get canvas and svg element.
        var canvas = document.createElement("canvas");
        if (!(options && (options.width || options.height)))
            _options.scale = 10;
        setOptions(svg_selector, options);
        var svgString = getSvg(svg_selector);

        if (image_type === "jpeg")
        {
            //change transparent background to white
            svgString = svgString.replace(">", "><rect x='0' y='0' width='" + _options.width + "' height='" + _options.height + "' fill='white'/>");
        }

        var ctx = canvas.getContext('2d');
        canvg.Canvg.fromString(ctx, svgString).start();

        var image = canvas.toDataURL("image/" + image_type);
        triggerDownload(image, svg_name + "." + image_type, canvas);
    }

    function fillPDFDoc(doc, svg_name, svg) {
        // -title
        if (_options.PDFOptions.addTitleToPage){
            doc.font(_options.PDFOptions.PDFtextFontFamily)
                .fontSize(_options.PDFOptions.PDFTitleFontSize)
                .text(svg_name,
                { 
                    width: _options.PDFOptions.pageLayout.size[0] - _options.PDFOptions.pageLayout.margins.left - _options.PDFOptions.pageLayout.margins.right
                });              
        }
        // -svg
        SVGtoPDF(doc, svg, _options.PDFOptions.pageLayout.margins.left, doc.y + 10, 
            { width: _options.width, height: _options.height, preserveAspectRatio: "none", useCSS: _options.useCSS });

        // -caption
        if (_options.PDFOptions.chartCaption !== ""){
            doc.font(_options.PDFOptions.PDFtextFontFamily)
                .fontSize(_options.PDFOptions.PDFCaptionFontSize)
                .text(_options.PDFOptions.chartCaption, _options.PDFOptions.pageLayout.margins.left, 
                    _options.PDFOptions.pageLayout.size[1] - _options.PDFOptions.pageLayout.margins.bottom - _options.PDFOptions.PDFCaptionFontSize * 4,
                { 
                    width: _options.PDFOptions.pageLayout.size[0] - _options.PDFOptions.pageLayout.margins.left - _options.PDFOptions.pageLayout.margins.right
                });              
        }
    }
    function download_pdf(svg_selector, svg_name, options) {
        //check dependency and values
        if (typeof PDFDocument !== 'function' || typeof SVGtoPDF !== 'function')
        {
            alert("Error svg-export: PDF export requires PDFKit.js and SVG-to-PDFKit");
            return;
        }
        if (svg_name == null)
            svg_name = "chart";

        //get svg element
        setOptions(svg_selector, options);
        var svg = getSvg(svg_selector, false);

        //create PDF doc
        var doc = new PDFDocument(_options.PDFOptions.pageLayout);
        var stream = doc.pipe(blobStream());

        // -custom fonts
        if (_options.PDFOptions.customFonts.length > 0){
            var promises = getCustomFonts(_options.PDFOptions.customFonts.map(function(d) { return d.url; }));
            Promise.all(promises).then(function(fonts) {
                for (var i = 0; i < fonts.length; i++) {
                    //this ensures that the font fallbacks are removed from inline CSS that contain custom fonts, as fonts with fallbacks are not parsed correctly by SVG-to-PDFKit
                    var font_styled_elements = svg.querySelectorAll("[style*='" +_options.PDFOptions.customFonts[i].fontName + "']");
                    for (var j = 0; j < font_styled_elements.length; j++) {
                        font_styled_elements[j].style.fontFamily = _options.PDFOptions.customFonts[i].fontName;
                    }

                    doc.registerFont(_options.PDFOptions.customFonts[i].fontName, fonts[i], _options.PDFOptions.customFonts[i].styleName);
                }
                fillPDFDoc(doc, svg_name, svg);
                doc.end();
            });
        } else {
            fillPDFDoc(doc, svg_name, svg);
            doc.end();
        }

        stream.on('finish', function() {
            var url = stream.toBlobURL('application/pdf');
            triggerDownload(url, svg_name + ".pdf");
        });
    }

    exports.version = version;
    exports.downloadSvg = download_svg;
    exports.downloadPng = download_png;
    exports.downloadJpeg = download_jpeg;
    exports.downloadPdf = download_pdf;
    Object.defineProperty(exports, '__esModule', { value: true });
})
));