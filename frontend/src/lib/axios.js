import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:"https://nodechat-mo4m.onrender.com",
   // baseURL:"http://localhost:3001/api",
  withCredentials: true,

});





