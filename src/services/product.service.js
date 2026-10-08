const repository =
  require("../repositories/product.repository");

const {
  uploadImage,
  deleteImage,
  getImageUrl
} = require("./s3.service");

async function addImageUrl(
  product
) {
  if (!product) {
    return null;
  }

  return {
    ...product,

    ImageUrl:
      await getImageUrl(
        product.ImageKey
      )
  };
}

async function createProduct(
  data,
  file
) {
  let imageKey = null;

  try {
    if (file) {
      imageKey =
        await uploadImage(file);
    }

    const product =
      await repository.createProduct({
        ProductName:
          data.ProductName,

        Description:
          data.Description,

        Price:
          data.Price,

        ImageKey:
          imageKey
      });

    return addImageUrl(
      product
    );
  } catch (error) {
    if (imageKey) {
      await deleteImage(
        imageKey
      ).catch(() => {});
    }

    throw error;
  }
}

async function getProducts() {
  const products =
    await repository.getAllProducts();

  return Promise.all(
    products.map(
      (product) =>
        addImageUrl(product)
    )
  );
}

async function getProduct(
  ProductId
) {
  const product =
    await repository.getProductById(
      ProductId
    );

  if (!product) {
    return null;
  }

  return addImageUrl(
    product
  );
}

async function updateProduct(
  ProductId,
  data,
  file
) {
  const existing =
    await repository.getProductById(
      ProductId
    );

  if (!existing) {
    return null;
  }

  let newImageKey =
    existing.ImageKey;

  try {
    if (file) {
      newImageKey =
        await uploadImage(file);
    }

    const updated =
      await repository.updateProduct(
        ProductId,
        {
          ProductName:
            data.ProductName,

          Description:
            data.Description,

          Price:
            data.Price,

          ImageKey:
            newImageKey
        }
      );

    if (!updated) {
      if (
        file &&
        newImageKey !==
          existing.ImageKey
      ) {
        await deleteImage(
          newImageKey
        ).catch(() => {});
      }

      return null;
    }

    if (
      file &&
      existing.ImageKey &&
      existing.ImageKey !==
        newImageKey
    ) {
      await deleteImage(
        existing.ImageKey
      ).catch(() => {});
    }

    return addImageUrl(
      updated
    );
  } catch (error) {
    if (
      file &&
      newImageKey &&
      newImageKey !==
        existing.ImageKey
    ) {
      await deleteImage(
        newImageKey
      ).catch(() => {});
    }

    throw error;
  }
}

async function removeProduct(
  ProductId
) {
  const product =
    await repository.getProductById(
      ProductId
    );

  if (!product) {
    return null;
  }

  const deleted =
    await repository.deleteProduct(
      ProductId
    );

  if (product.ImageKey) {
    await deleteImage(
      product.ImageKey
    ).catch((error) => {
      console.error(
        "S3 image deletion failed:",
        error.message
      );
    });
  }

  return deleted;
}

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  removeProduct
};