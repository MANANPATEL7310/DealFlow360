import { Router, type RequestHandler } from "express";

/**
 * Creates an Express router where all handlers are automatically
 * wrapped to catch async errors. No more asyncHandler() needed.
 */
export function createRouter() {
  const router = Router();
  const wrapHandler = (handler: RequestHandler): RequestHandler => {
    return (req, res, next) => {
      const result = handler(req, res, next);
      if (result instanceof Promise) {
        result.catch(next);
      }
    };
  };

  // Override .get, .post, .put, .patch, .delete to auto-wrap
  for (const method of ["get", "post", "put", "patch", "delete"] as const) {
    const original = router[method].bind(router);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (router as any)[method] = (path: string, ...handlers: RequestHandler[]) => {
      return original(path, ...handlers.map(wrapHandler));
    };
  }

  return router;
}
