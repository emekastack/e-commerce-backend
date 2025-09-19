import { Router } from "express";
import { userController } from "./user.module";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";
import { adminRoute } from "../../middlewares/adminRoute";


const userRoute = Router();

userRoute.get("/session", userController.getSession);

//ADMIN ROUTES
userRoute.get("/all-customers", authenticateJWT, adminRoute, userController.getAllCustomers);

// USER/ADMIN: Update own password
userRoute.patch("/password", authenticateJWT, userController.updatePassword);
export default userRoute;