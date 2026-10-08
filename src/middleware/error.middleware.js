const multer =
  require("multer");

function errorMiddleware(
  err,
  req,
  res,
  next
) {
  console.error(err);

  if (
    err instanceof
    multer.MulterError
  ) {
    if (
      err.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Image size exceeds the allowed limit."
        });
    }

    return res
      .status(400)
      .json({
        success: false,

        message:
          err.message
      });
  }

  const statusCode =
    err.statusCode || 500;

  res
    .status(statusCode)
    .json({
      success: false,

      message:
        statusCode === 500
          ? "Internal server error."
          : err.message
    });
}

module.exports =
  errorMiddleware;