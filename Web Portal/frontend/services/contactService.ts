import apiClient from "./apiClient";

export const contactService = {
  sendMessage: async (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    const response = await apiClient.post("contacts/sendMessage/", data);
    return response.data;
  },
};
