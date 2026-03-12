import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { useLogout } from "@/hooks/useAuth";
import { fetchCurrentUser } from "@/api/auth";

const SESSION_DURATION_MS = 60 * 60 * 1000;
const WARNING_BEFORE_MS = 5 * 60 * 1000;
const WARNING_AT_MS = SESSION_DURATION_MS - WARNING_BEFORE_MS;
const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
] as const;

interface SessionState {
  isWarningVisible: boolean;
  secondsLeft: number;
}

let sessionState: SessionState = { isWarningVisible: false, secondsLeft: 0 };
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

function setSessionState(next: Partial<SessionState>) {
  sessionState = { ...sessionState, ...next };
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return sessionState;
}

export function useSessionTimeout() {
  const warningTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const expireTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();
  const lastActivityRef = useRef(0);
  const isWarningRef = useRef(false);

  const navigate = useNavigate();
  const { mutate: doLogout } = useLogout();

  const state = useSyncExternalStore(subscribe, getSnapshot);

  const clearAllTimers = useCallback(() => {
    clearTimeout(warningTimerRef.current);
    clearTimeout(expireTimerRef.current);
    clearInterval(countdownRef.current);
  }, []);

  const scheduleTimers = useCallback(() => {
    clearAllTimers();
    isWarningRef.current = false;
    setSessionState({ isWarningVisible: false });
    const now = Date.now();
    lastActivityRef.current = now;

    warningTimerRef.current = setTimeout(() => {
      isWarningRef.current = true;
      setSessionState({
        isWarningVisible: true,
        secondsLeft: Math.round(WARNING_BEFORE_MS / 1000),
      });

      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - lastActivityRef.current;
        const remaining = Math.max(
          0,
          Math.round((SESSION_DURATION_MS - elapsed) / 1000),
        );
        setSessionState({ secondsLeft: remaining });
      }, 1000);
    }, WARNING_AT_MS);

    expireTimerRef.current = setTimeout(() => {
      clearAllTimers();
      isWarningRef.current = false;
      setSessionState({ isWarningVisible: false });
      doLogout(undefined, {
        onSettled: () => navigate("/login", { replace: true }),
      });
    }, SESSION_DURATION_MS);
  }, [clearAllTimers, doLogout, navigate]);

  const extendSession = useCallback(() => {
    scheduleTimers();
    fetchCurrentUser().catch(() => {});
  }, [scheduleTimers]);

  useEffect(() => {
    const onActivity = () => {
      if (isWarningRef.current) return;
      lastActivityRef.current = Date.now();
      scheduleTimers();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    scheduleTimers();

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      clearAllTimers();
    };
  }, [scheduleTimers, clearAllTimers]);

  return { ...state, extendSession };
}
