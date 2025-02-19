import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import { connectToRabbitMQ, getChannel } from "./rabbitMQ";
import { startRabbitMQConsumer } from "./rabbitMQConsumer";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

dotenv.config({ path: "./.env" });

interface User {
  userId: string;
  ws: WebSocket;
  rooms: number[];
}
//later use some state management library
const Users: User[] = [];

async function initializeRabbitMQ() {
  try {
    await connectToRabbitMQ();
    console.log("Connected to RabbitMQ.");
  } catch (error) {
    console.error("Error initializing RabbitMQ:", error);
    process.exit(1);
  }
}

async function initializeServer() {
  await initializeRabbitMQ();
  startRabbitMQConsumer();
}
initializeServer();
wss.on("connection", (ws, request) => {
  const url = request.url;

  if (!url) {
    ws.send("Error: No URL provided.");
    ws.close();
    return;
  }

  const queryParamsString = url.split("?")[1];

  if (!queryParamsString) {
    ws.send("Error: No query parameters found.");
    ws.close();
    return;
  }

  const queryPrams = new URLSearchParams(queryParamsString);
  const token = queryPrams.get("token");
  if (!token) {
    ws.send("Error: No token provided.");
    ws.close();
    return;
  }

  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
  if (!ACCESS_TOKEN_SECRET) {
    ws.send("Error: Access token secret is not defined.");
    ws.close();
    return;
  }

  let decodedToken: JwtPayload | string;
  try {
    decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (err) {
    ws.send("Error: Invalid token.");
    console.error("Token verification failed:", err);
    ws.close();
    return;
  }

  const userId = (decodedToken as JwtPayload).userId;
  if (!userId) {
    ws.send("Error: Invalid token.");
    ws.close();
    return;
  }

  const existingUser = Users.find((user) => user.userId === userId);
  if (existingUser) {
    existingUser.ws = ws;
  } else {
    const newUser: User = { userId, ws, rooms: [] };
    Users.push(newUser);
  }

  ws.on("message", async (data: string) => {
    try {
      const parsedData = JSON.parse(data);
      const { type, roomId } = parsedData;
      if (!roomId) {
        ws.send("Error: No roomId provided.");
        return;
      }

      const user = Users.find((user) => user.userId === userId);
      if (!user) {
        ws.send("Error: User not found.");
        ws.close();
        return;
      }

      const roomExists = await prismaClient.room.findUnique({
        where: { id: roomId },
      });
      if (!roomExists) {
        ws.send(`Error: Room ${roomId} does not exist.`);
        return;
      }

      if (type === "JOIN") {
        if (!user.rooms.includes(roomId)) {
          user.rooms.push(roomId);
          ws.send(`Joined room: ${roomId}`);
        } else {
          ws.send(`Already in room: ${roomId}`);
        }
      } else if (type === "LEAVE") {
        user.rooms = user.rooms.filter((room) => room !== roomId);
        ws.send(`Left room: ${roomId}`);
      } else if (type === "CHAT") {
        const messageData = {
          roomId,
          userId,
          message: parsedData.message,
        };

        const channel = getChannel();
        channel.sendToQueue(
          "chat_queue",
          Buffer.from(JSON.stringify(messageData)),
          { persistent: true }
        );
        const usersInRoom = Users.filter((user) => user.rooms.includes(roomId));
        usersInRoom.forEach((user) => {
          user.ws.send(JSON.stringify({ roomId, message: parsedData.message }));
        });
      }
    } catch (err) {
      ws.send("Error: Invalid message format.");
      console.error("Error parsing message:", err);
    }
  });

  ws.on("close", () => {
    const index = Users.findIndex((user) => user.userId === userId);
    if (index !== -1) {
      Users.splice(index, 1);
      // console.log(`User ${userId} disconnected`);
    }
  });
});
