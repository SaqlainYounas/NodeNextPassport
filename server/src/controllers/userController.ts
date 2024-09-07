import {Request, Response} from "express";

export async function userProfileController(req: Request, res: Response) {
  res.send({User: req.user});
}
