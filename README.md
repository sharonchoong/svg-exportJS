# svg-exportJS [![Codacy Badge](https://api.codacy.com/project/badge/Grade/a2677830f9d2432d8061a8151e03fd23)](https://app.codacy.com/gh/sharonchoong/svg-exportJS?utm_source=github.com&utm_medium=referral&utm_content=sharonchoong/svg-exportJS&utm_campaign=Badge_Grade)

An easy-to-use client-side Javascript library to export SVG graphics from web pages and download them as an SVG file, PDF, or raster image (JPEG, PNG) format. Written in plain vanilla javascript. Originally created to export D3.js charts.

This library features:

- Exporting SVG DOM Element objects or serialized SVG string to SVG file, PNG, JPEG, PDF
- Setting custom size for exported image or graphic
- High resolution raster image, using `scale`
- Including external CSS styles in SVG
- Filtering out parts of the SVG by CSS selector
- Exporting text in custom embedded fonts
- Handling transparent background for JPEG format conversion
- Exporting SVGs that are hidden on the DOM (`display: none`, SVGs in hidden modals, dropdowns or tabs, etc.) 
- Exporting SVGs containing images (`<image>` tag)

Demo available [here](https://sharonchoong.github.io/svg-exportJS/index.html).

## Getting Started

### Prerequisites

- Any of the following browsers: Chrome 38.0+, Edge 18.0+, Firefox 20.0+, Safari 10.1+, Opera 25+
- [Canvg](https://github.com/canvg/canvg) (if you need JPEG/PNG export)
  ```html
  <script src="https://cdnjs.cloudflare.com/ajax/libs/canvg/3.0.9/umd.js" integrity="sha512-Wu9XXg78PiNE0DI4Z80lFKlEpLq7yGjquc0I35Nz+sYmSs4/oNHaSW8ACStXBoXciqwTLnSINqToeWP3iNDGmQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  ```
- [PDFKit](https://github.com/foliojs/pdfkit), [blob-stream](https://github.com/devongovett/blob-stream) and [SVG-to-PDFKit](https://github.com/alafr/SVG-to-PDFKit) (if you need PDF export). 
  ```html
  <script src="https://cdn.jsdelivr.net/npm/pdfkit@0.13.0/js/pdfkit.standalone.js" integrity="sha256-41qk5dewLKulpzhP3H6G7mY+5q+vzxMaxolsOGmZD/8=" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/blob-stream-browserify@0.1.3/index.js" integrity="sha256-bFrIR3MiIsKhM2EDZdTJ3eY7iSluq1W7e6dNVwScEYw=" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/svg-to-pdfkit@0.1.8/source.js" integrity="sha256-NaOoypZxJFnz2e4IeMtA9+UMZ5Fh85ljICcUts98jqY=" crossorigin="anonymous"></script>
  ```
Please note that the CDNs above may not be the most up-to-date. The latest source code can be found directly from the github projects, also linked above.

### Installation

Either download the plugin and save it in your project, or use script-tags in your html files using the hosted url.

- Download the plugin `svg-export.min.js` from this repo, and add it to your project.
- Add the plugin using the file hosted on Github Pages. Place the script within the `<head>` tag in your html files (place prerequisites first):
  ```html
  <!-- svg-exportJS prerequisite: canvg -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/canvg/3.0.9/umd.js" integrity="sha512-Wu9XXg78PiNE0DI4Z80lFKlEpLq7yGjquc0I35Nz+sYmSs4/oNHaSW8ACStXBoXciqwTLnSINqToeWP3iNDGmQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
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
- **useCSS** (bool): _if SVG styles are specified in stylesheet externally rather than inline, setting `true` will add references to such styles from the styles computed by the browser. If useCSS is `false`, `currentColor` will be changed to `black`. This setting only applies if the SVG is passed as a DOM Element object, not as a string. Set this to `false` whenever possible to optimize performance. When set to `true`, all elements in the SVG are iterated to obtain their computed styles, which can be costly for large SVGs (please read **Optimizing for large SVGs** below for more detail). Default is `true`_
- **excludeByCSSSelector** (string): _e.g. `[stroke='red'], [stroke='green'], [display='none'], .text-muted`. Elements matching the specified [CSS selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) will not be included in the generated file. This can be used to remove unwanted/unsupported elements of the SVG from the exported file, or to optimize performance for large SVGs. Please read **Optimizing for large SVGs** and **Not Supported** below for more detail._
- **transparentBackgroundReplace** (string): _the color to be used to replace a transparent background in JPEG format export. Default is `white`_
- **allowCrossOriginImages** (bool): _If the SVG contains images, this option permits the use of images from foreign origins. Defaults to `false`. Please read **Images within SVG** below for more detail._
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

### Images within SVG
This library supports exporting SVGs that contain images in an `<image>` tag. If you need to export such SVGs to raster images or PDFs, please make sure that you have the latest version of Canvg and SVG-to-PDFKit. If the images' `href` are external, the `allowCrossOriginImages` option must be set to `true`, and the image servers must be configured with the ['Access-Control-Allow-Origin'](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image) CORS policy. 

### Optimizing for large SVGs
- Set the `useCSS` option to `false` whenever possible to optimize performance. When set to `true`, all elements in the SVG are iterated to obtain their computed styles, which can be costly for large SVGs.
- If you have no choice but to set `useCSS` to `true` for a large SVG, but it is causing slow performance or a frozen browser, you can also try filtering out unneeded elements within the SVG, using the `excludeByCSSSelector` setting. For example, you could exclude all elements in the SVG that are styled as `display: none`, exclude elements that have the attribute `fill=transparent`, or exclude unneeded elements that have a specific class name.

### Colors

Colors tested to work on all exported formats include CSS color names, HEX, RGB, RGBA and HSL.

### SVG graphics in Office documents

Need to add SVG graphics to Office Word, Excel or Powerpoint presentations? [SVG files can be inserted as a picture](https://support.microsoft.com/en-us/office/edit-svg-images-in-microsoft-office-365-69f29d39-194a-4072-8c35-dbe5e7ea528c) for non-pixelated graphics in Office 2016 or later, including Office 365.

## Roadmap

- [ ] Open the generated file in a new window/tab instead of downloading the file 
- [ ] Set up package.json and publish to npm (jsdom for Node?)

## Not Supported
Since `foreignObject` does not contain SVG, it is not supported.

## Contributing

Contributions are very welcome! Feel free to flag issues or pull requests.

## License

Licensed under MIT. See `LICENSE` for more information.

## Contact

Sharon Choong - [https://sharonchoong.github.io/](https://sharonchoong.github.io)

Send me your cheers with a cup of coffee! [Ko-Fi](https://ko-fi.com/sharonchoong)
