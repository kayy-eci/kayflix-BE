import type { NextFunction, Request, Response } from "express";

/**
 * Authorization: hanya user dengan role "admin" yang boleh lewat.
 *
 * WAJIB dipakai SETELAH tokenMiddleWare, karena role diambil dari
 * payload JWT yang disimpan di res.locals.user oleh auth.middleware.
 */
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user;

  if (!user) {
    return res.status(401).json({
      message: "Unauthorized. Silakan login terlebih dahulu"
    });
  }

  if (user.role !== "admin") {
    return res.status(403).json({
      message: "Akses ditolak. Hanya admin yang boleh melakukan aksi ini"
    });
  }

  next();
};

/**
 * Mencegah admin menghapus akunnya sendiri.
 * Dipakai di route user (DELETE /users/:id), bukan di route movies.
 */
export const cannotDeleteSelfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = Number(res.locals.user?.id);
  const targetId = Number(req.params.id);

  if (Number.isSafeInteger(targetId) && targetId > 0 && userId === targetId) {
    return res.status(403).json({
      message: "Maaf tidak bisa hapus akun sendiri"
    });
  }

  next();
};
