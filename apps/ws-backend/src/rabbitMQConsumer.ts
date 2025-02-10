// src/rabbitMQConsumer.ts
import { getChannel } from "./rabbitMQ";
import { prismaClient } from "@repo/db/client";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function startConsumingMessages() {
  const channel = getChannel();

  await channel.consume("chat_queue", async (msg) => {
    if (msg) {
      try {
        const messageData = JSON.parse(msg.content.toString());
        const { roomId, userId, message } = messageData;

        await prismaClient.chat.create({
          data: {
            roomId,
            userId,
            message,
          },
        });

        // console.log(
        //   `Message from user ${userId} in room ${roomId}: ${message}`
        // );

        channel.ack(msg);
      } catch (err) {
        console.error("Error processing message:", err);
        channel.nack(msg, false, true);
      }
    }
  });
}

export async function startRabbitMQConsumer() {
  await startConsumingMessages();
}
