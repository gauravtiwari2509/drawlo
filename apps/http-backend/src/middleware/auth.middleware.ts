import jwt, { JwtPayload } from "jsonwebtoken";
import "dotenv/config";
import { NextFunction, Request, Response } from "express";

const verifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
    if (!ACCESS_TOKEN_SECRET) {
      throw new Error("ACCESS_TOKEN_SECRET is not defined");
    }
    const token: string | undefined =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        message: "no token provided",
      });
    }
    const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
    //correct type of user
    //write user finding logic
    if (!(decodedToken as JwtPayload).userId) {
      return res.status(401).json({
        message: "invalid token userId not found",
      });
    }
    const user = "temp"; //do db call
    if (!user) {
      return res.status(401).json({ message: "user not found" });
    }
    //@ts-ignore
    req.user = user;
    next();
  } catch (error) {}
};
export { verifyJWT };
