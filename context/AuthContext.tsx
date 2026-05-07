import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

type AuthContextType = {
  user: FirebaseAuthTypes.User | null;
  isGuest: boolean;
  loading: boolean;
  initializing: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;

  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
    dateOfBirth: string
  ) => Promise<{ success: boolean; error?: string }>;

  continueAsGuest: () => void;
  logout: () => Promise<void>;
  getUserProfile: () => Promise<any>;
  updateUserProfile: (data: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] =
    useState<FirebaseAuthTypes.User | null>(null);

  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const initializingRef = useRef(true);

  // ✅ LISTEN TO AUTH STATE (SOURCE OF TRUTH)
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setIsGuest(false);

      if (initializingRef.current) {
        initializingRef.current = false;
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  // 🔐 LOGIN
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      const cred = await auth().signInWithEmailAndPassword(
        email.trim().toLowerCase(),
        password
      );

      // Backfill missing fields for users registered before the full profile was saved
      const userRef = firestore().collection("users").doc(cred.user.uid);
      const snap = await userRef.get();
      if (!snap.exists()) {
        await userRef.set({
          fullName: cred.user.displayName || email.trim().split("@")[0],
          email: cred.user.email || email.trim().toLowerCase(),
          phoneNumber: "",
          role: "customer",
          isActive: true,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      } else if (!snap.data()?.role) {
        await userRef.update({
          fullName: snap.data()?.fullName || cred.user.displayName || "",
          email: snap.data()?.email || cred.user.email || "",
          role: "customer",
          isActive: true,
        });
      }

      setUser(cred.user);
      setIsGuest(false);

      return { success: true };
    } catch (e: any) {
      let error = "Invalid email or password.";

      if (e.code === "auth/user-not-found") {
        error = "No account found.";
      } else if (e.code === "auth/wrong-password") {
        error = "Incorrect password.";
      } else if (e.code === "auth/invalid-email") {
        error = "Invalid email format.";
      }

      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // 🧾 REGISTER
  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string,
    dateOfBirth: string
  ) => {
    try {
      setLoading(true);

      const userCredential =
        await auth().createUserWithEmailAndPassword(
          email.trim().toLowerCase(),
          password
        );

      // ✅ Save display name
      await userCredential.user.updateProfile({
        displayName: name.trim(),
      });

      // ✅ Save additional data to Firestore
      await firestore()
        .collection("users")
        .doc(userCredential.user.uid)
        .set({
          fullName: name.trim(),
          email: email.trim().toLowerCase(),
          phoneNumber: phone.trim(),
          dateOfBirth: dateOfBirth.trim(),
          role: "customer",
          isActive: true,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      // 🔁 Force refresh user so UI updates immediately
      await auth().currentUser?.reload();

      setUser(auth().currentUser);

      setIsGuest(false);

      return { success: true };
    } catch (e: any) {
      let error = "Registration failed.";

      if (e.code === "auth/email-already-in-use") {
        error = "Email already in use.";
      } else if (e.code === "auth/invalid-email") {
        error = "Invalid email format.";
      } else if (e.code === "auth/weak-password") {
        error = "Password is too weak.";
      }

      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // 👤 GUEST MODE
  const continueAsGuest = () => {
    setIsGuest(true);
    setUser(null);
  };

  // 🚪 LOGOUT
  const logout = async () => {
    try {
      await auth().signOut();
    } catch (e) {
      console.log("Logout error:", e);
    } finally {
      setUser(null);
      setIsGuest(false);
    }
  };

  // 📄 GET USER PROFILE
  const getUserProfile = async () => {
    if (!user) return null;
    const doc = await firestore().collection("users").doc(user.uid).get();
    return doc.exists() ? doc.data() : null;
  };

  // ✏️ UPDATE USER PROFILE
  const updateUserProfile = async (data: any) => {
    if (!user) return;
    await firestore().collection("users").doc(user.uid).update(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        loading,
        initializing,
        login,
        register,
        continueAsGuest,
        logout,
        getUserProfile,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};