import { type Status } from "@prisma/client";
import { prisma, type Tx } from "../shared";

export interface IOrder {
  id: string;
  status?: Status;
  created_at: Date;
  updated_at: Date;
  user_id: string;
  order_item?: Array<IOrderItem>;
}

export interface IOrderItem {
  id: string;
  qty: number;
  price: number;
  created_at: Date;
  updated_at: Date;
  order_id: string;
  catalog_id: string;
}

export interface IOrderRepo {
  create(user_id: string, status?: Status, tx?: Tx): Promise<IOrder>;
  update(id: string, status: Status): Promise<IOrder>;
  findById(id: string): Promise<IOrder | null>;
  findAll(): Promise<IOrder[] | null>;
  delete(id: string): Promise<void>;
}

export interface IOrderItemRepo {
  create(
    qty: number,
    order_id: string,
    catalog_id: string,
    price: number,
    tx?: Tx,
  ): Promise<IOrderItem>;
  update(id: string, qty: number, price: number): Promise<IOrderItem>;
  findById(id: string): Promise<IOrderItem | null>;
  delete(id: string): Promise<void>;
}

export class OrderRepo implements IOrderRepo {
  async create(user_id: string, status?: Status, tx?: Tx): Promise<IOrder> {
    const db = tx ?? prisma;
    return await db.order.create({ data: { user_id, status }, include: { order_item: true } });
  }
  async update(id: string, status: Status): Promise<IOrder> {
    return await prisma.order.update({
      where: { id },
      data: { status },
      include: { order_item: true },
    });
  }
  async findById(id: string): Promise<IOrder | null> {
    return await prisma.order.findFirst({ where: { id }, include: { order_item: true } });
  }
  async delete(id: string): Promise<void> {
    await prisma.order.delete({ where: { id } });
  }

  async findAll(): Promise<IOrder[] | null> {
    return await prisma.order.findMany();
  }
}

export class OrderItemRepo implements IOrderItemRepo {
  async create(
    qty: number,
    order_id: string,
    catalog_id: string,
    price: number,
    tx?: Tx,
  ): Promise<IOrderItem> {
    const db = tx ?? prisma;
    return await db.orderItem.create({ data: { price, qty, catalog_id, order_id } });
  }
  async update(id: string, qty: number, price: number): Promise<IOrderItem> {
    return await prisma.orderItem.update({ where: { id }, data: { qty, price } });
  }
  async findById(id: string): Promise<IOrderItem | null> {
    return await prisma.orderItem.findFirst({ where: { id } });
  }
  async delete(id: string): Promise<void> {
    await prisma.orderItem.delete({ where: { id } });
  }
}
