import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import { User, OAuthProvider, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { auth } from "@/lib/firebase";
import {
  registerUser,
  loginUser,
  logoutUser,
  loginWithGoogle as googleLogin,
  loginWithApple as appleLogin,
  loginAnonymously as anonymousLogin,
  onAuthStateChange,
} from "@/services";

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
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
    const unsubscribe = onAuthStateChange((currentUser) => {
      console.log("Auth state changed:", currentUser?.uid);
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

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);
      await registerUser(email, password, displayName);
      console.log("User registered successfully");
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
      await loginUser(email, password);
      console.log("User signed in successfully");
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
        await googleLogin();
        console.log("Google sign-in successful (web)");
      } else {
        await promptAsync();
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err.message || "Failed to sign in with Google");
      throw err;
    }
  }, [promptAsync]);

  const signInWithApple = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      if (Platform.OS === 'web') {
        await appleLogin();
        console.log("Apple sign-in successful (web)");
      } else if (Platform.OS === 'ios') {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        const provider = new OAuthProvider('apple.com');
        const oauthCredential = provider.credential({
          idToken: credential.identityToken!,
        });

        await signInWithCredential(auth, oauthCredential);
        console.log("Apple sign-in successful (iOS)");
      } else {
        throw new Error("Apple Sign-In is only available on iOS and web");
      }
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') {
        console.log("Apple sign-in cancelled");
      } else {
        console.error("Apple sign-in error:", err);
        setError(err.message || "Failed to sign in with Apple");
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signInAnonymously = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      await anonymousLogin();
      console.log("Anonymous sign-in successful");
    } catch (err: any) {
      console.error("Anonymous sign-in error:", err);
      setError(err.message || "Failed to sign in anonymously");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setError(null);
      await logoutUser();
      console.log("User logged out successfully");
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
      signInWithApple,
      signInAnonymously,
      logout,
    }),
    [user, loading, error, signUp, signIn, signInWithGoogle, signInWithApple, signInAnonymously, logout]
  );
});
