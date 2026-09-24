/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { describe, expect, test } from "vitest";
import { createApp } from "../app";
import request from "supertest";

const unique = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const authApp = async () => {
  const app = await createApp();
  const email = `order-${unique()}@ex.com`;

  const registered = await request(app)
    .post("/auth/register")
    .send({ email, password: "secret12" });

  const token = registered.body.accessToken as string;
  const auth = { Authorization: `Bearer ${token}` };

  return { app, auth };
};

const createProduct = (
  app: Awaited<ReturnType<typeof createApp>>,
  auth: { Authorization: string },
  stock: number,
) =>
  request(app)
    .post("/catalog/create")
    .set(auth)
    .send({ name: `item-${unique()}`, price: 50, stock });

describe("order", () => {
  test("POST /order without token returns 401", async () => {
    const app = await createApp();

    const res = await request(app)
      .post("/order")
      .send({ catalog_id: "00000000-0000-0000-0000-000000000000", qty: 1 });

    expect(res.status).toBe(401);
    expect(res.body.message).toBeDefined();
  });

  test("creates order and decrements stock", async () => {
    const { app, auth } = await authApp();
    const product = await createProduct(app, auth, 5);
    expect(product.status).toBe(201);

    const res = await request(app)
      .post("/order")
      .set(auth)
      .send({ catalog_id: product.body.id, qty: 2 });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe("pending");

    const catalog = await request(app).get(`/catalog/${product.body.id}`);
    expect(catalog.body.stock).toBe(3);
  });

  test("not enough stock does not create order and keeps stock", async () => {
    const { app, auth } = await authApp();
    const product = await createProduct(app, auth, 1);
    expect(product.status).toBe(201);

    const res = await request(app)
      .post("/order")
      .set(auth)
      .send({ catalog_id: product.body.id, qty: 5 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();

    const catalog = await request(app).get(`/catalog/${product.body.id}`);
    expect(catalog.body.stock).toBe(1);
  });

  test("missing product returns 404", async () => {
    const { app, auth } = await authApp();

    const res = await request(app).post("/order").set(auth).send({
      catalog_id: "00000000-0000-0000-0000-000000000000",
      qty: 1,
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toBeDefined();
  });
});
