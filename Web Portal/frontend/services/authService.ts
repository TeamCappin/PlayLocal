// src/services/authService.ts
import apiClient from "./apiClient";

export async function signupUser(data: {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}) {
  const response = await apiClient.post("users/createUser", {
    username: data.email,  
    password: data.password,
  });
  return response.data;
}

export async function loginUser(data: { email: string; password: string }) {
  const response = await apiClient.post("token/", {
    username: data.email,  
    password: data.password,
  });
  return response.data; 
}
