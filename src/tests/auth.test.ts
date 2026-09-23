import { describe, expect, test } from "vitest"
import { createApp } from "../app"
import request from "supertest"

describe("auth", () => {
  test("register returns 201 without password hash", async () => {
    const app = createApp()
    const email = `test-${Date.now()}@ex.com`

    const res = await request(app)
      .post("/auth/register")
      .send({ email, password: "secret12" })

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe(email)
    expect(res.body.accessToken).toBeDefined()
    expect(res.body.user.password).toBeUndefined()
  })

  test("same email address returns 409", async () => {
    const app = createApp()
    const email = `test-${Date.now()}@ex.com`

    const res = await request(app)
      .post("/auth/register")
      .send({ email, password: "secret12" })

    const secondRes = await request(app)
      .post("/auth/register")
      .send({ email, password: "secret12" })

    expect(res.status).toBe(201)
    expect(secondRes.status).toBe(409)
    expect(secondRes.body.message).toBeDefined()
  })

  test("login returns 200 and access token", async () => {
    const app = createApp()
    const email = `test-${Date.now()}@ex.com`
    const password = "secret12"

    await request(app)
      .post("/auth/register")
      .send({ email, password })

    const res = await request(app)
      .post("/auth/login")
      .send({ email, password })

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(email)
    expect(res.body.accessToken).toBeDefined()
    expect(res.body.user.password).toBeUndefined()
  })

  test("login with wrong password returns 401", async () => {
    const app = createApp()
    const email = `test-${Date.now()}@ex.com`

    await request(app)
      .post("/auth/register")
      .send({ email, password: "secret12" })

    const res = await request(app)
      .post("/auth/login")
      .send({ email, password: "wrong-password" })

    expect(res.status).toBe(401)
    expect(res.body.message).toBeDefined()
  })

  test("GET /auth/me without token returns 401", async () => {
    const app = createApp()

    const res = await request(app).get("/auth/me")

    expect(res.status).toBe(401)
    expect(res.body.message).toBeDefined()
  })

  test("GET /auth/me with token returns user without password", async () => {
    const app = createApp()
    const email = `test-${Date.now()}@ex.com`

    const registered = await request(app)
      .post("/auth/register")
      .send({ email, password: "secret12" })

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${registered.body.accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.email).toBe(email)
    expect(res.body.password).toBeUndefined()
  })
})