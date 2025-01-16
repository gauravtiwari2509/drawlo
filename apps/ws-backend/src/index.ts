import { WebSocketServer } from "ws";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
const wss = new WebSocketServer({ port: 8080 });
import jwt, { JwtPayload } from "jsonwebtoken";

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

  const queryPrams = new URLSearchParams(url.split("?")[1]);
  const token = queryPrams.get("token");
  if (!token) {
    ws.send("Error: No token provided.");
    ws.close();
    return;
  }
  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error("access token is not definied");
  }
  const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
  if (!(decodedToken as JwtPayload).userId) {
    ws.close();
    return;
  }

  ws.on("message", (data) => {
    ws.send("pong");
  });
});
