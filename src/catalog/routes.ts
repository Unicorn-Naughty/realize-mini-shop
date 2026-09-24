import { Router } from "express";
import { type CatalogService } from "./service";
import { type RedisClient } from "../shared";

export const catalogRouter = (catalogService: CatalogService, _redis: RedisClient) => {
  const router = Router();

  router.get("/products", async (req, res) => {
    const { limit, page } = req.query;

    const pageNum = typeof page === "string" ? Number(page) : 1;
    const limitNum = typeof limit === "string" ? Number(limit) : undefined;

    const data = await catalogService.getAll(pageNum, limitNum);

    res.status(200).json(data);
  });

  router.post("/create", async (req, res) => {
    const { name, stock, price } = req.body as { name: string; stock: number; price: number };

    const data = await catalogService.create(name, price, stock);

    res.status(201).json(data);
  });

  router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const { stock, name } = req.body as { stock?: number; name?: string };
    const data = await catalogService.update(id, stock, name);

    res.status(200).json(data);
  });

  router.get("/:id", async (req, res) => {
    const { id } = req.params;

    const data = await catalogService.getOne(id);

    res.status(200).json(data);
  });

  return router;
};
