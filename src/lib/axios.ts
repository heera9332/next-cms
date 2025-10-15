import Axios from "axios";

export const axios = Axios.create({
  baseURL: typeof window === "undefined" ? process.env.NEXT_PUBLIC_API_BASE || "" : "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});