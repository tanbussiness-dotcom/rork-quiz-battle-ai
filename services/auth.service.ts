import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  FacebookAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { Platform } from "react-native";
import { auth } from "@/lib/firebase";
import { createUserProfile, getUserProfile as getProfile } from "./user.service";
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

  const profile = await getProfile(userCredential.user.uid);
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

    const profile = await getProfile(userCredential.user.uid);
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

    const profile = await getProfile(userCredential.user.uid);
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

export async function loginWithApple(): Promise<AuthResult> {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');

  try {
    let userCredential;

    if (Platform.OS === "web") {
      throw new Error(
        "Apple Sign-In on web requires adding your app's domain (including localhost when developing) to Firebase Auth Authorized domains and enabling Apple provider."
      );
    } else {
      await signInWithRedirect(auth, provider);
      userCredential = await getRedirectResult(auth);

      if (!userCredential) {
        throw new Error("Apple sign-in was cancelled");
      }
    }

    const profile = await getProfile(userCredential.user.uid);
    const isNewUser = !profile;

    if (isNewUser) {
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email || "anonymous@quiz-battle.app",
        displayName: userCredential.user.displayName || "Player",
        photoURL: userCredential.user.photoURL || undefined,
      });
    }

    return {
      user: userCredential.user,
      isNewUser,
    };
  } catch (error) {
    console.error("Apple sign-in error:", error);
    throw error;
  }
}

export async function loginAnonymously(): Promise<AuthResult> {
  try {
    const userCredential = await signInAnonymously(auth);

    const profile = await getProfile(userCredential.user.uid);
    const isNewUser = !profile;

    if (isNewUser) {
      await createUserProfile(userCredential.user.uid, {
        email: `anon-${userCredential.user.uid}@quiz-battle.app`,
        displayName: `Guest${userCredential.user.uid.substring(0, 6)}`,
        photoURL: undefined,
      });
    }

    return {
      user: userCredential.user,
      isNewUser,
    };
  } catch (error) {
    console.error("Anonymous sign-in error:", error);
    throw error;
  }
}

export async function linkAnonymousAccount(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const user = auth.currentUser;
  if (!user || !user.isAnonymous) {
    throw new Error("No anonymous user to link");
  }

  const credential = EmailAuthProvider.credential(email, password);
  const userCredential = await linkWithCredential(user, credential);

  await updateProfile(userCredential.user, {
    displayName: email.split('@')[0],
  });

  const profile = await getProfile(userCredential.user.uid);
  if (profile) {
    await createUserProfile(userCredential.user.uid, {
      email,
      displayName: email.split('@')[0],
      photoURL: undefined,
    });
  }

  return userCredential.user;
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResult> {
  return registerWithEmail(email, password, displayName);
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  return loginWithEmail(email, password);
}

export async function logoutUser(): Promise<void> {
  return logout();
}

export async function getUserProfile(uid: string): Promise<User | null> {
  return getProfile(uid);
}

export { auth };
