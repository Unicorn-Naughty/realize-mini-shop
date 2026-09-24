import express, { type Express } from "express";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import { YAML } from "bun";
import path from "path";
import { usersRouter } from "./users/routes";
import { UserRepo } from "./users/repo";
import { UserService } from "./users/service";
import { errorMiddleware } from "./middlewares";
import { CatalogRepo } from "./catalog/repo";
import { CatalogService } from "./catalog/service";
import { catalogRouter } from "./catalog/routes";
import { redis } from "./shared";
import { OrderItemRepo, OrderRepo } from "./orders/repo";
import { OrderService } from "./orders/services";
import { orderRouter } from "./orders/routes";

export const createApp = async (): Promise<Express> => {
  const specPath = path.join(import.meta.dir, "swagger.yaml");
  const file = fs.readFileSync(specPath, "utf-8");
  const parsed = YAML.parse(file);

  const app = express();

  if (!redis.isOpen) {
    await redis.connect();
  }

  const userRepo = new UserRepo();
  const catalogRepo = new CatalogRepo();
  const orderRepo = new OrderRepo();
  const orderItemRepo = new OrderItemRepo();

  const orderService = new OrderService(orderRepo, orderItemRepo, catalogRepo);
  const userService = new UserService(userRepo);
  const catalogService = new CatalogService(catalogRepo, redis);

  app.use(express.json());

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("swagger.yaml must be an object");
  }

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/auth", usersRouter(userService));

  app.use("/catalog", catalogRouter(catalogService, redis));
  app.use("/order", orderRouter(orderService));

  app.use("/", swaggerUi.serve, swaggerUi.setup(parsed));

  app.use(errorMiddleware);

  return app;
};
