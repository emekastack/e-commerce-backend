import { z } from "zod";
import { NotFoundException } from "../../common/utils/catch-errors";
import SessionModel from "../../database/models/session.model";
import { customerSearchSchema } from "../../common/validators/product.validator";
import { hash } from "bcrypt";
import UserModel from "../../database/models/user.model";
import { updatePasswordSchema } from "../../common/validators/user.validator";

export class UserService {
  public async getSessionById(sessionId: string) {
    const session = await SessionModel.findById(sessionId)

    if (!session) {
      throw new NotFoundException("Session not found");
    }
    const { userId, role , name, email} = session;
    return {
      userId,
      role,
      name,
      email    
    };
  }

 
// SEARCH CUSTOMERS
public async searchCustomers(searchParams: z.infer<typeof customerSearchSchema>) {
    const { q, sortOrder, page, limit } = searchParams;

    const filter: any = {};
    if (q) {
        filter.$or = [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
        ];
    }

    const skip = (page - 1) * limit;

    // Aggregation to get user details, total orders, and total amount spent
    const customers = await UserModel.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: "orders",
                localField: "_id",
                foreignField: "userId",
                as: "orders"
            }
        },
        {
            $addFields: {
                totalOrders: { $size: "$orders" },
                totalAmountSpent: { $sum: "$orders.totalAmount" }
            }
        },
        {
            $project: {
                password: 0,
                userPreferences: 0,
                orders: 0 // remove orders array from result
            }
        },
        { $sort: { createdAt: sortOrder === "asc" ? 1 : -1 } },
        { $skip: skip },
        { $limit: limit }
    ]);

    const totalCustomers = await UserModel.countDocuments(filter);

    return {
        customers,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCustomers / limit),
            totalItems: totalCustomers,
            hasNextPage: (page * limit) < totalCustomers,
            hasPrevPage: page > 1,
            limit,
        }
    };
}

}

export class PasswordService {
  public async updatePassword(userId: string, payload: { currentPassword: string; newPassword: string }) {
    const { currentPassword, newPassword } = updatePasswordSchema.parse(payload);

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new NotFoundException("Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    return { message: "Password updated successfully" };
  }
}
