import express, { type Express } from 'express';
import cors from "cors";
import "dotenv/config";
import routes from "./routes/index.ts";
import { errorHandler } from "./middleware/error.middleware.ts";

const app: Express = express();

app.use(cors());
app.use(express.json());

app.use(routes);

app.use(errorHandler);

export default app;
