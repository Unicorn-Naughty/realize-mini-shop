import { prisma } from "../shared";

export interface IUser {
  id: string;
  email: string;
  password: string;
  created_at: Date;
}

export interface IUserRepo {
  create(email: string, password: string): Promise<IUser>;
  findByEmail(email: string): Promise<IUser | null>;
  findById(id: string): Promise<IUser | null>;
}

export class UserRepo implements IUserRepo {
  async create(email: string, password: string): Promise<IUser> {
    const user = await prisma.user.create({ data: { email, password } });
    return user;
  }
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    return user;
  }
  async findById(id: string): Promise<IUser | null> {
    const user = await prisma.user.findFirst({
      where: {
        id,
      },
    });

    return user;
  }
}
