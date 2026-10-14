import { Router, type Request, type Response } from "express";
import { dataMovies } from "../models/schema.ts";
import { tokenMiddleWare } from "../middleware/auth.middleware.ts";
import * as movieService from "../services/movie.service.ts";

const router = Router();

router.get("/movies", tokenMiddleWare, async (req: Request, res: Response) => {
  const movies = await movieService.getAllMovies();

  res.status(200).json({
    message: "berhasil fetch data movies!",
    data : movies 
  })
});

router.post("/movies", tokenMiddleWare, async (req: Request, res: Response) => {
  try {
    const validasiData = dataMovies.parse(req.body)

    const { title, year, rating, duration, genres} = validasiData;

    const result = await movieService.createMovie(title, year, rating, duration, genres);

    res.status(201).json({
      message: "Movie was added to the list!",
      data: {
        moviesId: result.insertId,
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

router.put("/movies/:id", tokenMiddleWare, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const validasiData = dataMovies.parse(req.body);

    const {title, year, rating, duration, genres} = validasiData;

    const result = await movieService.updateMovie(id, title, year, rating, duration, genres);

    const updateMovies = result as any;

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

router.delete("/movies/:id", tokenMiddleWare, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const result = await movieService.deleteMovie(id);

    const deleteMovies = result as any;

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

export default router;
