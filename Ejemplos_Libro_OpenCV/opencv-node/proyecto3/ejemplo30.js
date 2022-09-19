const { Canvas, createCanvas, Image, ImageData, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');
const { writeFileSync, readFileSync, existsSync } = require('fs');

(async () => {
  await loadOpenCV();
  const image = await loadImage('lena.jpg');
  const src = cv.imread(image);
  let gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
  let faces = new cv.RectVector();
  let eyes = new cv.RectVector();
  let faceCascade = new cv.CascadeClassifier();
  let eyeCascade = new cv.CascadeClassifier();
  // Cargue archivos de clasificador previamente entrenados.
  // Observe cómo hacemos referencia a archivos locales usando solo rutas relativas
  // como lo haríamos normalmente.
  faceCascade.load('./haarcascade_frontalface_default.xml');
  eyeCascade.load('./haarcascade_eye.xml');
  let mSize = new cv.Size(0, 0);
  faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, mSize, mSize);
  for (let i = 0; i < faces.size(); ++i) {
    let roiGray = gray.roi(faces.get(i));
    let roiSrc = src.roi(faces.get(i));
    let point1 = new cv.Point(faces.get(i).x, faces.get(i).y);
    let point2 = new cv.Point(faces.get(i).x + faces.get(i).width, faces.get(i).y + faces.get(i).height);
    cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
    eyeCascade.detectMultiScale(roiGray, eyes);
    for (let j = 0; j < eyes.size(); ++j) {
      let point1 = new cv.Point(eyes.get(j).x, eyes.get(j).y);
      let point2 = new cv.Point(eyes.get(j).x + eyes.get(j).width, eyes.get(j).y + eyes.get(j).height);
      cv.rectangle(roiSrc, point1, point2, [0, 0, 255, 255]);
    }
    roiGray.delete();
    roiSrc.delete();
  }
  const canvas = createCanvas(image.width, image.height);
  cv.imshow(canvas, src);
  writeFileSync('output3.jpg', canvas.toBuffer('image/jpeg'));
  src.delete(); gray.delete(); faceCascade.delete(); eyeCascade.delete(); faces.delete(); eyes.delete()
})();
/**
 * Loads opencv.js.
 *
 * Instalamos la emulación HTML Canvas para admitir `cv.imread()` y `cv.imshow`
 *
 * Mounts given local folder `localRootDir` in emscripten filesystem folder `rootDir`.
 * By default it will mount the local current directory in emscripten `/work` directory.
 * This means that `/work/foo.txt` will be resolved to the local file `./foo.txt`
 * @param {string} rootDir        The directory in emscripten filesystem in which the
 *                                local filesystem will be mount.
 * @param {string} localRootDir   The local directory to mount in emscripten filesystem.
 * @returns {Promise} resolved when the library is ready to use.
 */
function loadOpenCV(rootDir = '/work', localRootDir = process.cwd()) {
  if(global.Module && global.Module.onRuntimeInitialized && global.cv && global.cv.imread) {
    return Promise.resolve()
  }
  return new Promise(resolve => {
    installDOM()
    global.Module = {
      onRuntimeInitialized() {
        // Cambiamos el actual directorio de trabajo de emscripten a 'rootDir' para que las rutas
        // relativas sean resuletas con respecto a la carpeta actual, como se espera.
        cv.FS.chdir(rootDir)
        resolve()
      },
      preRun() {
        // preRun() es otra devolución de llamada como onRuntimeInitialized() pero se llama justo
        // antes de que se ejecute el código de la biblioteca.
        // Aquí montamos una carpeta local en el sistema de archivos de emscripten y queremos
        // haga esto se realica antes de que se ejecute la biblioteca para que el sistema
        // de archivos sea accesible desde el principio
        const FS = global.Module.FS
        // create rootDir if it doesn't exists
        if(!FS.analyzePath(rootDir).exists) {
          FS.mkdir(rootDir);
        }
        // create localRootFolder if it doesn't exists
        if(!existsSync(localRootDir)) {
          mkdirSync(localRootDir, { recursive: true});
        }
        // FS.mount() es similar a la operación mount de Linux/POSIX. Básicamente monta un
        // sistema de archivos externo con formato dado, en el directorio del sistema de
        // archivos actual dado.
        FS.mount(FS.filesystems.NODEFS, { root: localRootDir}, rootDir);
      }
    };
    global.cv = require('./opencv.js')
  });
}
function installDOM(){
  const dom = new JSDOM();
  global.document = dom.window.document;
  global.Image = Image;
  global.HTMLCanvasElement = Canvas;
  global.ImageData = ImageData;
  global.HTMLImageElement = Image;
}