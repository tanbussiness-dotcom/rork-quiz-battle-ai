import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyDyNbcAc2J8OdLdqmK0O7Mx5Z68C0CpU4w",
  authDomain: "quiz-battle-ai.firebaseapp.com",
  databaseURL: "https://quiz-battle-ai-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quiz-battle-ai",
  storageBucket: "quiz-battle-ai.firebasestorage.app",
  messagingSenderId: "244936603537",
  appId: "1:244936603537:web:011dfd33acf3db03f20c30",
  measurementId: "G-LF386PZ9BJ"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

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
