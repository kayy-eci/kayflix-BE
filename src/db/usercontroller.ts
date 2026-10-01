import type { Request, Response } from "express";
import type { RowDataPacket } from "mysql2/promise";
import pool from "./index..ts";
import { uploadProfileImage } from "../services/cloudinaryservice.ts";

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

        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE id = ? LIMIT 1",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User tidak ditemukan",
            });
        }

        const result = await uploadProfileImage(
            req.file.buffer,
            userId
        );

        await pool.query(
            "UPDATE users SET profile_image_url = ?, profile_image_public_id = ? WHERE id = ?",
            [
                result.secure_url,
                result.public_id,
                userId,
            ]
        );

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