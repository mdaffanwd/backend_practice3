import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join('public', 'temp');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true }); // Create folder if it doesn't exist
    }
    cb(null, './public/temp');
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    // null is for error. The null indicates no error occurred.
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

export default upload;
