const express = require("express");

const router =
  express.Router();

const upload =
  require("../middleware/upload.middleware");

const validate =
  require("../middleware/validation.middleware");

const {
  createProductSchema,
  updateProductSchema
} =
  require("../validations/product.validation");

const controller =
  require("../controllers/product.controller");

router.post(
  "/",
  upload.single("Image"),
  validate(
    createProductSchema
  ),
  controller.createProduct
);

router.get(
  "/",
  controller.getProducts
);

router.get(
  "/:id",
  controller.getProduct
);

router.put(
  "/:id",
  upload.single("Image"),
  validate(
    updateProductSchema
  ),
  controller.updateProduct
);

router.delete(
  "/:id",
  controller.deleteProduct
);

module.exports = router;