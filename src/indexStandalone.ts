export const version = "2.1.0";

// bundle font and image files and register them in the virtual fs
import './registerPdfResources';

export { downloadPdf } from "./pdf";
export { downloadJpeg, downloadPng } from "./raster";
export { downloadSvg } from "./svg";

