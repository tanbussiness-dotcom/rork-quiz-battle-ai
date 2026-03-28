import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { onValue, ref } from "firebase/database";
import { realtimeDb } from "@/lib/firebase";

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const update = () => setOnline(navigator.onLine);
      update();
      window.addEventListener("online", update);
      window.addEventListener("offline", update);
      return () => {
        window.removeEventListener("online", update);
        window.removeEventListener("offline", update);
      };
    }

    const connectedRef = ref(realtimeDb, ".info/connected");
    const unsub = onValue(connectedRef, (snap) => {
      const val = snap.val();
      setOnline(Boolean(val));
    });
    return () => unsub();
  }, []);

  return online;
}
