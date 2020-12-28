# svg-exportJS [![Codacy Badge](https://api.codacy.com/project/badge/Grade/a2677830f9d2432d8061a8151e03fd23)](https://app.codacy.com/gh/sharonchoong/svg-exportJS?utm_source=github.com&utm_medium=referral&utm_content=sharonchoong/svg-exportJS&utm_campaign=Badge_Grade)

An easy-to-use client-side Javascript library to export SVG graphics from web pages and download them as an SVG file, PDF, or raster image (JPEG, PNG) format. Written in plain vanilla javascript. Originally created to export D3.js charts.

This library features:

- Exporting SVG DOM Element objects or serialized SVG string to SVG file, PNG, JPEG, PDF
- Setting custom size for exported image or graphic
- High resolution raster image, using `scale`
- Including external CSS styles in SVG
- Exporting text in custom embedded fonts
- Handling transparent background for JPEG format conversion
- Exporting SVGs that are hidden on the DOM (`display: none`, SVGs in hidden modals, dropdowns or tabs, etc.) 

Demo available [here](https://sharonchoong.github.io/svg-exportJS/index.html).

## Getting Started

### Prerequisites

- Any of the following browsers: Chrome 38.0+, Edge 18.0+, Firefox 20.0+, Safari 10.1+, Opera 25+
- [Canvg](https://github.com/canvg/canvg) (if you need JPEG/PNG export)
  ```html
  <script src="https://unpkg.com/canvg@3.0.1/lib/umd.js"></script>
  ```
- [PDFKit](https://github.com/foliojs/pdfkit), [blob-stream](https://github.com/devongovett/blob-stream) and [SVG-to-PDFKit](https://github.com/alafr/SVG-to-PDFKit) (if you need PDF export)
  ```html
  <script src="https://cdn.jsdelivr.net/npm/pdfkit@0.11.0/js/pdfkit.min.js"></script>
  <script src="https://github.com/devongovett/blob-stream/releases/download/v0.1.3/blob-stream.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/svg-to-pdfkit@0.1.8/source.min.js"></script>
  ```

### Installation

Either download the plugin and save it in your project, or use script-tags in your html files using the hosted url.

- Download the plugin `svg-export.min.js` from this repo, and add it to your project.
- Add the plugin using the file hosted on Github Pages. Place the script within the `<head>` tag in your html files (place prerequisites first):
  ```html
  <!-- svg-exportJS prerequisite: canvg -->
  <script src="https://unpkg.com/canvg@3.0.1/lib/umd.js"></script>
  <!-- svg-exportJS plugin -->
  <script src="https://sharonchoong.github.io/svg-exportJS/svg-export.min.js"></script>
  ```

## Usage

Given the `<svg>` element:

```html
<svg id="mysvg">...</svg>
```

In Javascript:

```javascript
svgExport.downloadSvg(
  document.getElementById("mysvg"), // SVG DOM Element object to be exported. Alternatively, a string of the serialized SVG can be passed
  "chart title name", // chart title: file name of exported image
  { width: 200, height: 200 } // options (optional, please see below for a list of option properties)
);
svgExport.downloadPng("<svg id=\"mysvg\"></svg>", "chart title name", {
  width: 200,
  height: 200,
});
svgExport.downloadJpeg(svgElementObject, "chart title name");
svgExport.downloadPdf(svgString, "chart title name");
```

See `index.html` for an example of how to use.

## Options

- **width** (number) : _the width of the resulting image exported, in pixels. Default is the SVG's width on the DOM_
- **height** (number) : _the height of the resulting image exported, in pixels. Default is the SVG's height on the DOM_
- **scale** (number) : _a multiple by which the SVG can be increased or decreased in size. For PNG and JPEG exports, if width, height and scale are not specified, scale is set to `10` for a 10x enlargement to ensure that a higher resolution image is produced. Otherwise, the default scale is `1`_
- **useCSS** (bool): _if SVG styles are specified in stylesheet externally rather than inline, setting `true` will add references to such styles from the styles computed by the browser. If useCSS is `false`, `currentColor` will be changed to `black`. This setting only applies if the SVG is passed as a DOM Element object, not as a string. Default is `true`_
- **transparentBackgroundReplace** (string): _the color to be used to replace a transparent background in JPEG format export. Default is `white`_
- **pdfOptions**
  - **pageLayout** (object): _e.g. `{ margin: 50, layout: "landscape" }`. This is provided to PDFKit's `addPage`. When the options **width** and **height** are not specified, a minimum size of 300x300 is used for the PDF page size; otherwise the page size wraps around the SVG size. Please see the [PDFKit documentation](https://pdfkit.org/docs/getting_started.html#adding_pages) for more info_
  - **addTitleToPage** (bool): _Default is `true`_
  - **chartCaption** (string) _caption to appear at the bottom of the chart in the PDF. Default is no caption_
  - **pdfTextFontFamily** (string): _Font family of title and caption (if applicable) in PDF. See here for a [list of available fonts](http://pdfkit.org/docs/text.html#fonts). Default is `Helvetica`_
  - **pdfTitleFontSize** (number): _Default is `20`_
  - **pdfCaptionFontSize** (number): _Default is `14`_
  - **customFonts** (array of objects): _Optional argument for custom fonts. e.g. `[{ fontName: 'FakeFont', url: 'fonts/FakeFont.ttf'}]`. Each object must have two properties: `fontName` for the font name that appears in the CSS/SVG, and `url` for the URL of the custom font file to be used in the PDF. A third property `styleName` specifying the style name to be used can be specified for multi-collection font files (.ttc and .dfont files)_

### Custom fonts

Regarding embedded custom fonts used in the SVG element (using @font-face for example), please note that for SVG export, custom fonts only show correctly if the system opening the SVG file has the font installed. If this is not possible, please consider using one of the other file formats available.

### Colors

Colors tested to work on all exported formats include CSS color names, HEX, RGB, RGBA and HSL.

### SVG graphics in Office documents

Need to add SVG graphics to Office Word, Excel or Powerpoint presentations? [SVG files can be inserted as a picture](https://support.microsoft.com/en-us/office/edit-svg-images-in-microsoft-office-365-69f29d39-194a-4072-8c35-dbe5e7ea528c) for non-pixelated graphics in Office 2016 or later, including Office 365.

## Roadmap

- [ ] Test external images within SVGs
- [ ] Set up package.json and publish to npm (jsdom for Node?)

## Contributing

Contributions are very welcome! Feel free to flag issues or pull requests.

## License

Licensed under MIT. See `LICENSE` for more information.

## Contact

Sharon Choong - [https://sharonchoong.github.io/](https://sharonchoong.github.io/about.html)
