
export interface SVGExportOptions {
    /** width of the resulting image exported, in pixels. Default is the SVG's width on the DOM */
    width?: number;
    /** height of the resulting image exported, in pixels. Default is the SVG's height on the DOM */
    height?: number;
    /** a multiple by which the SVG can be increased or decreased in size. 
     * For PNG and JPEG exports, if width, height and scale are not specified, 
     * scale is set to `10` for a 10x enlargement to ensure that a higher resolution image is produced. 
     * Otherwise, the default scale is `1` */
    scale?: number;
    /** if SVG styles are specified in stylesheet externally rather than inline,
     *  setting `true` will add references to such styles from the styles computed by the browser. 
     * If `useCSS` is `false`, `currentColor` will be changed to `black`. 
     * This setting only applies if the SVG is passed as a DOM Element object, not as a string. 
     * Set this to `false` whenever possible to optimize performance. 
     * When set to `true`, all elements in the SVG are iterated to obtain their computed styles, 
     * which can be costly for large SVGs. Default is `true` */
    useCSS?: boolean;
    /** 
     * @example e.g. `[stroke='red'], [stroke='green'], [display='none'], .text-muted`. 
     * Elements matching the specified CSS selector will not be included in the generated file. 
     * This can be used to remove unwanted/unsupported elements of the SVG from the exported file, 
     * or to optimize performance for large SVGs. */
    excludeByCSSSelector?: string;
    /** color to be used to replace a transparent background in JPEG format export. Default is `white` */
    transparentBackgroundReplace?: string;
    /** If the SVG contains images, this option permits the use of images from foreign origins. Defaults to `false`. */
    allowCrossOriginImages?: boolean;
    /** Options specific to PDF file format export */
    pdfOptions?: PDFOptions;
}

export interface InternalPDFOptions {
    /** Optional argument for custom fonts. e.g. `[{ fontName: 'FakeFont', url: 'fonts/FakeFont.ttf'}]`. 
     * Each object must have two properties: `fontName` for the font name that appears in the CSS/SVG, 
     * and `url` for the URL of the custom font file to be used in the PDF. 
     * A third property `styleName` specifying the style name to be used can be specified 
     * for multi-collection font files (.ttc and .dfont files) */
    customFonts: PDFKitCustomFont[];
    /** This is provided to PDFKit's `addPage`. Please see the PDFKit documentation for more info */
    pageLayout: InternalPDFPageLayoutMargins;
    /** Default is `true` */
    addTitleToPage: boolean;
    /** caption to appear at the bottom of the chart in the PDF. Default is no caption */
    chartCaption: string;
    /** Font family of title and caption (if applicable) in PDF. See the PDFKit documentation for a list of available fonts. 
     * Default is `Helvetica` */
    pdfTextFontFamily: string;
    /** Default is `20` */
    pdfTitleFontSize: number;
    /** Default is `14` */
    pdfCaptionFontSize: number;
}

export type PDFOptions = Omit<Partial<InternalPDFOptions>, "pageLayout"> & { pageLayout?: PDFKitPageLayout };

export interface InternalOptions {
    originalWidth: number;
    originalHeight: number;
    originalMinXViewBox: string;
    originalMinYViewBox: string;
    width: number;
    height: number;
    scale: number;
    useCSS: boolean;
    elementsToExclude: Element[];
    transparentBackgroundReplace: string;
    allowCrossOriginImages: boolean;
    pdfOptions: InternalPDFOptions;
}

interface PDFKitCustomFont {
    fontName: string;
    url: string;
    styleName?: string;
}

export interface InternalPDFPageLayoutMargin {
    margin: number;
    layout?: "portrait" | "landscape";
    size?: [number, number] | string;
}

export interface InternalPDFPageLayoutMargins {
    margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    layout?: "portrait" | "landscape";
    size?: [number, number] | string;
}

/** This is provided to PDFKit's `addPage`. Please see the PDFKit documentation for more info */
type PDFKitPageLayout = Partial<InternalPDFPageLayoutMargin | InternalPDFPageLayoutMargins>;
