import pool from "../config/db.ts";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const getAllUsers = async () => {
  const [users] = await pool.query<RowDataPacket[]>(
    "SELECT id, username, email, profile_image_url, created_at, updated_at FROM users"
  );
  return users;
};

export const getUserById = async (id: number) => {
  const [users] = await pool.query<RowDataPacket[]>(
    "SELECT id, username, email, profile_image_url, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return users[0] || null;
};

export const getUserByEmail = async (email: string) => {
  const [users] = await pool.query<RowDataPacket[]>(
    "select * from users where email = ? limit 1",
    [email]
  );
  return users[0] || null;
};

export const createUser = async (username: string, email: string, password: string) => {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (username, email, password) VALUES(?, ?, ?)`,
    [username, email, password]
  );
  return result;
};

export const updateUser = async (id: number, username: string, email: string, password: string) => {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?",
    [username, email, password, id]
  );
  return result;
};

export const deleteUser = async (id: number) => {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM users WHERE id = ?",
    [id]
  );
  return result;
};

export const updateUserProfileImage = async (userId: number, imageUrl: string, publicId: string) => {
  await pool.query(
    "UPDATE users SET profile_image_url = ?, profile_image_public_id = ? WHERE id = ?",
    [imageUrl, publicId, userId]
  );
};
