import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { Platform } from "react-native";
import { FIREBASE_CONFIG } from "./config";

const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();

const auth = getAuth(app);

const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

let persistenceEnabled = false;

if (Platform.OS === 'web' && !persistenceEnabled) {
  enableIndexedDbPersistence(db, {
    forceOwnership: false
  })
    .then(() => {
      console.log("✅ Firestore persistence enabled");
      persistenceEnabled = true;
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("⚠️ Multiple tabs open, persistence disabled");
      } else if (err.code === 'unimplemented') {
        console.warn("⚠️ Browser doesn't support persistence");
      } else {
        console.error("❌ Persistence error:", err);
      }
    });
}

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
