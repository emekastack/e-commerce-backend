import { Request } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import path from "path";
import { BadRequestException } from "../common/utils/catch-errors";
import cloudinary from "./cloudinary.config";

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        //@ts-ignore
        folder: "e-commerce",
        allowedFormats: ["jpeg", "jpg", "png"],
        transformation: [{ width: 500, height: 500, crop: "limit" }],
    },
})

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedFileTypes = /jpeg|jpg|png/;
    const extreme = allowedFileTypes.test(path.extname(file.originalname).toLocaleLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);
    if (extreme && mimetype) {
        return cb(null, true);
    } else {
        cb(new BadRequestException("Invalid file type. Only image and PDF files are allowed."))
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5,
    }
})