import { Request, Response } from "express";
import { NotFoundException } from "../../common/utils/catch-errors";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { PasswordService, UserService } from "./user.service";
import { updatePasswordSchema } from "../../common/validators/user.validator";
import { customerSearchSchema } from "../../common/validators/product.validator";


export class UserController {
    private userService: UserService;
  private passwordService: PasswordService;

  constructor(userService: UserService) {
    this.userService = userService
    this.passwordService = new PasswordService();
    }

    public getSession = asyncHandler(async (req: Request, res: Response) => {
        const sessionId = (req as any).sessionId;

        if (!sessionId) {
            throw new NotFoundException("Session ID not found. Please log in.");
        }

        const user = await this.userService.getSessionById(sessionId);

        return res.status(HTTPSTATUS.OK).json({
            message: "Session Retrieved Successfully",
            user,
        })
    })

  /**
  * @desc Update own password (user or admin)
  * @route PATCH /user/password
  * @access Private
  */
  public updatePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
    const result = await this.passwordService.updatePassword(userId, { currentPassword, newPassword });
    return res.status(HTTPSTATUS.OK).json(result);
  });

    /**
    * @desc Get all customers
    * @route GET /user/all-customers
    * @access Admin
    */
    public getAllCustomers = asyncHandler(async (req: Request, res: Response) => {
        const searchParams = customerSearchSchema.parse({
            q: req.query.q,
            sortOrder: req.query.sortOrder ? String(req.query.sortOrder) : "desc",
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
        });

        const result = await this.userService.searchCustomers(searchParams);
        return res.status(HTTPSTATUS.OK).json({
            message: "Customers retrieved successfully",
            ...result
        });
    });
}
