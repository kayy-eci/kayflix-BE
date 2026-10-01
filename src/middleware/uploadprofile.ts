import multer from "multer";
import type { NextFunction, Request, Response } from "express";

const storage = multer.memoryStorage();

const upload = multer({
    storage, 
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("File harus berupa gambar"))
        }
    },
});

export default upload;

export const profileImageUpload = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    upload.single("profileImage")(req, res, (error: unknown) => {
        if (error) {
            console.error(error);

            if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    message: "Ukuran gambar maksimal 5MB",
                });
            }

            return res.status(400).json({
                message: error instanceof Error ? error.message : "File gambar tidak valid",
            });
        }

        next();
    });
};