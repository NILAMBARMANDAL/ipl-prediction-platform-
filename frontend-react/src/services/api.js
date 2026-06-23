import axios from "axios";

// A single configured Axios instance used across the app.
// withCredentials:true sends the httpOnly auth cookie with every request, so the
// backend can authenticate the user without the frontend ever touching the token.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8001/api/v1",
  withCredentials: true,
});

export default api;
