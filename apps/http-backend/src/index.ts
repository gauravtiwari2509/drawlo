import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { verifyJWT } from "./middleware/auth.middleware";
// import { primsaClient } from "@repo/db/client";

const app = express();

dotenv.config({
  path: "./.env",
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (_, res) => {
  res.send("hi there welcome to http server");
});

app.post("/signup", (req, res) => {});
app.post("/signin", (req, res) => {});
app.post("/room", verifyJWT, (req, res) => {});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log("Server is running on port 8000");
});
