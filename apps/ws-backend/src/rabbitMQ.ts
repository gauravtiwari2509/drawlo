import amqp from "amqplib";

let connection: amqp.Connection;
let channel: amqp.Channel;

export async function connectToRabbitMQ() {
  try {
    const RABBITMQ_URL = process.env.RABBITMQ_URL;
    if (!RABBITMQ_URL) {
      throw new Error("RabbitMQ URL is not defined");
    }

    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue("chat_queue", { durable: true });

    console.log("RabbitMQ connection established and 'chat_queue' is ready");
  } catch (err) {
    console.error("Error connecting to RabbitMQ:", err);
    throw err;
  }
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ channel not established.");
  return channel;
}

export async function closeConnection() {
  if (connection) {
    await connection.close();
  }
}
