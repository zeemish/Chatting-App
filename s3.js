const fs = require("fs");

require("dotenv").config();

const AWS = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");

// ---------------------- AWS ACCESS KEYS
// const ACCESS_KEY = "AKIATDHAZCLOFROFHXUV";
// const SECRET_KEY = "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";
// const BUCKET_NAME = "jaun-api-bucket";
// const REGION = "eu-west-1";

// ------------------------ DIGITAL OCEAN ACCESS KEYS
const ACCESS_KEY = "QHJXRI3KEGPT56NYO4WN";
const SECRET_KEY = "F+cwIstzf5PpD18tX+FO5POgc25qJlIffUkw8Uims2c";
const BUCKET_NAME = "jaun";
const REGION = "nyc3";
const S3_BUCKET_ENDPOINT = "nyc3.digitaloceanspaces.com";

const s3BucketEndpoint = new AWS.Endpoint(process.env.DO_ENDPOINT);
const s3 = new S3({
  accessKeyId: process.env.DO_ACCESS_KEY,
  secretAccessKey: process.env.DO_SECRET_KEY,
  region: process.env.DO_REGION,
  endpoint: s3BucketEndpoint,
  visibility: "public",
});

exports.uploadSelfie = (file) => {
  // Read content from the file
  if (!file) {
    return;
  }
  const fileStream = fs.createReadStream(file.path);

  // Setting up S3 upload parameters
  const uploadParams = {
    Bucket: `${process.env.DO_BUCKET_NAME}/profile_pics`,
    Key: `${Date.now()}-${file.originalname}`, // File name you want to save as in S3
    Body: fileStream,
    ACL: "public-read",
  };

  // Uploading files to the bucket
  return s3.upload(uploadParams, "public").promise();
  // return s3.putObject(uploadParams, "public").promise();
};

exports.uploadChatMedia = (file) => {
  // Read content from the file
  if (!file) {
    return;
  }
  const fileStream = fs.createReadStream(file.path);

  // Setting up S3 upload parameters
  const uploadParams = {
    Bucket: `${process.env.DO_BUCKET_NAME}/chat_media`,
    Key: `${file.filename}`, // File name you want to save as in S3
    Body: fileStream,
    ACL: "public-read",
  };

  // Uploading files to the bucket
  return s3.upload(uploadParams, "public").promise();
};
