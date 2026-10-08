const sequelize =
  require("../config/database");

async function createProduct({
  ProductName,
  Description,
  Price,
  ImageKey
}) {
  const [result] =
    await sequelize.query(
      `
      INSERT INTO dbo.Products
      (
        ProductName,
        Description,
        Price,
        ImageKey
      )
      OUTPUT
        INSERTED.ProductId,
        INSERTED.ProductName,
        INSERTED.Description,
        INSERTED.Price,
        INSERTED.ImageKey
      VALUES
      (
        :ProductName,
        :Description,
        :Price,
        :ImageKey
      )
      `,
      {
        replacements: {
          ProductName,

          Description:
            Description || null,

          Price,

          ImageKey:
            ImageKey || null
        }
      }
    );

  return result[0];
}

async function getAllProducts() {
  const [result] =
    await sequelize.query(
      `
      SELECT
        ProductId,
        ProductName,
        Description,
        Price,
        ImageKey
      FROM dbo.Products
      ORDER BY ProductId DESC
      `
    );

  return result;
}

async function getProductById(
  ProductId
) {
  const [result] =
    await sequelize.query(
      `
      SELECT
        ProductId,
        ProductName,
        Description,
        Price,
        ImageKey
      FROM dbo.Products
      WHERE ProductId = :ProductId
      `,
      {
        replacements: {
          ProductId
        }
      }
    );

  return result[0] || null;
}

async function updateProduct(
  ProductId,
  {
    ProductName,
    Description,
    Price,
    ImageKey
  }
) {
  const [result] =
    await sequelize.query(
      `
      UPDATE dbo.Products
      SET
        ProductName = :ProductName,
        Description = :Description,
        Price = :Price,
        ImageKey = :ImageKey
      OUTPUT
        INSERTED.ProductId,
        INSERTED.ProductName,
        INSERTED.Description,
        INSERTED.Price,
        INSERTED.ImageKey
      WHERE ProductId = :ProductId
      `,
      {
        replacements: {
          ProductId,

          ProductName,

          Description:
            Description || null,

          Price,

          ImageKey:
            ImageKey || null
        }
      }
    );

  return result[0] || null;
}

async function deleteProduct(
  ProductId
) {
  const [result] =
    await sequelize.query(
      `
      DELETE FROM dbo.Products
      OUTPUT
        DELETED.ProductId,
        DELETED.ImageKey
      WHERE ProductId = :ProductId
      `,
      {
        replacements: {
          ProductId
        }
      }
    );

  return result[0] || null;
}

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};