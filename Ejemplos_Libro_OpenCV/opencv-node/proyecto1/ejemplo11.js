const Jimp = require('jimp');
async function onRuntimeInitialized(){
  // carga el archivo de imagen local con jimp.
  // Admite jpg, png, bmp, tiff y gif:
  var jimpSrc = await Jimp.read('./lena.jpg');
  // La propiedad `jimpImage.bitmap` tiene el ImageData decodificado 
  // que podemos usar para crear un cv:Mat
  var src = cv.matFromImageData(jimpSrc.bitmap);
  // Las siguientes líneas son copiar y pegar del tutorial de dilatación
  // de opencv.js: 
  let dst = new cv.Mat();
  let M = cv.Mat.ones(5, 5, cv.CV_8U);
  let anchor = new cv.Point(-1, -1);
  cv.dilate(src, dst, M, anchor, 1, cv.BORDER_CONSTANT,
		cv.morphologyDefaultBorderValue());
  // Ahora que hemos terminado, queremos escribir `dst` en el archivo
  // `output.png`. Para ello creamos una imagen `Jimp`que acepta el image data
  // de la imagen dst como un Buffer:
  // [`Buffer`](https://nodejs.org/docs/latest-v10.x/api/buffer.html).
  // `write('output.png')` lo escribirá en el disco y Jimp deduce el formato
  // de salida del nombre de archivo dado
  new Jimp({
    width: dst.cols,
    height: dst.rows,
    data: Buffer.from(dst.data)
  })
  .write('output.png');
  src.delete();
  dst.delete();
}
// Finalmente, cargue open.js como antes. La función `onRuntimeInitialized`
// contiene nuestro programa.
Module = {
  onRuntimeInitialized
};
cv = require('./opencv.js');