import { title } from "node:process";
import { z } from "zod";


export const dataUsers = z.object({
    username    : z.string().min(8, "Nama wajib diisi!"),
    email       : z.email(),
    password    : z.string().min(6, "password harus min 6 karakter")
});

export const credetials = z.object({
    email:  z.email(),
    password: z.string().min(4, "password harus min 6 karakter")
})

export const dataMovies = z.object({
    title   : z.string().min(1, "Title wajib diisi!"),
    year    : z.int().min(4, "Year wajib diisi!"),
    rating  : z.string().min(1, "Rating Wajib diisi!"),
    duration    : z.string().min(1, "Duration wajib diisi!"),
    genres      : z.string().min(1," Genres wajib diisi!")
 });