import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { UserService } from "./user.service";
import { BadRequestException, NotFoundException } from "../../common/utils/catch-errors";
import { HTTPSTATUS } from "../../config/http.config";


export class UserController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService
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
   
}
