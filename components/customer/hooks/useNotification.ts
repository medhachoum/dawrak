"use client";

import { useCallback, useEffect, useState } from "react";

export type NotificationPermissionState =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export interface UseNotificationResult {
  permission: NotificationPermissionState;
  supported: boolean;
  requestPermission: () => Promise<NotificationPermissionState>;
  notify: (title: string, options?: NotificationOptions) => void;
  vibrate: (pattern?: number | number[]) => void;
  /**
   * Play a simple attention-grabbing tone using the Web Audio API.
   * Falls back silently if audio is not allowed.
   */
  playAlertSound: () => void;
}

/**
 * Manages browser Notification permission + gives helpers for
 * push notifications, vibration, and alert sound for the "called" event.
 */
export function useNotification(): UseNotificationResult {
  const supported =
    typeof window !== "undefined" &&
    typeof window.Notification !== "undefined";

  const [permission, setPermission] = useState<NotificationPermissionState>(
    () => {
      if (typeof window === "undefined") return "default";
      if (!("Notification" in window)) return "unsupported";
      return window.Notification.permission as NotificationPermissionState;
    },
  );

  useEffect(() => {
    if (!supported) return;
    setPermission(window.Notification.permission as NotificationPermissionState);
  }, [supported]);

  const requestPermission = useCallback(async () => {
    if (!supported) {
      setPermission("unsupported");
      return "unsupported" as const;
    }
    if (window.Notification.permission === "granted") {
      setPermission("granted");
      return "granted" as const;
    }
    try {
      const result = await window.Notification.requestPermission();
      const next = result as NotificationPermissionState;
      setPermission(next);
      return next;
    } catch {
      setPermission("denied");
      return "denied" as const;
    }
  }, [supported]);

  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!supported) return;
      if (window.Notification.permission !== "granted") return;
      try {
        new window.Notification(title, {
          dir: "rtl",
          lang: "ar",
          ...options,
        });
      } catch {
        // Some browsers require a ServiceWorker to show notifications.
      }
    },
    [supported],
  );

  const vibrate = useCallback((pattern: number | number[] = [200, 100, 200, 100, 400]) => {
    if (typeof navigator === "undefined") return;
    if (typeof navigator.vibrate !== "function") return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore
    }
  }, []);

  const playAlertSound = useCallback(() => {
    if (typeof window === "undefined") return;
    const AudioCtx =
      (window as unknown as { AudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.3, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + start + duration,
        );
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + duration + 0.05);
      };

      // Cheerful two-note chime
      playTone(880, 0, 0.25);
      playTone(1174, 0.18, 0.35);

      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 900);
    } catch {
      // Autoplay may be blocked until user interacts with the page.
    }
  }, []);

  return {
    permission,
    supported,
    requestPermission,
    notify,
    vibrate,
    playAlertSound,
  };
}
