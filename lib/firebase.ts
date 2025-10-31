import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { Platform } from "react-native";
import { FIREBASE_CONFIG } from "./config";

const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();

const auth = getAuth(app);

const db = getFirestore(app);
const realtimeDb = getDatabase(app);
const storage = getStorage(app);

let analytics;
if (Platform.OS === 'web') {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, realtimeDb, storage, analytics };
