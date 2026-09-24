import { Router } from "express";
import { authMiddleware } from "../middlewares";
import { type OrderService } from "./services";

export const orderRouter = (orderService: OrderService) => {
  const router = Router();

  router.post("/", authMiddleware, async (req, res) => {
    const id = req.userId;
    const { catalog_id, qty } = req.body as { catalog_id: string; qty: number };

    const data = await orderService.createOrder(id!, catalog_id, qty);

    return res.status(201).json(data);
  });

  return router;
};
