/*
 * svg-export.js - Javascript SVG parser and renderer on Canvas
 * version 1.2.0
 * MIT Licensed
 * Sharon Choong (https://sharonchoong.github.io/about.html)
 * https://sharonchoong.github.io/svg-export
 *
 */

class SvgExport {
  constructor(dependencies = {}) {
    this.version = "1.2.0";
    this._options = {};

    // Store dependencies
    this._canvg = dependencies.canvg;
    this._pdfkit = dependencies.pdfkit;
    this._svgToPdf = dependencies.svgToPdf;
    this._blobStream = dependencies.blobStream;
    this._presets = dependencies.presets;
    this._textToPath = dependencies.textToPath;

    // Check available dependencies
    this._hasCanvg = typeof this._canvg !== "undefined";
    this._hasPDF =
      typeof this._pdfkit !== "undefined" &&
      typeof this._svgToPdf !== "undefined" &&
      typeof this._blobStream !== "undefined";
    this._hasTextToPath = typeof this._textToPath !== "undefined";
  }

  // Optional method to set dependencies after construction
  setDependencies(dependencies) {
    this._canvg = dependencies.canvg;
    this._pdfkit = dependencies.pdfkit;
    this._svgToPdf = dependencies.svgToPdf;
    this._blobStream = dependencies.blobStream;
    this._textToPath = dependencies.textToPath;

    this._hasCanvg = typeof this._canvg !== "undefined";
    this._hasTextToPath = typeof this._textToPath !== "undefined";

    this._hasPDF =
      typeof this._pdfkit !== "undefined" &&
      typeof this._svgToPdf !== "undefined" &&
      typeof this._blobStream !== "undefined";
  }

  // Private helper methods
  _warnError(str) {
    if (typeof console !== undefined && typeof console.warn === "function") {
      console.warn(str);
    }
  }

  _getSvgElement(svg) {
    let div = document.createElement("div");
    div.className = "tempdiv-svg-exportJS";

    if (typeof svg === "string") {
      div.insertAdjacentHTML("beforeend", svg.trim());
      svg = div.firstChild;
    }

    if (!svg.nodeType || svg.nodeType !== 1) {
      this._warnError("Error svg-export: The input svg was not recognized");
      return null;
    }

    let svgClone = svg.cloneNode(true);
    svgClone.style.display = null;
    div.appendChild(svgClone);
    div.style.visibility = "hidden";
    div.style.display = "table";
    div.style.position = "absolute";
    document.body.appendChild(div);
    return svgClone;
  }

  _setPdfOptions(options) {
    if (options && options.pdfOptions) {
      Object.keys(this._options.pdfOptions).forEach((opt) => {
        if (
          options.pdfOptions.hasOwnProperty(opt) &&
          typeof options.pdfOptions[opt] ===
            typeof this._options.pdfOptions[opt]
        ) {
          if (options.pdfOptions[opt] === "") {
            return;
          }
          this._options.pdfOptions[opt] = options.pdfOptions[opt];
        }
      });

      if (!this._options.pdfOptions.pageLayout.margin) {
        this._options.pdfOptions.pageLayout.margin = 50;
      }
      if (!this._options.pdfOptions.pageLayout.margins) {
        this._options.pdfOptions.pageLayout.margins = {};
      }
    }
    this._options.pdfOptions.pageLayout.margins.top =
      this._options.pdfOptions.pageLayout.margins.top ||
      this._options.pdfOptions.pageLayout.margin;
    this._options.pdfOptions.pageLayout.margins.bottom =
      this._options.pdfOptions.pageLayout.margins.bottom ||
      this._options.pdfOptions.pageLayout.margin;
    this._options.pdfOptions.pageLayout.margins.left =
      this._options.pdfOptions.pageLayout.margins.left ||
      this._options.pdfOptions.pageLayout.margin;
    this._options.pdfOptions.pageLayout.margins.right =
      this._options.pdfOptions.pageLayout.margins.top ||
      this._options.pdfOptions.pageLayout.margin;
    delete this._options.pdfOptions.pageLayout.margin;
    if (!(options && this._options.pdfOptions.pageLayout.size)) {
      this._options.pdfOptions.pageLayout.size = [
        Math.max(300, this._options.width) +
          this._options.pdfOptions.pageLayout.margins.left +
          this._options.pdfOptions.pageLayout.margins.right,
        Math.max(300, this._options.height) +
          this._options.pdfOptions.pageLayout.margins.top +
          this._options.pdfOptions.pageLayout.margins.bottom +
          (this._options.pdfOptions.addTitleToPage
            ? this._options.pdfOptions.pdfTitleFontSize * 2 + 10
            : 0) +
          (this._options.pdfOptions.chartCaption !== ""
            ? this._options.pdfOptions.pdfCaptionFontSize * 4 + 10
            : 0),
      ];
    }
  }

  _setOptions(svgElement, options) {
    // Initialize options for this instance
    this._options = {
      originalWidth: 100,
      originalHeight: 100,
      originalMinXViewBox: 0,
      originalMinYViewBox: 0,
      originalWidthViewbox: 100,
      originalHeightViewbox: 100,
      width: 100,
      height: 100,
      scale: 1,
      useCSS: true,
      transparentBackgroundReplace: "white",
      allowCrossOriginImages: false,
      elementsToExclude: [],
      convertTextToPath: false,
      svgTextToPathSettings: {
        fonts: [],
      },
      pdfOptions: {
        customFonts: [],
        pageLayout: { margin: 50, margins: {} },
        addTitleToPage: true,
        chartCaption: "",
        pdfTextFontFamily: "Helvetica",
        pdfTitleFontSize: 20,
        pdfCaptionFontSize: 14,
      },
      onDone: null,
    };

    //original size
    if (options && options.originalHeight && options.originalWidth) {
      this._options.originalHeight = options.originalHeight;
      this._options.originalWidth = options.originalWidth;
    } else {
      this._options.originalHeight =
        svgElement.style.getPropertyValue("height").indexOf("%") !== -1 ||
        (svgElement.getAttribute("height") &&
          svgElement.getAttribute("height").indexOf("%") !== -1)
          ? svgElement.getBBox().height
          : svgElement.getBoundingClientRect().height;
      this._options.originalWidth =
        svgElement.style.getPropertyValue("width").indexOf("%") !== -1 ||
        (svgElement.getAttribute("width") &&
          svgElement.getAttribute("width").indexOf("%") !== -1)
          ? svgElement.getBBox().width
          : svgElement.getBoundingClientRect().width;
    }

    const viewBox = svgElement.getAttribute("viewBox");
    if (viewBox) {
      const values = viewBox.split(/[\s,]+/); // Split on one or more spaces or commas
      this._options.originalMinXViewBox = values[0] ?? 0;
      this._options.originalMinYViewBox = values[1] ?? 0;
      this._options.originalWidthViewbox = values[2] ?? 100;
      this._options.originalHeightViewbox = values[3] ?? 100;
    } else {
      this._options.originalMinXViewBox = 0;
      this._options.originalMinYViewBox = 0;
      this._options.originalWidthViewbox = NaN;
      this._options.originalHeightViewbox = NaN;
    }

    //custom options
    if (options && options.scale && typeof options.scale === "number") {
      this._options.scale = options.scale;
    }
    if (!options || !options.height) {
      this._options.height = this._options.originalHeight * this._options.scale;
    } else if (typeof options.height === "number") {
      this._options.height = options.height * this._options.scale;
    }
    if (!options || !options.width) {
      this._options.width = this._options.originalWidth * this._options.scale;
    } else if (typeof options.width === "number") {
      this._options.width = options.width * this._options.scale;
    }
    if (options && options.useCSS === false) {
      this._options.useCSS = false;
    }
    if (options && options.transparentBackgroundReplace) {
      this._options.transparentBackgroundReplace =
        options.transparentBackgroundReplace;
    }
    if (options && options.allowCrossOriginImages) {
      this._options.allowCrossOriginImages = options.allowCrossOriginImages;
    }
    if (
      options &&
      options.excludeByCSSSelector &&
      typeof options.excludeByCSSSelector === "string"
    ) {
      this._options.elementsToExclude = svgElement.querySelectorAll(
        options.excludeByCSSSelector
      );
    }
    if (options && options.onDone && typeof options.onDone === "function") {
      this._options.onDone = options.onDone;
    }
    if (options && options.svgTextToPathSettings) {
      this._options.svgTextToPathSettings = options.svgTextToPathSettings;
    }
    if (options && options.convertTextToPath) {
      this._options.convertTextToPath = options.convertTextToPath;
    }

    this._setPdfOptions(options);
  }

  useCSSfromComputedStyles(element, elementClone) {
    if (typeof getComputedStyle !== "function") {
      this._warnError(
        "Warning svg-export: this browser is not able to get computed styles"
      );
      return;
    }

    for (let i = 0; i < this._options.elementsToExclude.length; i++) {
      if (this._options.elementsToExclude[i] === elementClone) {
        // prevent continuation of this function if user wants to exclude the child element
        return;
      }
    }

    let compStyles = window.getComputedStyle(element);
    if (compStyles.length > 0) {
      for (const compStyle of compStyles) {
        if (
          ["width", "height", "inline-size", "block-size"].indexOf(
            compStyle
          ) === -1
        ) {
          elementClone.style.setProperty(
            compStyle,
            compStyles.getPropertyValue(compStyle)
          );
        }
      }
    }

    // Use arrow function to preserve 'this' context
    element.childNodes.forEach((child, index) => {
      if (child.nodeType === 1 /*Node.ELEMENT_NODE*/) {
        this.useCSSfromComputedStyles(
          child,
          elementClone.childNodes[parseInt(index, 10)]
        );
      }
    });
  }

  setupSvg(svgElement, originalSvg, asString) {
    if (typeof asString === "undefined") {
      asString = true;
    }
    if (this._options.useCSS && typeof originalSvg === "object") {
      this.useCSSfromComputedStyles(originalSvg, svgElement);
      svgElement.style.display = null;
    }

    this._options.elementsToExclude.forEach((element) => {
      element.remove();
    });

    svgElement.style.width = null;
    svgElement.style.height = null;
    svgElement.setAttribute("width", this._options.width);
    svgElement.setAttribute("height", this._options.height);
    svgElement.setAttribute("preserveAspectRatio", "none");
    svgElement.setAttribute(
      "viewBox",
      this._options.originalMinXViewBox +
        " " +
        this._options.originalMinYViewBox +
        " " +
        (isNaN(this._options.originalWidthViewbox)
          ? this._options.originalWidth
          : this._options.originalWidthViewbox) +
        " " +
        (isNaN(this._options.originalHeightViewbox)
          ? this._options.originalHeight
          : this._options.originalHeightViewbox)
    );

    let elements = document.getElementsByClassName("tempdiv-svg-exportJS");
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }

    //get svg string
    if (asString) {
      let serializer = new XMLSerializer();
      //setting currentColor to black matters if computed styles are not used
      let svgString = serializer
        .serializeToString(svgElement)
        .replace(/currentColor/g, "black");

      //add namespaces
      if (
        !svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)
      ) {
        svgString = svgString.replace(
          /^<svg/,
          '<svg xmlns="http://www.w3.org/2000/svg"'
        );
      }
      if (!svgString.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
        svgString = svgString.replace(
          /^<svg/,
          '<svg xmlns:xlink="http://www.w3.org/1999/xlink"'
        );
      }

      return svgString;
    }
    return svgElement;
  }

  convertImageURLtoDataURI(image) {
    // Preserve this context for use inside Promise and event handlers
    const self = this;
    return new Promise((resolve, reject) => {
      const newImage = new Image();

      newImage.onload = () => {
        const canvas = document.createElement("canvas");
        // Use newImage directly since we know that's what we want
        canvas.width =
          newImage.naturalWidth ||
          newImage.getAttribute("width") ||
          newImage.style.getPropertyValue("width") ||
          300;
        canvas.height =
          newImage.naturalHeight ||
          newImage.getAttribute("height") ||
          newImage.style.getPropertyValue("height") ||
          300;

        canvas.getContext("2d").drawImage(newImage, 0, 0);

        const dataURI = canvas.toDataURL("image/png");
        image.setAttribute("href", dataURI);
        resolve();
      };

      if (self._options.allowCrossOriginImages) {
        newImage.crossOrigin = "anonymous";
      }
      newImage.src =
        image.getAttribute("href") ||
        image.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    });
  }

  getCustomFonts(fontUrls) {
    let promises = [];
    fontUrls.forEach((fontUrl) => {
      let promise = new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
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

  triggerDownload(uri, name, canvas) {
    name = name.replace(/[/\\?%*:|"<>]/g, "_");
    if (navigator.msSaveBlob) {
      let binary = decodeURIComponent(uri.split(",")[1]),
        array = [];
      let mimeString = uri.split(",")[0].split(":")[1].split(";")[0];
      for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      let blob = null;
      if (canvas != null) {
        blob = canvas.msToBlob();
      } else {
        blob = new Blob([new Uint8Array(array)], { type: mimeString });
      }
      navigator.msSaveBlob(blob, name);
    } else {
      let link = document.createElement("a");
      link.download = name;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    if (this._options.onDone) {
      this._options.onDone();
    }
  }

  downloadSvg(svg, svgName, options) {
    if (svgName == null) {
      svgName = "chart";
    }
    if (options.convertTextToPath) {
      const mysesion = new this._textToPath(svg, options.svgTextToPathSettings);
      mysesion.replaceAll().then(() => {
        processSvgAndDownload();
        mysesion.destroy();
      });
    } else {
      processSvgAndDownload();
    }

    const processSvgAndDownload = () => {
      const svgElement = this._getSvgElement(svg);
      if (!svgElement) {
        return;
      }
      this._setOptions(svgElement, options);
      // -custom images
      const images = svgElement.getElementsByTagName("image");
      const image_promises = [];

      if (images) {
        for (let image of images) {
          if (
            (image.getAttribute("href") &&
              image.getAttribute("href").indexOf("data:") === -1) ||
            (image.getAttribute("xlink:href") &&
              image.getAttribute("xlink:href").indexOf("data:") === -1)
          ) {
            image_promises.push(this.convertImageURLtoDataURI(image));
          }
        }
      }

      Promise.all(image_promises).then(() => {
        //get svg string
        let svgString = this.setupSvg(svgElement, svg);

        //add xml declaration
        svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;

        //convert svg string to URI data scheme.
        let url =
          "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

        this.triggerDownload(url, svgName + ".svg");
      });
    };
  }

  async downloadRaster(svg, svgName, options, imageType) {
    if (!this._hasCanvg) {
      this._warnError(
        "Error svg-export: PNG/JPEG export requires Canvg. Install it via npm or include it via script tag."
      );
      return;
    }

    imageType = imageType.toLowerCase().replace("jpg", "jpeg");
    if (imageType !== "png" && imageType !== "jpeg") {
      imageType = "png";
    }
    const svgElement = this._getSvgElement(svg);
    if (!svgElement) {
      return;
    }
    if (svgName == null) {
      svgName = "chart";
    }
    //get canvas and svg element.

    if (!options) {
      options = {};
    }

    this._setOptions(svgElement, options);
    let svgString = this.setupSvg(svgElement, svg);

    if (imageType === "jpeg") {
      //change transparent background to white
      svgString = svgString.replace(
        ">",
        '><rect x="0" y="0" width="' +
          this._options.width +
          '" height="' +
          this._options.height +
          '" fill="' +
          this._options.transparentBackgroundReplace +
          '"/>'
      );
    }
    svgString = this.removeBreakingStyles(svgString);
    let canvas = new OffscreenCanvas(this._options.width, this._options.height);
    const preset = this._presets.offscreen();
    preset.anonymousCrossOrigin = this._options.allowCrossOriginImages;
    let ctx = canvas.getContext("2d");

    let v = this._canvg.fromString(ctx, svgString, preset);
    v.start();
    // await new Promise((resolve) => setTimeout(resolve, 500));
    v.ready().then(() => {
      const type = imageType === "jpeg" ? "image/jpeg" : "image/png";
      canvas
        .convertToBlob({
          type,
        })
        .then((blob) => {
          const imgUrl = URL.createObjectURL(blob);
          //let img = new Image();
          //img.src = imgUrl;
          //document.getElementById("teleports").appendChild(img);
          this.triggerDownload(imgUrl, svgName + "." + imageType, canvas);
        });
    });
  }

  removeBreakingStyles(domString) {
    // I found that "mask: none; mask-type: luminance;" breaks canvavg conversion
    // so I need to remove it
    return domString.replace(/mask: none; mask-type: luminance;/g, "");
  }

  downloadPng(svg, svgName, options) {
    this.downloadRaster(svg, svgName, options, "png");
  }
  downloadJpeg(svg, svgName, options) {
    this.downloadRaster(svg, svgName, options, "jpeg");
  }

  fillPDFDoc(doc, svgName, svg) {
    // -title
    if (this._options.pdfOptions.addTitleToPage) {
      doc
        .font(this._options.pdfOptions.pdfTextFontFamily)
        .fontSize(this._options.pdfOptions.pdfTitleFontSize)
        .text(svgName, {
          width:
            this._options.pdfOptions.pageLayout.size[0] -
            this._options.pdfOptions.pageLayout.margins.left -
            this._options.pdfOptions.pageLayout.margins.right,
        });
    }
    // -svg
    this._svgToPdf(
      doc,
      svg,
      this._options.pdfOptions.pageLayout.margins.left,
      doc.y + 10,
      {
        width: this._options.width,
        height: this._options.height,
        preserveAspectRatio: "none",
        useCSS: this._options.useCSS,
      }
    );

    // -caption
    if (this._options.pdfOptions.chartCaption !== "") {
      doc
        .font(this._options.pdfOptions.pdfTextFontFamily)
        .fontSize(this._options.pdfOptions.pdfCaptionFontSize)
        .text(
          this._options.pdfOptions.chartCaption,
          this._options.pdfOptions.pageLayout.margins.left,
          this._options.pdfOptions.pageLayout.size[1] -
            this._options.pdfOptions.pageLayout.margins.bottom -
            this._options.pdfOptions.pdfCaptionFontSize * 4,
          {
            width:
              this._options.pdfOptions.pageLayout.size[0] -
              this._options.pdfOptions.pageLayout.margins.left -
              this._options.pdfOptions.pageLayout.margins.right,
          }
        );
    }
  }
  downloadPdf(svg, svgName, options) {
    //check dependency and values
    if (!this._hasPDF) {
      this._warnError(
        "Error svg-export: PDF export requires PDFKit, blob-stream and SVG-to-PDFKit."
      );
      return;
    }
    //get svg element
    const svgElement = this._getSvgElement(svg);
    if (!svgElement) {
      return;
    }
    if (svgName == null) {
      svgName = "chart";
    }
    this._setOptions(svgElement, options);
    const svgCloned = this.setupSvg(svgElement, svg, false);

    //create PDF doc
    const doc = new this._pdfkit(this._options.pdfOptions.pageLayout);
    const stream = doc.pipe(this._blobStream());

    // -custom images
    let images = svgElement.getElementsByTagName("image");
    let image_promises = [];
    if (images) {
      for (let image of images) {
        if (
          (image.getAttribute("href") &&
            image.getAttribute("href").indexOf("data:") === -1) ||
          (image.getAttribute("xlink:href") &&
            image.getAttribute("xlink:href").indexOf("data:") === -1)
        ) {
          image_promises.push(this.convertImageURLtoDataURI(image));
        }
      }
    }

    // -custom fonts
    Promise.all(image_promises).then(() => {
      if (this._options.pdfOptions.customFonts.length > 0) {
        let font_promises = this.getCustomFonts(
          this._options.pdfOptions.customFonts.map((d) => d.url)
        );
        Promise.all(font_promises).then((fonts) => {
          fonts.forEach((font, index) => {
            let thisPdfOptions =
              this._options.pdfOptions.customFonts[parseInt(index, 10)];
            let fontStyledElements = svgCloned.querySelectorAll(
              '[style*="' + thisPdfOptions.fontName + '"]'
            );
            fontStyledElements.forEach((element) => {
              element.style.fontFamily = thisPdfOptions.fontName;
            });
            if (
              (thisPdfOptions.url.indexOf(".ttc") !== -1 ||
                thisPdfOptions.url.indexOf(".dfont") !== -1) &&
              thisPdfOptions.styleName
            ) {
              doc.registerFont(
                thisPdfOptions.fontName,
                font,
                thisPdfOptions.styleName
              );
            } else {
              doc.registerFont(thisPdfOptions.fontName, font);
            }
          });
          this.fillPDFDoc(doc, svgName, svgCloned);
          doc.end();
        });
      } else {
        this.fillPDFDoc(doc, svgName, svgCloned);
        doc.end();
      }
    });

    stream.on("finish", () => {
      let url = stream.toBlobURL("application/pdf");
      this.triggerDownload(url, svgName + ".pdf");
    });
  }
}

// Export for different module systems
if (typeof exports === "object" && typeof module !== "undefined") {
  module.exports = SvgExport;
} else if (typeof define === "function" && define.amd) {
  define(function () {
    return SvgExport;
  });
} else {
  (typeof globalThis !== "undefined" ? globalThis : self).SvgExport = SvgExport;
}
export default SvgExport;
