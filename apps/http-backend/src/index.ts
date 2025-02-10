import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { verifyJWT } from "./middleware/auth.middleware";
import { prismaClient } from "@repo/db/client";
import bcrypt from "bcrypt";
import { generateAccessToken } from "./utils/jwt.util";
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

app.post("/signup", async (req: Request, res: Response): Promise<any> => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({
      message: "Please provide all the fields",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prismaClient.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });
    if (user) {
      return res.status(200).json({
        message: "User created successfully",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/signin", async (req: Request, res: Response): Promise<any> => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      message: "Please provide all the fields",
    });
  }
  try {
    const user = await prismaClient.user.findUnique({
      // @ts-ignore
      where: {
        username,
      },
    });
    console.log(user);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }
    const token = generateAccessToken({
      _id: user.id,
      username: user.username,
    });

    return res
      .cookie("token", token, {
        httpOnly: true,
      })
      .status(200)
      .json({
        message: "User signed in successfully",
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});
app.post("/room", verifyJWT, async (req, res): Promise<any> => {
  const { slug } = req.body;
  if (!slug) {
    return res.status(400).json({
      message: "Please provide a slug",
    });
  }
  //@ts-ignore
  const user = req.user;

  try {
    const room = await prismaClient.room.create({
      data: {
        slug,
        //@ts-ignore
        adminId: user.userId,
      },
    });

    return res.status(200).json({
      message: "Room created successfully",
      room,
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "P2002") {
      return res.status(400).json({
        message: "enter unique room name",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log("Server is running on port 8000");
});
