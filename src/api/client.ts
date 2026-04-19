import { authApi } from "./auth.api";
import { userApi } from "./user.api";
import { chatService } from "../services/chatService";

export const client = {
  auth: authApi,
  user: userApi,
  chat: chatService,
};