const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");

const {
  getSignedUrl
} = require(
  "@aws-sdk/s3-request-presigner"
);

const crypto = require("crypto");
const path = require("path");

const s3Client =
  require("../config/s3");

const env =
  require("../config/env");

function getExtension(file) {
  const extensionMap = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
  };

  return (
    extensionMap[file.mimetype] ||
    path
      .extname(
        file.originalname
      )
      .toLowerCase()
  );
}

function createObjectKey(file) {
  const extension =
    getExtension(file);

  return `${
    env.S3_PREFIX
  }/${crypto.randomUUID()}${extension}`;
}

async function uploadImage(file) {
  const key =
    createObjectKey(file);

  const command =
    new PutObjectCommand({
      Bucket:
        env.AWS_S3_BUCKET,

      Key: key,

      Body: file.buffer,

      ContentType:
        file.mimetype
    });

  await s3Client.send(
    command
  );

  return key;
}

async function deleteImage(
  key
) {
  if (!key) {
    return;
  }

  const command =
    new DeleteObjectCommand({
      Bucket:
        env.AWS_S3_BUCKET,

      Key: key
    });

  await s3Client.send(
    command
  );
}

async function getImageUrl(
  key
) {
  if (!key) {
    return null;
  }

  const command =
    new GetObjectCommand({
      Bucket:
        env.AWS_S3_BUCKET,

      Key: key
    });

  return getSignedUrl(
    s3Client,
    command,
    {
      expiresIn: 3600
    }
  );
}

module.exports = {
  uploadImage,
  deleteImage,
  getImageUrl
};