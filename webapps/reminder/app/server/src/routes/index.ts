import { NextFunction, Request, Response, Router } from "express";
const router = Router();

/* GET home page. */
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.render("index");
});

export default router;
