
import type { UploadApiResponse } from "cloudinary";

import cloudinary from "../config/cloudinary.ts";

export const uploadProfileImage = (
    buffer: Buffer,
    userId: number
): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "profiles",
                public_id: `user-${userId}`,
                resource_type: "image",
                overwrite: true,
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (!result) {
                    reject(new Error("Cloudinary tidak mengembalikan hasil upload"));
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(buffer);
    });
};