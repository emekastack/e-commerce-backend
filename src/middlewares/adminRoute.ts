import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./asyncHandler";
import { UnauthorizedException } from "../common/utils/catch-errors";
import { Roles } from "../common/enums/role.enum";

export const adminRoute = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user    
    if (!user || user.role !== Roles.ADMIN) {
    throw new UnauthorizedException("Admin access required");
  }
  next();
})