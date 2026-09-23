import { Router } from "express";
import { IUserService } from "./service";
import { authMiddleware } from "../middlewares";

export const usersRouter = (userService: IUserService)=>{
  const router = Router();
  
  router.post("/register", async (req,res)=>{
    const {email, password} = req.body

    const data = await userService.reg(email, password)

    res.status(201).json(data)
  })

  router.post("/login", async (req,res)=>{
    const {email, password} = req.body

    const data = await userService.login(email, password)

    res.status(200).json(data)
  })

  router.get("/me", authMiddleware, async (req,res)=>{
    const id = req.userId

    const {user} = await userService.me(id!)


    

    res.status(200).json(user)
  })

  return router
}