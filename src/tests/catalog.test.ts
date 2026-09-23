import { describe, expect, test } from "vitest"
import { createApp } from "../app"
import request from "supertest"

const uniqueName = () => `product-${Date.now()}-${Math.random().toString(16).slice(2)}`

const createProduct = async (
  app: ReturnType<typeof createApp>,
  body: { name: string; price: number; stock: number },
) => request(await app).post("/catalog/create").send(body)

describe("catalog", () => {
  test("create returns 201", async () => {
    const app = createApp()
    const name = uniqueName()

    const res = await createProduct(app, { name, price: 100, stock: 5 })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe(name)
    expect(res.body.price).toBe(100)
    expect(res.body.stock).toBe(5)
    expect(res.body.id).toBeDefined()
  })

  test("duplicate name returns 400", async () => {
    const app = createApp()
    const name = uniqueName()

    const first = await createProduct(app, { name, price: 100, stock: 5 })
    const second = await createProduct(app, { name, price: 200, stock: 1 })

    expect(first.status).toBe(201)
    expect(second.status).toBe(400)
    expect(second.body.message).toBeDefined()
  })

  test("getAll without limit returns all created in this test", async () => {
    const app = createApp()
    const names = [uniqueName(), uniqueName(), uniqueName()]

    for (const name of names) {
      const created = await createProduct(app, { name, price: 10, stock: 1 })
      expect(created.status).toBe(201)
    }

    const res = await request(await app).get("/catalog/products")

   
    

    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThanOrEqual(3)
    expect(res.body.meta.totalPages).toBe(1)
    expect(res.body.meta.totalCount).toBe(res.body.data.length)
    for (const name of names) {
      expect(res.body.data.some((item: { name: string }) => item.name === name)).toBe(true)
    }
  })

  test("getAll with page and limit paginates", async () => {
    const app = createApp()
    const prefix = uniqueName()
    const names = [`${prefix}-a`, `${prefix}-b`, `${prefix}-c`]

    for (const name of names) {
      await createProduct(app, { name, price: 10, stock: 1 })
    }

    const res = await request(await app).get("/catalog/products").query({ page: 1, limit: 2 })

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.currentPage).toBe(1)
    expect(res.body.meta.limit).toBe(2)
    expect(res.body.meta.totalCount).toBeGreaterThanOrEqual(3)
    expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(2)
  })

  test("getOne returns product", async () => {
    const app = createApp()
    const name = uniqueName()
    const created = await createProduct(app, { name, price: 50, stock: 3 })

    const res = await request(await app).get(`/catalog/${created.body.id}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(created.body.id)
    expect(res.body.name).toBe(name)
  })

  test("getOne returns null when missing", async () => {
    const app = await createApp()

    const res = await request(app).get("/catalog/00000000-0000-0000-0000-000000000000")

    expect(res.status).toBe(200)
    expect(res.body).toBeNull()
  })

  test("update stock then list shows new stock", async () => {
    const app = createApp()
    const name = uniqueName()
    const created = await createProduct(app, { name, price: 10, stock: 3 })

    const updated = await request(await app)
      .patch(`/catalog/${created.body.id}`)
      .send({ stock: 9 })

    expect(updated.status).toBe(200)
    expect(updated.body.stock).toBe(9)

    const list = await request(await app).get("/catalog/products")
    const item = list.body.data.find((row: { id: string }) => row.id === created.body.id)

    expect(item).toBeDefined()
    expect(item.stock).toBe(9)
  })

  test("create invalidates showcase cache", async () => {
    const app = createApp()

    await request(await app).get("/catalog/products")

    const name = uniqueName()
    const created = await createProduct(app, { name, price: 15, stock: 2 })
    expect(created.status).toBe(201)

    const list = await request(await app).get("/catalog/products")
    const found = list.body.data.some((row: { name: string }) => row.name === name)

    expect(found).toBe(true)
  })

  test("update missing product returns 404", async () => {
    const app = await createApp()

    const res = await request(app)
      .patch("/catalog/00000000-0000-0000-0000-000000000000")
      .send({ stock: 1 })

    expect(res.status).toBe(404)
    expect(res.body.message).toBeDefined()
  })
})