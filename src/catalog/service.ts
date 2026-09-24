import { AppError } from "../errors";
import { type RedisClient } from "../shared";
import { type ICatalog, type ICatalogRepo, type PaginatedResponse } from "./repo";

const REDIS_CATALOG_KEY = "catalog:products:keys";

export interface ICatalogService {
  create(name: string, price: number, stock: number): Promise<ICatalog>;
  update(id: string, stock?: number, name?: string): Promise<ICatalog>;
  getOne(id: string): Promise<ICatalog | null>;
  getAll(page: number, limit?: number): Promise<PaginatedResponse<ICatalog>>;
}

export class CatalogService implements ICatalogService {
  constructor(
    private catalogRepo: ICatalogRepo,
    private redis: RedisClient,
  ) {}
  async create(name: string, price: number, stock: number): Promise<ICatalog> {
    const uniqueName = await this.catalogRepo.findByName(name);

    if (uniqueName) throw new AppError("Name already exsist", 400);

    const data = await this.catalogRepo.create(name, price, stock);
    const keys = await this.redis.sMembers(REDIS_CATALOG_KEY);
    if (keys.length > 0) {
      await this.redis.del(keys);
    }

    await this.redis.del(REDIS_CATALOG_KEY);

    return data;
  }
  async update(id: string, stock?: number, name?: string): Promise<ICatalog> {
    const catalog = await this.catalogRepo.findById(id);

    if (!catalog) throw new AppError("Cannot find catalog for update", 404);

    const data = await this.catalogRepo.update(id, stock, name);
    const keys = await this.redis.sMembers(REDIS_CATALOG_KEY);

    if (keys.length > 0) {
      await this.redis.del(keys);
    }
    await this.redis.del("catalog:products:keys");

    return data;
  }

  async getOne(id: string): Promise<ICatalog | null> {
    const catalog = await this.catalogRepo.findById(id);

    return catalog;
  }
  async getAll(page: number, limit?: number): Promise<PaginatedResponse<ICatalog>> {
    const key = limit === undefined ? "catalog:products:all" : `catalog:products:${page}:${limit}`;

    const cachedData = await this.redis.get(`${key}`);

    if (cachedData) {
      return JSON.parse(cachedData) as PaginatedResponse<ICatalog>;
    }

    const data = await this.catalogRepo.findAll(page, limit);

    await this.redis.set(`${key}`, JSON.stringify(data), {
      expiration: { type: "EX", value: 120 },
    });
    await this.redis.sAdd(REDIS_CATALOG_KEY, key);

    return data;
  }
}
