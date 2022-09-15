import { AccessPrincipal } from "@server/ui/models/access"
import { NextFunctionType, ResponseData } from "../model/next_function.model"

declare global {
  namespace Express {

    interface Request {
      access?: AccessPrincipal;
    }

    interface Response {
      data?: ResponseData | undefined;
      isError?: boolean;
    }
    
    type NextFunction = NextFunctionType
  }
}
