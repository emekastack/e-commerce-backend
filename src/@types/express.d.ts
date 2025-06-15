import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: any; // Adjust type as per your needs
      file: Express.Multer.File; // Adjust type as per your needs
      sessionId: string;
    }
  }
}