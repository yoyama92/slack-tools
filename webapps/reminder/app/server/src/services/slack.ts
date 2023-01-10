import { WebClient, ErrorCode } from "@slack/web-api";
import { Message } from "@slack/web-api/dist/response/ConversationsRepliesResponse";
import { Member as UsersListResponseMember } from "@slack/web-api/dist/response/UsersListResponse";

// Read a token from the environment variables
const token = process.env.SLACK_TOKEN;

// Initialize
const web = new WebClient(token);

type Reply = {
  text: string;
  user: string;
  isBot: boolean;
  username: string;
  reactions: string[];
};

type Member = {
  id: string;
  name: string | undefined;
  displayName: string | undefined;
  isBot: boolean;
};

/**
 *
 * @param {*} channel
 * @param {*} ts
 * @returns
 */
const fetchReply = async (
  channel: string,
  ts: number
): Promise<Reply | undefined> => {
  try {
    const response = await web.conversations.replies({
      channel: channel,
      ts: `${ts}`,
    });
    if (response.ok) {
      const { messages } = response;
      if (messages && messages.length > 0) {
        // usernameが存在しないと言われてしまうのでUnion Typesで追加。
        const message = messages[0] as Message & { username: string };
        const result = {
          text: message.text ?? "",
          user: message.user ?? message.bot_id ?? "",
          isBot: message.bot_id ? true : false,
          username: message.username ?? "",
          reactions: message.reactions?.flatMap((r) => r.users ?? []) ?? [],
        };
        return result;
      }
    }
  } catch (error: any) {
    if (error.code === ErrorCode.PlatformError) {
      console.log(error.data);
    } else {
      console.log("Well, that was unexpected.");
    }

    // TODO: エラーを握りつぶさない。
  }
};

const fetchMembers = async (channel: string): Promise<Member[] | undefined> => {
  try {
    const result = await web.conversations.members({
      channel: channel,
    });
    if (!(result && result.ok)) {
      return;
    }
    const usersList = await web.users.list();
    if (!(usersList && usersList.ok)) {
      return;
    }

    const dict =
      usersList.members?.reduce(
        (a: { [name: string]: UsersListResponseMember }, x) => {
          const id = x?.id ?? "";
          a[id] = x;
          return a;
        },
        {}
      ) ?? {};
    const { members } = result;
    return members
      ?.map((m) => {
        const member = dict[m];
        return member;
      })
      .filter((m) => m)
      .map((m) => {
        const profile = m["profile"] ?? {};
        return {
          id: m["id"] ?? "",
          name: profile["real_name"],
          displayName: profile["display_name"],
          isBot: m["is_bot"] ?? false,
        };
      });
  } catch (error: any) {
    if (error.code === ErrorCode.PlatformError) {
      console.log(error.data);
    } else {
      console.log(error);
    }

    // TODO: エラーを握りつぶさない。
  }
};

type SenderInfo = {
  id: string;
  name: string | undefined;
  displayName: string | undefined;
  isBot: boolean;
};

const fetchSenderInfo = async (
  id: string,
  isBot: boolean
): Promise<SenderInfo | undefined> => {
  const fetchBotInfo = async (id: string) => {
    const botInfo = await web.bots.info({
      bot: id,
    });

    if (!(botInfo && botInfo.ok && botInfo.bot)) {
      return;
    }

    const bot = botInfo.bot;
    return {
      id: bot["id"] ?? "",
      name: bot["name"],
      isBot: true,
      displayName: undefined,
    };
  };

  const fetchUserInfo = async (id: string) => {
    const userInfoResponse = await web.users.info({
      user: id,
    });

    if (!(userInfoResponse && userInfoResponse.ok && userInfoResponse.user)) {
      return;
    }
    const userInfo = userInfoResponse.user;
    const profile = userInfo["profile"] ?? {
      real_name: "",
      display_name: "",
    };
    return {
      id: userInfo["id"] ?? "",
      name: profile["real_name"],
      displayName: profile["display_name"],
      isBot: userInfo["is_bot"] ?? false,
    };
  };

  if (isBot) {
    return await fetchBotInfo(id);
  }
  return await fetchUserInfo(id);
};

type ReactionInfo = {
  users: {
    id: string;
    name: string | undefined;
    displayName: string | undefined;
    isReacted: boolean;
    isSender: boolean;
  }[];
  message: {
    text: string;
    user?: {
      id: string;
      name: string | undefined;
      displayName: string;
      isBot: boolean;
    };
  };
};

export const fetchReactionInfo = async (
  channel: string,
  ts: number
): Promise<ReactionInfo | undefined> => {
  const reply = await fetchReply(channel, ts);
  if (!reply) {
    return;
  }

  const members = await fetchMembers(channel);
  if (!members) {
    return;
  }

  const dict = reply.reactions.reduce((a: { [name: string]: string }, x) => {
    a[x] = x;
    return a;
  }, {});

  // Botは取り除いて、ユーザーのみをリストにして返す。
  const reactions = members
    .filter((m) => {
      return !m.isBot;
    })
    .map((m) => {
      const id = m.id;
      return {
        id: id,
        name: m.name,
        displayName: m.displayName,
        isReacted: dict[id] ? true : false,
        isSender: id === reply.user,
      };
    });

  const user = await fetchSenderInfo(reply.user, reply.isBot);
  return {
    users: reactions,
    message: {
      text: reply.text,
      user: user
        ? {
            id: user.id,
            name: user.name,
            displayName: user.displayName ?? reply.username,
            isBot: user.isBot,
          }
        : undefined,
    },
  };
};

export const sendMessage = async (userId: string, message: string) => {
  try {
    const userInfo = await web.users.info({
      user: userId,
    });

    if (!(userInfo && userInfo.ok && userInfo.user)) {
      return {
        ok: false,
        error: userInfo["error"],
      };
    }

    const { user } = userInfo;
    if (user["is_bot"]) {
      return {
        ok: false,
        error: "is_bot",
      };
    }

    const result = await web.chat.postMessage({
      channel: userId,
      text: message,
    });

    if (result.ok) {
      return {
        ok: true,
      };
    }
    return {
      ok: false,
      error: result["error"],
    };
  } catch (error: any) {
    if (error.code === ErrorCode.PlatformError) {
      console.log(error.data);
      return {
        ok: false,
        error: error.data.error,
      };
    } else {
      console.log("Well, that was unexpected.");
      throw error;
    }
  }
};
