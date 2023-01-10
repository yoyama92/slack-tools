import { Router, Response, Request, NextFunction } from "express";
import { Reaction } from "types/api";
import { fetchReactionInfo, sendMessage } from "../services/slack";
const router = Router();

router.get(
  "/reactions",
  async (req: Request, res: Response<Reaction>, next: NextFunction) => {
    const handler = async (req: Request) => {
      const { query } = req;
      const channel = query["channel"] as string;
      const ts = Number(query["ts"] as string);
      const result = await fetchReactionInfo(channel, ts);
      if (result) {
        const user = result.message.user;
        return {
          users: result.users.map((m) => {
            return {
              id: m.id,
              name: m.name,
              display_name: m.displayName,
              is_reacted: m.isReacted,
              is_sender: m.isSender,
            };
          }),
          message: {
            text: result.message.text,
            user: user
              ? {
                  id: user.id,
                  name: user.name,
                  display_name: user.displayName,
                  is_bot: user.isBot,
                }
              : undefined,
          },
        };
      }
    };

    try {
      const result = await handler(req);
      if (result) {
        return res.status(200).send(result);
      }
    } catch (e) {
      return next(e);
    }

    next();
  }
);

router.post(
  "/remind",
  async (req: Request, res: Response, next: NextFunction) => {
    const handler = async (req: Request) => {
      const userId = req.body["user_id"];
      const message = req.body["message"];
      const result = await sendMessage(userId, message);
      if (!result.ok) {
        throw {
          message: result.error,
        };
      }
    };

    try {
      await handler(req);
      return res.status(201).send();
    } catch (e) {
      return next(e);
    }
  }
);

export default router;
