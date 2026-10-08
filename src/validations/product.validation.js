const Joi = require("joi");

const createProductSchema =
  Joi.object({
    ProductName: Joi.string()
      .trim()
      .max(200)
      .required(),

    Description: Joi.string()
      .allow("")
      .max(1000)
      .optional(),

    Price: Joi.number()
      .precision(2)
      .min(0)
      .required()
  });

const updateProductSchema =
  Joi.object({
    ProductName: Joi.string()
      .trim()
      .max(200)
      .required(),

    Description: Joi.string()
      .allow("")
      .max(1000)
      .optional(),

    Price: Joi.number()
      .precision(2)
      .min(0)
      .required()
  });

module.exports = {
  createProductSchema,
  updateProductSchema
};