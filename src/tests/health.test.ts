import { expect, test } from "vitest";
import { createApp } from "../app";
import request from "supertest"

test("GET /health returns 200 and {ok: true}", async()=>{
  const app = await createApp()
  const res = await request(app).get("/health")

  expect(res.status).toBe(200)
  expect(res.body).toEqual({ok: true})
})