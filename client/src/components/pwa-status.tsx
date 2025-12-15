import { useEffect, useState } from "react";
import { AlertCircle, Check, Download, Wifi, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-pwa";

export function PWAStatus() {
  const isOnline = useOnlineStatus();
  const [swRegistered, setSwRegistered] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if service worker is registered
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        setSwRegistered(registrations.length > 0);
      });
    }

    // Listen for update available
    document.addEventListener("pwa-update", () => {
      setUpdateAvailable(true);
    });

    // Listen for install prompt
    document.addEventListener("pwa-install-prompt", (e: any) => {
      setCanInstall(!!e.detail?.prompt);
    });

    return () => {
      document.removeEventListener("pwa-update", () => {});
      document.removeEventListener("pwa-install-prompt", () => {});
    };
  }, []);

  const handleInstall = async () => {
    const event = new CustomEvent("pwa-install-prompt");
    const promptEvent = (event as any).detail?.prompt;
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === "accepted") {
        setCanInstall(false);
      }
    }
  };

  const handleUpdate = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: "SKIP_WAITING",
      });
      window.location.reload();
    }
  };

  return (
    <Card className="p-4 space-y-4 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">
                Offline (Cached Data Available)
              </span>
            </>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {swRegistered ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Service Worker Active
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                Service Worker Loading
              </span>
            </>
          )}
        </div>
      </div>

      {updateAvailable && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              New version available
            </span>
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleUpdate}
          >
            Update
          </Button>
        </div>
      )}

      {canInstall && (
        <div className="bg-purple-50 border border-purple-200 rounded-md p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700">
              Install app to home screen
            </span>
          </div>
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleInstall}
          >
            Install
          </Button>
        </div>
      )}
    </Card>
  );
}
