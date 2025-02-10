import jwt, { JwtPayload } from "jsonwebtoken";
import "dotenv/config";
import { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

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
        message: "No token provided",
      });
    }

    const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;

    if (!decodedToken.userId) {
      return res.status(401).json({
        message: "Invalid token, userId not found",
      });
    }

    req.user = decodedToken; 

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export { verifyJWT };
