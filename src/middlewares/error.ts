import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";

export const errorMiddleware= (err: unknown, _req: Request, res: Response, _next: NextFunction)=>{
  if(err instanceof AppError){
    res.status(err.statusCode).json(
      err.details ? {message: err.message, details: err.details} : {message: err.message}
    )
  }

  res.status(500).json({ message: "Internal server error" });
}