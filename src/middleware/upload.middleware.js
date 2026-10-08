const multer = require("multer");

const env = require("../config/env");

const storage =
  multer.memoryStorage();

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const upload = multer({
  storage,

  limits: {
    fileSize:
      env.MAX_FILE_SIZE_MB *
      1024 *
      1024
  },

  fileFilter:
    (req, file, callback) => {
      if (
        !allowedMimeTypes.includes(
          file.mimetype
        )
      ) {
        const error =
          new Error(
            "Only JPEG, PNG and WEBP images are allowed."
          );

        error.statusCode = 400;

        return callback(
          error
        );
      }

      callback(null, true);
    }
});

module.exports = upload;