import express, { type Express } from "express";
import swaggerUi  from 'swagger-ui-express';
import fs from 'fs'
import { YAML } from "bun";
import path from "path";

export const createApp =  (): Express=>{

const specPath = path.join(import.meta.dir, "swagger.yaml")
const file = fs.readFileSync(specPath, 'utf-8')
const parsed = YAML.parse(file)

const app = express()

app.use(express.json())

if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
  throw new Error("swagger.yaml must be an object")
}

app.use("/health", (_req, res)=>{
   res.status(200).json({ok: true})
})

app.use("/", swaggerUi.serve, swaggerUi.setup(parsed))

  return app
}
