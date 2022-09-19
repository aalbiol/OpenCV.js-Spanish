const { Canvas, createCanvas, Image, ImageData, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');
const { writeFileSync, existsSync, mkdirSync } = require("fs");
// Este es nuestro programa. Esta vez usamos JavaScript async/await y promesas para
// manejar la asincronía.
(async () => {
  // Antes de cargar opencv.js emulamos un HTML DOM mínimo. Consulte la declaración de la
  // función que viene a continuación.
  installDOM();
  await loadOpenCV();
  // Usando node-canvas, convertimos un archivo de imagen en un objeto compatible con
  // HTML DOM Image y, por lo tanto, con cv.imread()
  const image = await loadImage('./lena.jpg');
  const src = cv.imread(image);
  const dst = new cv.Mat();
  const M = cv.Mat.ones(5, 5, cv.CV_8U);
  const anchor = new cv.Point(-1, -1);
  cv.dilate(src, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
  // Creamos un objeto compatible HTMLCanvasElement 
  const canvas = createCanvas(300, 300);
  cv.imshow(canvas, dst);
  writeFileSync('output.jpg', canvas.toBuffer('image/jpeg'));
  src.delete();
  dst.delete();
})();
// Cargamos opencv.js como antes, pero usando Promise en lugar de callback:
function loadOpenCV() {
  return new Promise(resolve => {
    global.Module = {
      onRuntimeInitialized: resolve
    };
    global.cv = require('./opencv.js');
  });
}
// Using jsdom and node-canvas we define some global variables to emulate HTML DOM.
// Although a complete emulation can be archived, here we only define those globals used
// by cv.imread() and cv.imshow().
function installDOM() {
  const dom = new JSDOM();
  global.document = dom.window.document;
  // El resto habilita DOM image y canvas y es proporcionado por node-canvas
  global.Image = Image;
  global.HTMLCanvasElement = Canvas;
  global.ImageData = ImageData;
  global.HTMLImageElement = Image;
}