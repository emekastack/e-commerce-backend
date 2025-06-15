import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary.config";

type AsynControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const asyncHandler =
  (controller: AsynControllerType): AsynControllerType =>
  async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      next(error);
    }
  };
