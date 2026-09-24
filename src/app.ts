import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from "cors";
import pool from './db/index..ts';
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { dataUsers, dataMovies, credetials } from './db/dataschema.ts';
import jwt from "jsonwebtoken";
import "dotenv/config";

const app: Express = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET belum diisi di .env");
}


app.get("/api/users", async (req: Request, res: Response) => {
    const [users] = await pool.query("select * from users;")

    res.status(200).json({
        message: "Berhasil fetch users!",
        data : users
    })
})


const tokenMiddleWare =  async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];


  if (!token) {
    return res.status(401).json({
      message: "Unauthorized. No token provided"
    })
  }

  jwt.verify(token, "tokeninimah", (err, user) => {
    if (err) {
      return res.status(400).json({
        message: "invalid token"
      })
    }

    next()
  })

}


app.get("/api/movies", tokenMiddleWare ,async  (req: Request, res: Response) => {
  const [movies] = await pool.query("select * from movies;")

  res.status(200).json({
    message: "berhasil fetch data movies!",
    data : movies
  })
})

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const validasiData = credetials.parse(req.body);
    const { email, password } = validasiData;
    const [ users ] = await pool.query<RowDataPacket[]>("select * from  users where email = ? limit 1", [email])

    if (users.length === 0) {
      throw new Error("Data tidak di temukan");
    }

    if (users[0].password != password) {
      throw new Error("Email / password salah!");
    }

    const token = jwt.sign(users[0], "tokeninimah")

    res.status(200).json({
      message: "login berhasil",
      token: token
    })

  } catch (error) {
    if (error instanceof Error) {
        res.status(500).json({
          message: error.message
        })
    }
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

    res.status(500).json({
      message: "Failed to create users"
    })
  }
});

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

    const validasiData = dataUsers.parse(req.body);

    const {username, email, password} = validasiData;

    const [users]= await pool.query("UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?", [id, username, email, password]);

    const updateUsers = users as any;

    if (updateUsers.affectedRows == 0){
      res.status(404).json({
        message: "error"
      });

      return
    }
    res.status(200).json({
      message: "data user berhasil di update"
    })
  } catch (error) {
    res.status(400).json({
      message: "data user tidak valid"
    })
  }
})

app.delete("/api/users/:id", tokenMiddleWare ,async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [users] = await pool.query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );

    const deleteUsers = users as any;

    if (deleteUsers.affectedRows === 0) {
      res.status(404).json({
        message: "user tidak ditemukan",
      });

      return;
    }

    res.status(200).json({
      message: "user berhasil dihapus",
    });
  } catch (error) {
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

