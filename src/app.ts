import express, { type Express, type Request, type Response } from 'express';
import cors from "cors";
import pool from './db/index..ts';
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { ZodError } from "zod";
import { dataUsers, dataMovies, credetials } from './db/dataschema.ts';
import jwt from "jsonwebtoken";
import "dotenv/config";
import { randomUUID } from "crypto";
// import { redis } from './db/redis.ts';
import { tokenMiddleWare } from "./middleware/authmiddleware.ts";
import { profileImageUpload } from "./middleware/uploadprofile.ts";
import { uploadProfile } from "./db/usercontroller.ts";



const app: Express = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET belum diisi di .env");
}

app.get("/api/users", tokenMiddleWare ,async (req: Request, res: Response) => {
  try {
    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT id, username, email, profile_image_url, created_at, updated_at FROM users"
    );

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

app.get("/api/users/:id", tokenMiddleWare, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID user tidak valid"
      });
    }

    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT id, username, email, profile_image_url, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    res.status(200).json({
      message: "Berhasil fetch user!",
      data: users[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil data user"
    });
  }
});


app.get("/api/movies", tokenMiddleWare ,async  (req: Request, res: Response) => {
  const [movies] = await pool.query("select * from movies;")

  res.status(200).json({
    message: "berhasil fetch data movies!",
    data : movies 
  })
})

app.get("/api/profile", tokenMiddleWare ,async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Invalid token payload"
      });
    }

    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT id, username, email, profile_image_url FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    res.status(200).json({
      message: "Berhasil fetch profile!",
      data: users[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Gagal mengambil profile"
    });
  }
})

app.post(
  "/api/users/:id/profile-image",
  tokenMiddleWare,
  profileImageUpload,
  uploadProfile
);

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const validasiData = credetials.parse(req.body);
    if(!validasiData) {
      return res.status(400).json({
        message: "Data login tidak valid"
      })
    }
    const { email, password } = validasiData;
    const [ users ] = await pool.query<RowDataPacket[]>("select * from  users where email = ? limit 1", [email])

    if (users.length === 0 || users[0].password !== password) {
      return res.status(401).json({
        message: "Email / Password salah"
      })
    }

    const token = jwt.sign(
      { id: users[0].id, email: users[0].email, jti: randomUUID()},
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
})


app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const validasiData  = dataUsers.parse(req.body);

    const { username, email, password} = validasiData;

    const [users] = await pool.query<ResultSetHeader>(`INSERT INTO users (username, email, password) VALUES(?, ?, ?)`, [username, email, password]);

    res.status(201).json({
      message: "Users created succesfully",
      data: {
        usersId: users.insertId,
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

app.post("/api/auth/logout", tokenMiddleWare, async (req: Request, res: Response) => {
  // const { jti, exp } = res.locals.user;
  // const sisaDetik = exp - Math.floor(Date.now() / 1000);
   // if (sisaDetik > 0) {
   //   await redis.set(`Expired:${jti}`, "1", { EX : sisaDetik});
   // }

   res.status(200).json({
    message: "logout berhasil"
   })
})


app.post("/api/movies", tokenMiddleWare ,async (req: Request, res: Response) => {
  try {
    const validasiData = dataMovies.parse(req.body)

    const { title, year, rating, duration, genres} = validasiData;

    const [movies] = await pool.query<ResultSetHeader>(`INSERT INTO movies (title, year, rating, duration, genres) VALUES(?, ?, ?, ?, ?)`, 
      [title, year, rating, duration, genres]
    )

    res.status(201).json({
      message: "Movie was added to the list!",
      data: {
        moviesId: movies.insertId,
        title,
        year,
        rating,
        duration,
        genres
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add movie"
    })
  }
});


app.put("/api/movies/:id", tokenMiddleWare ,async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const validasiData = dataMovies.parse(req.body);

    const {title, year, rating, duration, genres} = validasiData;

    const [movies] = await pool.query<ResultSetHeader>(
      "UPDATE movies SET title = ?, year = ?, rating = ?, duration = ?, genres = ? WHERE id = ?",
      [id, title, year, rating, duration, genres]
    );

    const updateMovies = movies as any;

    if (updateMovies.affectedRows == 0) {
      res.status(404).json({
        message : "error"
      });
      return;
    }

    res.status(200).json({
      message: "Data movies berhasil diupdate"
  });
  } catch (error){
    res.status(400).json({
      message: "Data movies tidak valid"
    });
  };
});

app.put("/api/users/:id", tokenMiddleWare , async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID user tidak valid"
      });
    }

    const validasiData = dataUsers.parse(req.body);

    const {username, email, password} = validasiData;

    const [users] = await pool.query<ResultSetHeader>(
      "UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?",
      [username, email, password, id]
    );

    if (users.affectedRows === 0) {
      const [existingUsers] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE id = ? LIMIT 1",
        [id]
      );

      if (existingUsers.length === 0) {
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
})

app.delete("/api/users/:id", tokenMiddleWare ,async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "ID user tidak valid",
      });
    }

    const [users] = await pool.query<ResultSetHeader>(
      "DELETE FROM users WHERE id = ?",
      [id]
    );

    if (users.affectedRows === 0) {
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

app.delete("/api/movies/:id", tokenMiddleWare ,async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [movies] = await pool.query(
      "DELETE FROM movies WHERE id = ?",
      [id]
    );

    const deleteMovies = movies as any;

    if (deleteMovies.affectedRows === 0) {
      res.status(404).json({
        message: "movie tidak ditemukan",
      });

      return;
    }

    res.status(200).json({
      message: "movie berhasil dihapus",
    });
  } catch (error) {
    res.status(500).json({
      message: "movie menghapus user",
    });
  }
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
