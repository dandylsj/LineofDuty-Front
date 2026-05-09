import axios from "axios";


// const _awsUrl = "http://43.201.115.73:8080";
// const localUrl = "http://localhost:8080/api";
//VITE_LOCAL_API_URL
const prod = "/api";
export const api = axios.create({
  baseURL: prod,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});