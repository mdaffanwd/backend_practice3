import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
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