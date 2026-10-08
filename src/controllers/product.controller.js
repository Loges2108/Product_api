const productService =
  require("../services/product.service");

function getProductId(req) {
  const ProductId =
    Number(req.params.id);

  if (
    !Number.isInteger(
      ProductId
    ) ||
    ProductId <= 0
  ) {
    const error =
      new Error(
        "Invalid ProductId."
      );

    error.statusCode = 400;

    throw error;
  }

  return ProductId;
}

async function createProduct(
  req,
  res,
  next
) {
  try {
    const product =
      await productService.createProduct(
        req.body,
        req.file
      );

    res.status(201).json({
      success: true,

      message:
        "Product created successfully.",

      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function getProducts(
  req,
  res,
  next
) {
  try {
    const products =
      await productService.getProducts();

    res.status(200).json({
      success: true,

      data: products
    });
  } catch (error) {
    next(error);
  }
}

async function getProduct(
  req,
  res,
  next
) {
  try {
    const ProductId =
      getProductId(req);

    const product =
      await productService.getProduct(
        ProductId
      );

    if (!product) {
      return res.status(404).json({
        success: false,

        message:
          "Product not found."
      });
    }

    res.status(200).json({
      success: true,

      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(
  req,
  res,
  next
) {
  try {
    const ProductId =
      getProductId(req);

    const product =
      await productService.updateProduct(
        ProductId,
        req.body,
        req.file
      );

    if (!product) {
      return res.status(404).json({
        success: false,

        message:
          "Product not found."
      });
    }

    res.status(200).json({
      success: true,

      message:
        "Product updated successfully.",

      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(
  req,
  res,
  next
) {
  try {
    const ProductId =
      getProductId(req);

    const product =
      await productService.removeProduct(
        ProductId
      );

    if (!product) {
      return res.status(404).json({
        success: false,

        message:
          "Product not found."
      });
    }

    res.status(200).json({
      success: true,

      message:
        "Product deleted successfully."
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
};