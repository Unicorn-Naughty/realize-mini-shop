import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET } from "../config";
import { AppError } from "../errors";


export const authMiddleware = (req: Request, _res: Response, next: NextFunction) =>{
  const token = "authorization" in req.headers &&  typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "" 
  

  
  if(!token) {
  
       return next(new AppError("Unauthorized", 401));

  }
  
  let user
  try {
    user = jwt.verify(token, JWT_ACCESS_SECRET)  as {id: string}
  } catch (error) {
         return next(new AppError("Unauthorized", 401));

  }
  


  if(!user.id){
  
       return next(new AppError("Unauthorized", 401));

  }
  

  req.userId = user.id
  next()

}