import { ErrorCode } from "../../common/enums/error-code.enum";
import { VerificationEnum } from "../../common/enums/verfication-code.enum";
import { LoginDto, RegisterDto, resetPasswordDto } from "../../common/interface/auth.interface";
import { hashValue } from "../../common/utils/bcrypt";
import { BadRequestException, HttpException, NotFoundException, UnauthorizedException } from "../../common/utils/catch-errors";
import { anHourFromNow, calculateExpirationDate, fortyFiveMinutesFromNow, ONE_DAY_IN_MS, threeMinutesAgo } from "../../common/utils/date-time";
import { config } from "../../config/app.config";
import { HTTPSTATUS } from "../../config/http.config";
import SessionModel from "../../database/models/session.model";
import UserModel from "../../database/models/user.model";
import VerificationCodeModel from "../../database/models/verification.model";
import { refreshTokenSignOptions, RefreshTPayload, signJwtToken, verifyJwtToken } from "../../utils/jwt";
import { logger } from "../../utils/logger";


export class AuthService {
    // Register a new user and send verification email
    public async register(registerData: RegisterDto) {
        const { name, email, password } = registerData;

        const existingUser = await UserModel.exists({ email });

        if (existingUser) {
            throw new BadRequestException("User with this email already exists", ErrorCode.AUTH_EMAIL_ALREADY_EXISTS);
        }

        const newUser = await UserModel.create({
            name,
            email,
            password
        })

        const userId = newUser._id;

        const verification = await VerificationCodeModel.create({
            userId,
            type: VerificationEnum.EMAIL_VERIFICATION,
            expiresAt: fortyFiveMinutesFromNow()
        })

        const verificationUrl = `${config.APP_ORIGIN}/confirm-email?code=${verification.code}`;

        console.log("Verification URL:", verificationUrl);

        // TODO: Setup email sending
        // await sendEmail({
        //     to: newUser.email,
        //     ...verifyEmailTemplate(verificationUrl)
        // })

        return {
            user: newUser,
        }
    }

    // Login user and handle MFA if required
    public async login(loginData: LoginDto) {
        const { email, password, userAgent } = loginData;

        logger.info(`Login attempt with email: ${email}`);
        const user = await UserModel.findOne({ email });

        if (!user) {
            logger.error(`Login failed: User with email ${email} not found`);
            throw new BadRequestException("Invalid email or password", ErrorCode.AUTH_NOT_FOUND);
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            logger.error(`Login failed: Invalid password for user with email ${email}`);
            throw new BadRequestException("Invalid email or password", ErrorCode.AUTH_USER_NOT_FOUND);
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            // Remove any existing verification codes for this user
            await VerificationCodeModel.deleteMany({
                userId: user._id,
                type: VerificationEnum.EMAIL_VERIFICATION,
            });

            // Create a new verification code
            const verification = await VerificationCodeModel.create({
                userId: user._id,
                type: VerificationEnum.EMAIL_VERIFICATION,
                expiresAt: fortyFiveMinutesFromNow(),
            });

            const verificationUrl = `${config.APP_ORIGIN}/confirm-email?code=${verification.code}`;

            // Send the verification email
            console.log("Verification URL:", verificationUrl);
            // TODO: Setup email sending
            // await sendEmail({
            //     to: user.email,
            //     ...verifyEmailTemplate(verificationUrl),
            // });

            logger.info(`Verification email sent to ${user.email}`);

            return {
                user: null,
                message: "Email not verified. Verification email sent.",
                mfaRequired: false,
                emailNotVerified: true,
                accessToken: "",
                refreshToken: "",
            };
        }

        if (user.userPreferences.enable2FA) {
            logger.info(`2FA required for user ID: ${user._id}`);
            return {
                user: null,
                mfaRequired: true,
                accessToken: "",
                refreshToken: "",
            };
        }

        logger.info(`Creating session for user ID: ${user._id}`);
        const session = await SessionModel.create({
            userId: user._id,
            name: user.name,
            email: user.email,
            userAgent,        
        })

        logger.info(`Signing tokens for user ID: ${user._id}`);

        const accessToken = signJwtToken({
            userId: user._id,
            sessionId: session._id,            
        })

        const refreshToken = signJwtToken(
            {
                sessionId: session._id,
                role: session.role
            },
            refreshTokenSignOptions
        )

        logger.info(`Login successful for user ID: ${user._id}`);
        return {
            user,
            accessToken,
            refreshToken,
            mfaRequired: false,
        };
    }

    // Verify user email using the verification code
    public async verifyEmail(code: string) {
        const validCode = await VerificationCodeModel.findOne({
            code,
            type: VerificationEnum.EMAIL_VERIFICATION,
            expiresAt: { $gt: new Date() },
        })

        if (!validCode) {
            throw new BadRequestException("Invalid or expired verification code");
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            validCode.userId,
            { isEmailVerified: true },
            { new: true }
        )

        if (!updatedUser) {
            throw new BadRequestException(
                "Unable to verify email address",
                ErrorCode.VALIDATION_ERROR
            );
        }
        await validCode.deleteOne();
        return {
            user: updatedUser,
        };
    }

    public async forgotPassword(email: string) {
        const user = await UserModel.findOne({
            email: email,
        });

        if (!user) {
            throw new NotFoundException("User not found");
        }

        //check mail rate limit is 2 emails per 3 or 10 min
        const timeAgo = threeMinutesAgo();
        const maxAttempts = 2;

        const count = await VerificationCodeModel.countDocuments({
            userId: user._id,
            type: VerificationEnum.PASSWORD_RESET,
            createdAt: { $gt: timeAgo },
        })

        if (count >= maxAttempts) {
            throw new HttpException(
                "Too many request, try again later",
                HTTPSTATUS.TOO_MANY_REQUESTS,
                ErrorCode.AUTH_TOO_MANY_ATTEMPTS
            );
        }

        const expiresAt = anHourFromNow();
        const validCode = await VerificationCodeModel.create({
            userId: user._id,
            type: VerificationEnum.PASSWORD_RESET,
            expiresAt,
        });

        const resetLink = `${config.APP_ORIGIN}/reset-password?code=${validCode.code
            }&exp=${expiresAt.getTime()}`;

        console.log("Reset Link:", resetLink);

        //TODO: Setup email sending
        // await sendEmail({
        //     to: user.email,
        //     ...passwordResetTemplate(resetLink),
        // });

        return {
            url: resetLink,
            emailId: user.email,
            message: "Password reset link sent to your email",
        };
    }

    public async resetPassword({ password, verificationCode }: resetPasswordDto) {
        const validCode = await VerificationCodeModel.findOne({
            code: verificationCode,
            type: VerificationEnum.PASSWORD_RESET,
            expiresAt: { $gt: new Date() },
        });

        if (!validCode) {
            throw new NotFoundException("Invalid or expired verification code");
        }

        const hashedPassword = await hashValue(password);

        const updatedUser = await UserModel.findByIdAndUpdate(validCode.userId, {
            password: hashedPassword,
        });

        if (!updatedUser) {
            throw new BadRequestException("Failed to reset password!");
        }

        await VerificationCodeModel.deleteMany({
            userId: updatedUser._id,
            type: VerificationEnum.PASSWORD_RESET,
        });

        await SessionModel.deleteMany({
            userId: updatedUser._id,
        });

        return {
            user: updatedUser,
        };
    }

    // Refresh token
    public async refreshToken(refreshToken: string) {
        const { payload, error } = verifyJwtToken<RefreshTPayload>(refreshToken, {
            secret: refreshTokenSignOptions.secret,
        });
        if (!payload) {
            console.log(`Refresh token error:`, error);
            throw new UnauthorizedException("Invalid refresh token");
        }

        const session = await SessionModel.findById(payload.sessionId);
        const now = Date.now();

        if (!session) {
            throw new UnauthorizedException("Session does not exist");
        }

        if (session.expiredAt.getTime() <= now) {
            throw new UnauthorizedException("Session expired");
        }

        const sessionRequireRefresh =
            session.expiredAt.getTime() - now <= ONE_DAY_IN_MS;

        if (sessionRequireRefresh) {
            session.expiredAt = calculateExpirationDate(
                config.JWT.REFRESH_EXPIRES_IN
            );
            await session.save();
        }
        const newRefreshToken = sessionRequireRefresh
            ? signJwtToken(
                {
                    sessionId: session._id,
                    role: session.role
                },
                refreshTokenSignOptions
            )
            : undefined;

        const accessToken = signJwtToken({
            userId: session.userId,
            sessionId: session._id,
        });

        return {
            accessToken,
            newRefreshToken,
        };

    }

    // Logout user by deleting the session
    public async logout(sessionId: string) {
        return await SessionModel.findByIdAndDelete(sessionId);
    }
}