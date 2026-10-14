import { Router } from "express";
import userRoutes from "./user.routes.ts";
import movieRoutes from "./movie.routes.ts";

const router = Router();

router.use("/api", userRoutes);
router.use("/api", movieRoutes);

export default router;
