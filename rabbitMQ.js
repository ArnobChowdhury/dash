const amqp = require("amqplib");
const helpers = require("./helpers");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { mkdir } = require("node:fs/promises");
const { UPLOAD_QUEUE } = require("./constants");

// Connect to RabbitMQ
async function connectRabbitMQ() {
  try {
    let connection = await amqp.connect("amqp://localhost");
    let channel = await connection.createChannel();
    await channel.assertQueue(UPLOAD_QUEUE, { durable: true });
    return { channel, connection };
  } catch (err) {
    console.error("Error connecting to RabbitMQ", err);
  }
}

// listen to RabbitMQ
async function listenToRabbitMQ(channel) {
  try {
    await channel.consume(UPLOAD_QUEUE, async (msg) => {
      const message = JSON.parse(msg.content.toString());
      const { filePath, _originalName } = message;
      console.log(filePath);
      const uniqueFolderId = uuidv4();
      const uniqueFolder = path.join(__dirname, "processed", uniqueFolderId);
      await mkdir(uniqueFolder);

      const processedFilePath = path.join(
        uniqueFolder,
        `processed-${path.basename(filePath, path.extname(filePath))}.mpd`
      );
      await helpers.processVideo(filePath, processedFilePath);

      await helpers.uploadFolder(uniqueFolder);

      channel.ack(msg);
    });
  } catch (err) {
    console.error("Error listening to RabbitMQ", err);
  }
}

module.exports = { connectRabbitMQ, listenToRabbitMQ };
