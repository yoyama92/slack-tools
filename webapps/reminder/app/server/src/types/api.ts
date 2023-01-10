type ReactedUser = {
  id: string;
  name: string | undefined;
  display_name: string | undefined;
  is_reacted: boolean;
  is_sender: boolean;
};

type User = {
  id: string;
  name: string | undefined;
  display_name: string;
  is_bot: boolean;
};

export type Reaction = {
  users: ReactedUser[];
  message: {
    text: string;
    user?: User;
  };
};
