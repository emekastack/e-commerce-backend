import { Router } from "express";
import { userController } from "./user.module";


const userRoute = Router();

userRoute.get("/session", userController.getSession);
export default userRoute;