import { prisma } from "../shared"

export interface ICatalog {
  id: string
  name: string
  price: number
  stock: number
  created_at: Date
  updated_at: Date
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

export interface ICatalogRepo  {
  findById(id: string): Promise<ICatalog | null>
  findByName(name: string): Promise<ICatalog | null>
  findAll(page: number, limit?:number): Promise<PaginatedResponse<ICatalog>>
  update(id: string, stock?: number, name?: string): Promise<ICatalog>
  create(name: string, price: number, stock: number): Promise<ICatalog>
}

export class CatalogRepo implements ICatalogRepo {
  async findById(id: string): Promise<ICatalog | null> {
    return await prisma.catalog.findFirst({where: {id}})
   
 
  }
  async findByName(name: string): Promise<ICatalog | null> {
   return await prisma.catalog.findFirst({where: {name}})
  }
async findAll(page: number, limit?: number): Promise<PaginatedResponse<ICatalog>> {
  if (limit === undefined) {
    const items = await prisma.catalog.findMany({
      orderBy: { id: "asc" },
    })
    return {
      data: items,
      meta: {
        currentPage: 1,
        limit: items.length,
        totalCount: items.length,
        totalPages: items.length === 0 ? 0 : 1,
      },
    }
  }
  const skip = (page - 1) * limit
  const [items, totalCount] = await prisma.$transaction([
    prisma.catalog.findMany({
      skip,
      take: limit,
      orderBy: { id: "asc" },
    }),
    prisma.catalog.count(),
  ])
  return {
    data: items,
    meta: {
      currentPage: page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  }
}
 async update(id: string, stock?: number, name?: string): Promise<ICatalog> {
    return await prisma.catalog.update({
      where: {id},
      data: {
        stock,
        name
      }
    })
  }
  async create(name: string, price: number, stock: number): Promise<ICatalog> {
    return await prisma.catalog.create({
      data: {
        name,
        price,
        stock
      }
    })
  }
  
}