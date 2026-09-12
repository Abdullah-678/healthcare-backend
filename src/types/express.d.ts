import { IRequestUser } from "../app/interfaces/requestUser.interface";
import { Role, UserStatus } from "../generated/prisma/enums";

declare global {
  namespace Express {
    interface Request {
      user?: IRequestUser;
    }
  }
}
