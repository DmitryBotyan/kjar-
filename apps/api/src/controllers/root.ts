import type { Request, Response } from "express";

export function getRoot(_req: Request, res: Response) {
  res.json({
    name: "KJÁR API",
    version: "v1",
    status: "ready"
  });
}
