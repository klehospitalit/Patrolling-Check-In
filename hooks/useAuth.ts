import { APP_BASE_API } from "@/constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const USER_ID_KEY = "userId";
const USER_NAME_KEY = "userName";

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(USER_ID_KEY),
      AsyncStorage.getItem(USER_NAME_KEY),
    ])
      .then(([id, name]) => {
        setUserId(id);
        setUserName(name);
        setLoading(false);
      })
      .catch(() => {
        setUserId(null);
        setUserName(null);
        setLoading(false);
      });
  }, []);

  const verifyUser = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
  
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout
  
      const response = await fetch(`${APP_BASE_API}/verify_user`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(id),
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        return {
          success: false,
          error: `Server error: ${response.status}`,
        };
      }
  
      const result = await response.json();
      if (result.status === "ok") {
        const rawMessage: string = result.message || "";
        const name = rawMessage.replace(/^Welcome\s+/i, "").trim();
  
        await AsyncStorage.setItem(USER_ID_KEY, id);
        await AsyncStorage.setItem(USER_NAME_KEY, name);
  
        setUserId(id);
        setUserName(name);
        return { success: true };
      } else {
        return {
          success: false,
          error: result.message || "Unknown error from server.",
        };
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        return { success: false, error: "Request timed out. Please check your internet connection." };
      }
  
      return {
        success: false,
        error: "Network error. Please ensure you are connected to the internet.",
      };
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (id: string): Promise<string | null> => {
    const { success, error } = await verifyUser(id);
    if (!success) {
      return error || "Login failed.";
    }
    return null;
  };
  

  const logout = async () => {
    await AsyncStorage.multiRemove([USER_ID_KEY, USER_NAME_KEY]);
    setUserId(null);
    setUserName(null);
  };

  const isLoggedIn = !!userId;

  return { userId, userName, isLoggedIn, login, logout, loading };
}
