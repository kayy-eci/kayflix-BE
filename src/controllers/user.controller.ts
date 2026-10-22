import type { Request, Response } from "express";
import { getUserById, updateUserProfileImage } from "../services/user.service.ts";
import { uploadProfileImage } from "../services/cloudinary.service.ts";

export const uploadProfile = async (
    req: Request,
    res: Response
) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Profile image wajib diupload",
            });
        }

        const userId = Number(req.params.id);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: "ID user tidak valid",
            });
        }

        if (Number(res.locals.user?.id) !== userId) {
            return res.status(403).json({
                message: "Tidak diizinkan mengubah profile image user lain",
            });
        }

        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User tidak ditemukan",
            });
        }

        const result = await uploadProfileImage(
            req.file.buffer,
            userId
        );

        await updateUserProfileImage(userId, result.secure_url, result.public_id);

        return res.status(200).json({
            message: "Profile image berhasil diupload",
            data: {
                userId,
                profileImageUrl: result.secure_url,
                profileImagePublicId: result.public_id,
            },
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Gagal upload profile image",
        });
    }
};




