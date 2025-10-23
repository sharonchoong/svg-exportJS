// the fs here is not node fs but the provided virtual one
import fs from "pdfkit/js/virtual-fs";

/**
 * Registers fonts for PDFKit. Required for standalone packaging.
 * @param ctx 
 */
function registerAFMFonts(ctx: __WebpackModuleApi.RequireContext): void {
  ctx.keys().forEach(key => {
    const match = key.match(/(?:.\/)?([^\/]*)/);
    if (match) {
      // afm files must be stored on data path
      fs.writeFileSync(`data/${match[1]}.afm`, ctx(key));
    }
  });
}

// register AFM fonts distributed with pdfkit
// is good practice to register only required fonts to avoid the bundle size increase too much
registerAFMFonts(require.context('pdfkit/js/data', true, /./));
