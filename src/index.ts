import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { filterXSS } from "xss";
import { config } from "./config/app.config";
import { HTTPSTATUS } from "./config/http.config";
import "./database/database";
import { asyncHandler } from "./middlewares/asyncHandler";
import { errorHandler } from "./middlewares/errorHandler";
import passport from "./middlewares/passport";
import appRouter from "./routes";

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
    config.APP_ORIGIN_ADMIN,
    config.APP_ORIGIN,
];

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));
app.use(helmet());
app.use(cookieParser())
app.use(passport.initialize());
app.use((req, res, next) => {
    if (req.body) {
        req.body = JSON.parse(filterXSS(JSON.stringify(req.body)));
    }
    next();
})


app.get("/", asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.status(HTTPSTATUS.OK).json({
        message: "Hello Subscriber!"
    })
}))

app.use(BASE_PATH, appRouter)

app.use(errorHandler);


app.listen(config.PORT, () => {
    console.log(`server running at port ${config.PORT}`);
})