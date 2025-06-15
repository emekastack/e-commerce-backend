import "dotenv/config"
import mongoose from "mongoose";
import { Roles } from "../common/enums/role.enum";
import { config } from "../config/app.config";
import UserModel from "../database/models/user.model";
import { logger } from "../utils/logger";

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.MONGO_URI);

        await UserModel.create({
            name: config.ADMIN.NAME,
            email: config.ADMIN.EMAIL,
            password: config.ADMIN.PASSWORD,
            role: Roles.ADMIN
        });
        logger.info("Admin created Successful");
    } catch (error) {
        console.error("Error with data import", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedDatabase();