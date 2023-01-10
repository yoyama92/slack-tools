import axios from "axios";

export const postReminder = async (id: string, message: string) => {
  const response = await axios.post(`/api/remind`, {
    user_id: id,
    message: message,
  });
  return response.data;
};
