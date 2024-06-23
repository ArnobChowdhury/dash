const ffmpeg = require("fluent-ffmpeg");
const AWS = require("aws-sdk");
const { readFile } = require("node:fs/promises");

async function processVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-map 0",
        "-b:v 2400k",
        "-s:v 1920x1080",
        "-c:v libx264",
        "-an",
        "-f dash",
      ])
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

async function uploadFile(filePath) {
  const fileContent = await readFile(filePath, { encoding: "utf8" });
  const key = `${path.basename(path.dirname(filePath))}/${path.basename(
    filePath
  )}`;

  const params = {
    Bucket: "on-demand",
    Key: key,
    Body: fileContent,
  };

  return s3.upload(params).promise();
}

async function uploadFolder(folderPath) {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const fullPath = path.join(folderPath, file);
    await uploadFile(fullPath);
  }
}

module.exports = { processVideo, uploadFolder };
