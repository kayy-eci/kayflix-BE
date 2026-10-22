import pool from "../config/db.ts";
import type { ResultSetHeader } from "mysql2/promise";

export const getAllMovies = async () => {
  const [movies] = await pool.query("select * from movies;");
  return movies;
};

export const createMovie = async (title: string, year: number, rating: string, duration: string, genres: string) => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO movies (title, year, rating, duration, genres) VALUES(?, ?, ?, ?, ?)`,
    [title, year, rating, duration, genres]
  );
  return result;
};

export const updateMovie = async (id: number, title: string, year: number, rating: string, duration: string, genres: string) => {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE movies SET title = ?, year = ?, rating = ?, duration = ?, genres = ? WHERE id = ?",
    [title, year, rating, duration, genres, id]
  );
  return result;
};

export const deleteMovie = async (id: number) => {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM movies WHERE id = ?",
    [id]
  );
  return result;
};
