import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from "react-hot-toast";
import { io } from 'socket.io-client';

const BASE_URL = "http://localhost:3001/api";

export const userAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // Function to check authentication status
  checkAuth: async () => {
    try {
      const token = localStorage.getItem('authToken'); // Adjust if stored elsewhere

      if (!token) {
        set({ authUser: null });
        toast.error("No token provided. Please log in.");
        return;
      }

      const res = await axiosInstance.get("/auth/check", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error:", error);
      set({ authUser: null });
      toast.error("Authentication failed. Please log in.");
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // Sign-up function
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Sign up failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      // Save token to localStorage
      localStorage.setItem('authToken', res.data.token); // Assuming the token is in res.data.token
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },
  

  // Logout function
  logout: async () => {
    try {
      console.log("logging out");
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  // Profile update function with FormData for file uploads
  updateProfile: async (formData) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Ensure the request is sent as multipart
        },
      });

      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile:", error);
      toast.error(error.response?.data?.message || "Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
