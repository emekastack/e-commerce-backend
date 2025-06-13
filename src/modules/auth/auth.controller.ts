import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { HTTPSTATUS } from "../../config/http.config";
import { emailSchema, loginSchema, registerSchema, resetPasswordSchema, verificationEmailSchema } from "../../common/validators/auth.validator";
import { AuthService } from "./auth.service";
import { clearAuthenticationCookies, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, setAuthenticationCookies } from "../../common/utils/cookie";
import { NotFoundException, UnauthorizedException } from "../../common/utils/catch-errors";


export class AuthController {
    private authService: AuthService

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    /**
     * @desc User registration
     * @route POST /auth/register
     * @access Public
     */
    public register = asyncHandler(
        async (req: Request, res: Response) => {
            const body = registerSchema.parse({
                ...req.body,
            });

            const { user } = await this.authService.register(body);
            return res.status(HTTPSTATUS.CREATED).json({
                message: "Verification email sent successfully",  
                user,              
            })
        }
    )

    /**
     * @desc User login
     * @route POST /auth/login
     * @access Public
     */
    public login = asyncHandler(
        async (req: Request, res: Response) => {
            const userAgent = req.headers["user-agent"];
            const body = loginSchema.parse({
                ...req.body,
                userAgent,
            });

            const { user, accessToken, refreshToken, mfaRequired, emailNotVerified, message } =
                await this.authService.login(body);

            if (emailNotVerified) {
                return res.status(HTTPSTATUS.OK).json({
                    message,
                    emailNotVerified,
                    user,
                });
            }


            if (mfaRequired) {
                return res.status(HTTPSTATUS.OK).json({
                    message,
                    mfaRequired,
                    user,
                });
            }
            return setAuthenticationCookies({
                res,
                accessToken,
                refreshToken,
            }).status(HTTPSTATUS.OK).json({
                message: "User logged in successfully",
                mfaRequired,
                user,
            });

        }
    );

    /**
     * @desc User verify email
     * @route POST /auth/verify/email
     * @access Public
     */
    public verifyEmail = asyncHandler(
        async (req: Request, res: Response): Promise<any> => {
            const { code } = verificationEmailSchema.parse(req.body);
            await this.authService.verifyEmail(code);

            return res.status(HTTPSTATUS.OK).json({
                message: "Email verified successfully",
            });
        }
    );


    /**
     * @desc User forgot password
     * @route POST /auth/forgot-password
     * @access Public
     */
    public forgotPassword = asyncHandler(
        async (req: Request, res: Response): Promise<any> => {
            const email = emailSchema.parse(req.body.email);
            await this.authService.forgotPassword(email);

            return res.status(HTTPSTATUS.OK).json({
                message: "Password reset email sent",
            });
        }
    );


    /**
     * @desc User reset password
     * @route POST /auth/reset-password
     * @access Public
     */
    public resetPassword = asyncHandler(
        async (req: Request, res: Response): Promise<any> => {
            const body = resetPasswordSchema.parse(req.body);

            await this.authService.resetPassword(body);

            return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
                message: "Reset Password successfully",
            });
        }
    );

    /**
     * @desc User refresh token
     * @route POST /auth/refresh-token
     * @access Private
     */
    public refreshToken = asyncHandler(
        async (req: Request, res: Response): Promise<any> => {
            const refreshToken = req.cookies.refreshToken as string | undefined;
            if (!refreshToken) {
                throw new UnauthorizedException("Missing refresh token");
            }

            const { accessToken, newRefreshToken } =
                await this.authService.refreshToken(refreshToken);

            if (newRefreshToken) {
                res.cookie(
                    "refreshToken",
                    newRefreshToken,
                    getRefreshTokenCookieOptions()
                );
            }

            return res
                .status(HTTPSTATUS.OK)
                .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
                .json({
                    message: "Refresh access token successfully",
                });
        }
    )

    /**
     * @desc User logout
     * @route POST /auth/logout
     * @access Private
     */
    public logout = asyncHandler(
        async (req: Request, res: Response): Promise<any> => {
            const sessionId = (req as any).sessionId;
            if (!sessionId) {
                throw new NotFoundException("Session is invalid.");
            }
            await this.authService.logout(sessionId);
            return clearAuthenticationCookies(res).status(HTTPSTATUS.OK).json({
                message: "User logout successfully",
            });
        }
    );


}