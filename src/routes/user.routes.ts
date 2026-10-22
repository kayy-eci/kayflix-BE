import { Router, type Request, type Response } from "express";
import { ZodError } from "zod";
import { dataUsers, credetials } from "../models/schema.ts";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { randomUUID } from "crypto";
import { tokenMiddleWare } from "../middleware/auth.middleware.ts";
import { profileImageUpload } from "../middleware/upload.middleware.ts";
import { uploadProfile } from "../controllers/user.controller.ts";
import * as userService from "../services/user.service.ts";

const router = Router();

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET belum diisi di .env");
}

router.get("/users", tokenMiddleWare, async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();

    res.status(200).json({
      message: "Berhasil fetch users!",
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil data users"
    });
  }
});

router.get("/users/:id", tokenMiddleWare, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID user tidak valid"
      });
    }

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    res.status(200).json({
      message: "Berhasil fetch user!",
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil data user"
    });
  }
});

router.get("/profile", tokenMiddleWare, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Invalid token payload"
      });
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    res.status(200).json({
      message: "Berhasil fetch profile!",
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil profile"
    });
  }
});

router.post(
  "/users/:id/profile-image",
  tokenMiddleWare,
  profileImageUpload,
  uploadProfile
);

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const validasiData = credetials.parse(req.body);
    if(!validasiData) {
      return res.status(400).json({
        message: "Data login tidak valid"
      })
    }
    const { email, password } = validasiData;
    const user = await userService.getUserByEmail(email);

    if (!user || user.password !== password) {
      return res.status(401).json({
        message: "Email / Password salah"
      })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, jti: randomUUID()},
      SECRET,
      { expiresIn: "1h" })

    res.status(200).json({
      message: "login berhasil",
      token: token
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "terjadi kesalahan pada server"
    })
  }
});

router.post("/auth/logout", tokenMiddleWare, async (req: Request, res: Response) => {
  // const { jti, exp } = res.locals.user;
  // const sisaDetik = exp - Math.floor(Date.now() / 1000);
   // if (sisaDetik > 0) {
   //   await redis.set(`Expired:${jti}`, "1", { EX : sisaDetik});
   // }

   res.status(200).json({
    message: "logout berhasil"
   })
});

router.post("/users", async (req: Request, res: Response) => {
  try {
    const validasiData  = dataUsers.parse(req.body);

    const { username, email, password} = validasiData;

    const result = await userService.createUser(username, email, password);

    res.status(201).json({
      message: "Users created succesfully",
      data: {
        usersId: result.insertId,
        username,
      }
    });
  } catch (error) {
    console.error(error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Data user tidak valid",
        errors: error.issues
      });
    }

    if (error instanceof Error && "code" in error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email sudah digunakan"
      });
    }

    res.status(500).json({
      message: "Failed to create users"
    })
  }
});

router.put("/users/:id", tokenMiddleWare, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID user tidak valid"
      });
    }

    const validasiData = dataUsers.parse(req.body);

    const {username, email, password} = validasiData;

    const result = await userService.updateUser(id, username, email, password);

    if (result.affectedRows === 0) {
      const user = await userService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          message: "User tidak ditemukan"
        });
      }
    }

    res.status(200).json({
      message: "data user berhasil di update"
    });
  } catch (error) {
    console.error(error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Data user tidak valid",
        errors: error.issues
      });
    }

    if (error instanceof Error && "code" in error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email sudah digunakan"
      });
    }

    res.status(500).json({
      message: "Gagal mengupdate user"
    });
  }
});

router.delete("/users/:id", tokenMiddleWare, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID user tidak valid",
      });
    }

    const result = await userService.deleteUser(id);

    if (result.affectedRows === 0) {
      res.status(404).json({
        message: "user tidak ditemukan",
      });

      return;
    }

    res.status(200).json({
      message: "user berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal menghapus user",
    });
  }
});

export default router;
