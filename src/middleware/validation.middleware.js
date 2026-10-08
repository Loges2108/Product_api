function validate(schema) {
  return (req, res, next) => {
    const {
      error,
      value
    } = schema.validate(
      req.body,
      {
        abortEarly: false,

        stripUnknown: true
      }
    );

    if (error) {
      const validationError =
        new Error(
          error.details
            .map(
              (item) =>
                item.message
            )
            .join(", ")
        );

      validationError.statusCode = 400;

      return next(
        validationError
      );
    }

    req.body = value;

    next();
  };
}

module.exports = validate;