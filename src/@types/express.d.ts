import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        email: string;
      }; // Adjust type as per your needs
      file: Express.Multer.File; // Adjust type as per your needs
      sessionId: string;
    }
  }
}