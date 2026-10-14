
import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import "dotenv/config";

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET belum diisi di .env");
}

export const tokenMiddleWare =  async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized. No token provided"
    })
  }
 try {
    const payload = jwt.verify(token, SECRET) as JwtPayload;
    
    // const isBlacklisted = await redis.get(`blacklist:${payload.jti}`);
    // if (isBlacklisted) {
    //   return res.status(401).json({ message: "Token sudah tidak berlaku" });
    // }
    res.locals.user = payload;
    next()
 } catch (error) {
    return res.status(401).json({
      message: "Invalid token"
    })
 }


}