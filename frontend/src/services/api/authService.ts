import { axiosInstance } from "./axiosInstance";

interface LoginResponse {
  username: string;
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await axiosInstance.post<{ data: LoginResponse }>("/admin/auth/login", {
      username,
      password,
    });

    return response.data.data;
  },

  async logout(): Promise<void> {
    await axiosInstance.post("/admin/auth/logout");
  },

  async me(): Promise<void> {
    await axiosInstance.get("/admin/auth/me");
  },
};
