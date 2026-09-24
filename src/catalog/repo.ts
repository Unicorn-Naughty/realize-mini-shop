import { prisma, type Tx } from "../shared";

export interface ICatalog {
  id: string;
  name: string;
  price: number;
  stock: number;
  created_at: Date;
  updated_at: Date;
}

export interface PaginatedMeta {
  currentPage: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ICatalogRepo {
  findById(id: string, tx?: Tx): Promise<ICatalog | null>;
  findByName(name: string): Promise<ICatalog | null>;
  findAll(page: number, limit?: number): Promise<PaginatedResponse<ICatalog>>;
  update(id: string, stock?: number, name?: string, tx?: Tx): Promise<ICatalog>;
  updateMany(catalog_id: string, qty: number, tx?: Tx): Promise<{ count: number }>;
  create(name: string, price: number, stock: number): Promise<ICatalog>;
}

export class CatalogRepo implements ICatalogRepo {
  async findById(id: string, tx?: Tx): Promise<ICatalog | null> {
    const db = tx ?? prisma;
    return await db.catalog.findFirst({ where: { id } });
  }
  async findByName(name: string): Promise<ICatalog | null> {
    return await prisma.catalog.findFirst({ where: { name } });
  }
  async findAll(page: number, limit?: number): Promise<PaginatedResponse<ICatalog>> {
    if (limit === undefined) {
      const items = await prisma.catalog.findMany({
        orderBy: { id: "asc" },
      });
      return {
        data: items,
        meta: {
          currentPage: 1,
          limit: items.length,
          totalCount: items.length,
          totalPages: items.length === 0 ? 0 : 1,
        },
      };
    }
    const skip = (page - 1) * limit;
    const [items, totalCount] = await prisma.$transaction([
      prisma.catalog.findMany({
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.catalog.count(),
    ]);
    return {
      data: items,
      meta: {
        currentPage: page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
  async update(id: string, stock?: number, name?: string, tx?: Tx): Promise<ICatalog> {
    const db = tx ?? prisma;
    return await db.catalog.update({
      where: { id },
      data: {
        stock,
        name,
      },
    });
  }
  async updateMany(catalog_id: string, qty: number, tx?: Tx) {
    const db = tx ?? prisma;
    return await db.catalog.updateMany({
      where: { id: catalog_id, stock: { gte: qty } },
      data: { stock: { decrement: qty } },
    });
  }
  async create(name: string, price: number, stock: number): Promise<ICatalog> {
    return await prisma.catalog.create({
      data: {
        name,
        price,
        stock,
      },
    });
  }
}
