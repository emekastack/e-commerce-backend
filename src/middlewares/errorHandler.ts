import { ErrorRequestHandler, Response } from 'express';
import { z } from "zod";
import { ErrorCode } from "../common/enums/error-code.enum";
import { clearAuthenticationCookies, REFRESH_PATH } from "../common/utils/cookie";
import { HTTPSTATUS } from "../config/http.config";

const formatZodError = (res: Response, error: z.ZodError) => {
    const errors = error?.issues?.map((err) => ({
        field: err.path.join("."),
        message: err.message,
    }))
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
        error: "validation Failed",
        message: errors
    })
}

export const errorHandler: ErrorRequestHandler = (error, req, res, next): any => {


    if (req.path === REFRESH_PATH) {
        clearAuthenticationCookies(res)
    }
    if (error instanceof SyntaxError) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            error: "Invalid JSON format, please check your request body"
        })
    }

    if (error instanceof z.ZodError) {
        return formatZodError(res, error)
    }



    return res.status(error.statusCode || HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        error: error?.message || "Unknown error occurred",
        statusCode: error.errorCode || ErrorCode.INTERNAL_SERVER_ERROR,
    })
}