import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { flushProgressQueue, syncCachedQuestions } from "@/services/offline.service";

export default function SyncManager(): React.ReactElement {
  const online = useOnlineStatus();
  const prev = useRef<boolean>(online);

  useEffect(() => {
    if (online && prev.current === false) {
      (async () => {
        try {
          console.log("[Sync] Network restored: flushing queues");
          const res = await flushProgressQueue();
          console.log("[Sync] Progress queue result", res);
          const qRes = await syncCachedQuestions();
          console.log("[Sync] Cached questions synced", qRes);
        } catch (e) {
          console.log("[Sync] Error during sync", e);
        }
      })();
    }
    prev.current = online;
  }, [online]);

  return <View testID="sync-manager" />;
}
