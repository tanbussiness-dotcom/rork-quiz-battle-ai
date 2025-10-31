import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: "244936603537-yourtokenhere.apps.googleusercontent.com",
    iosClientId: "244936603537-yourtokenhere.apps.googleusercontent.com",
    androidClientId: "244936603537-yourtokenhere.apps.googleusercontent.com",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === "success" && response.authentication) {
      const { idToken } = response.authentication;
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        signInWithCredential(auth, credential).catch((err) => {
          console.error("Google sign-in error:", err);
          setError(err.message);
        });
      }
    }
  }, [response]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.message || "Failed to create account");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Failed to sign in");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const { signInWithPopup } = await import('firebase/auth');
        await signInWithPopup(auth, provider);
      } else {
        await promptAsync();
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err.message || "Failed to sign in with Google");
      throw err;
    }
  }, [promptAsync]);

  const logout = useCallback(async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message || "Failed to logout");
      throw err;
    }
  }, []);

  return useMemo(
    () => ({
      user,
      loading,
      error,
      signUp,
      signIn,
      signInWithGoogle,
      logout,
    }),
    [user, loading, error, signUp, signIn, signInWithGoogle, logout]
  );
});
