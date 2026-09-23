import { IUser, IUserRepo } from "./repo";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { JWT_ACCESS_SECRET } from "../config";
import { AppError } from "../errors";

export interface IUserService {
  login(email: string, password: string): Promise<{accessToken: string, user: Partial<IUser> }>
  reg(email: string, password: string): Promise<{accessToken: string, user: Partial<IUser> }>
  me(accessToken: string): Promise<{user: Partial<IUser>}>
}

export class UserService implements IUserService {
  constructor(private userRepo: IUserRepo){}

  async login(email: string, password: string): Promise<{ accessToken: string; user: Partial<IUser>; }> {
    const user = await this.userRepo.findByEmail(email);

    if(!user) throw new AppError("invalid credentials", 401)

     const comparePassword = await bcrypt.compare(password, user.password)

     if(!comparePassword) throw new AppError("invalid credentials", 401)

    const accessToken = jwt.sign({ id: user.id }, JWT_ACCESS_SECRET, { expiresIn: '7d' })

    return {accessToken, user: {
      email: user.email,
      id: user.id,
      created_at: user.created_at
    } }
   
  }
  async reg(email: string, password: string): Promise<{ accessToken: string; user: Partial<IUser>; }> {
      const foundedUser = await this.userRepo.findByEmail(email)

    if(foundedUser) throw new AppError("User already exist", 409)

    const hashedPass = await bcrypt.hash(password, 10)

    const user = await this.userRepo.create(email, hashedPass)

    const accessToken = jwt.sign({ id: user.id }, JWT_ACCESS_SECRET, { expiresIn: '7d' })

    return {accessToken, user: {
      email: user.email,
      id: user.id,
      created_at: user.created_at
    } }


  }
  async me(id: string): Promise<{ user: Partial<IUser>; }> {
    const user = await this.userRepo.findById(id)
 
    if(!user)  throw new AppError("invalid credentials", 401)

    return {
      user: {
        email: user.email,
        created_at: user.created_at,
        id: user.id
      }
    }

   
  }

}