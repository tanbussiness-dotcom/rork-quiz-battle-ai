import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  FacebookAuthProvider,
} from "firebase/auth";
import { Platform } from "react-native";
import { auth } from "@/lib/firebase";
import { createUserProfile, getUserProfile } from "./user.service";
import type { User } from "@/models";

export interface AuthResult {
  user: FirebaseUser;
  isNewUser: boolean;
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResult> {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await updateProfile(userCredential.user, { displayName });

  await createUserProfile(userCredential.user.uid, {
    email,
    displayName,
    photoURL: userCredential.user.photoURL || undefined,
  });

  return {
    user: userCredential.user,
    isNewUser: true,
  };
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  const profile = await getUserProfile(userCredential.user.uid);
  const isNewUser = !profile;

  if (isNewUser) {
    await createUserProfile(userCredential.user.uid, {
      email: userCredential.user.email!,
      displayName: userCredential.user.displayName || "Player",
      photoURL: userCredential.user.photoURL || undefined,
    });
  }

  return {
    user: userCredential.user,
    isNewUser,
  };
}

export async function loginWithGoogle(): Promise<AuthResult> {
  const provider = new GoogleAuthProvider();

  try {
    let userCredential;

    if (Platform.OS === "web") {
      userCredential = await signInWithPopup(auth, provider);
    } else {
      await signInWithRedirect(auth, provider);
      userCredential = await getRedirectResult(auth);

      if (!userCredential) {
        throw new Error("Google sign-in was cancelled");
      }
    }

    const profile = await getUserProfile(userCredential.user.uid);
    const isNewUser = !profile;

    if (isNewUser) {
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email!,
        displayName: userCredential.user.displayName || "Player",
        photoURL: userCredential.user.photoURL || undefined,
      });
    }

    return {
      user: userCredential.user,
      isNewUser,
    };
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

export async function loginWithFacebook(): Promise<AuthResult> {
  const provider = new FacebookAuthProvider();

  try {
    let userCredential;

    if (Platform.OS === "web") {
      userCredential = await signInWithPopup(auth, provider);
    } else {
      await signInWithRedirect(auth, provider);
      userCredential = await getRedirectResult(auth);

      if (!userCredential) {
        throw new Error("Facebook sign-in was cancelled");
      }
    }

    const profile = await getUserProfile(userCredential.user.uid);
    const isNewUser = !profile;

    if (isNewUser) {
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email!,
        displayName: userCredential.user.displayName || "Player",
        photoURL: userCredential.user.photoURL || undefined,
      });
    }

    return {
      user: userCredential.user,
      isNewUser,
    };
  } catch (error) {
    console.error("Facebook sign-in error:", error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export { auth };
