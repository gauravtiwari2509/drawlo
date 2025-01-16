import jwt from "jsonwebtoken";
interface User {
  _id: string;
  username: string;
}
function generateRefreshToken(user: User) {
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  if (!refreshTokenSecret) {
    throw new Error(
      "REFRESH_TOKEN_SECRET is not defined in environment variables"
    );
  }

  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    refreshTokenSecret,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
}

function generateAccessToken(user: User) {
  const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error(
      "ACCESS_TOKEN_SECRET is not defined in environment variables"
    );
  }
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
}
export { generateAccessToken, generateRefreshToken };
