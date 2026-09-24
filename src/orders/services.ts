import { type Status } from "@prisma/client";
import { type ICatalogRepo } from "../catalog/repo";
import { type IOrder, type IOrderItemRepo, type IOrderRepo } from "./repo";
import { AppError } from "../errors";
import { withTx } from "../shared";

export interface IOrderService {
  createOrder(user_id: string, catalog_id: string, qty: number, status?: Status): Promise<IOrder>;
}

export class OrderService implements IOrderService {
  constructor(
    private orderRepo: IOrderRepo,
    private orderItemRepo: IOrderItemRepo,
    private catalogRepo: ICatalogRepo,
  ) {}

  async createOrder(
    user_id: string,
    catalog_id: string,
    qty: number,
    status?: Status,
  ): Promise<IOrder> {
    return withTx(async (tx) => {
      const order = await this.orderRepo.create(user_id, status, tx);
      const catalog = await this.catalogRepo.findById(catalog_id, tx);

      if (!catalog) throw new AppError("Position not found", 404);

      const { count } = await this.catalogRepo.updateMany(catalog_id, qty, tx);

      if (!count) throw new AppError("Change quantity of product not enough", 400);

      const price = catalog.price * qty;

      await this.orderItemRepo.create(qty, order.id, catalog_id, price, tx);

      return order;
    });
  }
}
