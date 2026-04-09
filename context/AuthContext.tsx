import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type User = {
  email: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const saved = await AsyncStorage.getItem("@user");
        if (saved) setUser(JSON.parse(saved));
      } catch (e) {}
      setLoading(false);
    };
    loadSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const stored = await AsyncStorage.getItem("@users");
      const users: any[] = stored ? JSON.parse(stored) : [];
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (found) {
        const userData = { email: found.email, name: found.name };
        await AsyncStorage.setItem("@user", JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      return false;
    } catch (e) {
      console.log("Login error:", e);
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const stored = await AsyncStorage.getItem("@users");
      const users: any[] = stored ? JSON.parse(stored) : [];
      const exists = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (exists) {
        return { success: false, error: "An account with this email already exists." };
      }
      const newUser = { name, email: email.toLowerCase(), password };
      users.push(newUser);
      await AsyncStorage.setItem("@users", JSON.stringify(users));
      const userData = { email: email.toLowerCase(), name };
      await AsyncStorage.setItem("@user", JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (e) {
      console.log("Register error:", e);
      return { success: false, error: "Something went wrong. Please try again." };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("@user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
