import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(","),
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json());

  app.use((req, _res, next) => {
    logger.info(
      { method: req.method, url: req.originalUrl },
      "request received",
    );
    next();
  });

  app.use("/api/v1", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
