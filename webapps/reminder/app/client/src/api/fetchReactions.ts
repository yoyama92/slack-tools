import axios from "axios";
import { isNumber } from "../utils/numberUtils";

namespace ApiTypes {
  type User = {
    id: string;
    name: string;
    display_name: string;
    is_reacted: boolean;
    is_sender: boolean;
  };

  export type Reactions = {
    users: User[];
    message: {
      text: string;
      user: {
        id: string;
        name: string;
        display_name: string;
        is_bot: boolean;
      };
    };
  };
}

/**
 * SlackのURL情報を保持するクラス
 */
class SlackURL {
  #channel: string = "";
  #ts: number = -1;
  #isValidated: boolean = false;

  constructor(url: string) {
    try {
      const pathname = new URL(url).pathname;
      const pathnames = pathname.split("/");

      if (pathname.length < 4) {
        return;
      }

      const ts: string = pathnames.slice(-1)[0].slice(1);
      if (!isNumber(ts)) {
        return;
      }

      this.#isValidated = true;
      this.#channel = pathnames.slice(-2)[0];
      this.#ts = parseFloat(ts) / 1e6;
    } catch (err) {
      this.#channel = "";
      this.#ts = 0;
    }
  }

  /**
   * チャンネルID
   */
  get channel(): string {
    return this.#channel;
  }

  /**
   * タイムスタンプ
   */
  get ts(): number {
    return this.#ts;
  }

  /**
   * URLがSlackのURLとして正しいフォーマットかどうか
   */
  get isValidated(): boolean {
    return this.#isValidated;
  }
}

type User = {
  id: string;
  name: string;
  displayName: string;
  isReacted: boolean;
  isSender: boolean;
};

export type Reactions = {
  users: User[];
  message: {
    text: string;
    user: {
      id: string;
      name: string;
      displayName: string;
      isBot: boolean;
    };
  };
};

export const fetchReactions = async (
  url: string
): Promise<Reactions | undefined> => {
  const slackURL = new SlackURL(url);

  if (!slackURL.isValidated) {
    return;
  }
  const response = await axios.get<ApiTypes.Reactions>(`api/reactions`, {
    params: {
      channel: slackURL.channel,
      ts: slackURL.ts,
    },
  });

  console.log(response.data.message.text);

  const reactions = response.data;
  const user = reactions.message.user;
  return {
    users: reactions.users.map((u) => {
      return {
        id: u["id"],
        name: u["name"],
        displayName: u["display_name"],
        isReacted: u["is_reacted"],
        isSender: u["is_sender"],
      };
    }),
    message: {
      text: reactions.message.text,
      user: {
        id: user["id"],
        name: user["name"],
        displayName: user["display_name"],
        isBot: user["is_bot"],
      },
    },
  };
};
