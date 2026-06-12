import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clearSession, getIdleTimeoutMs, isSessionExpired } from '../lib/auth';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart'] as const;
const SESSION_ENDED_MSG = 'Ha finalizado su sesión.';
const CHECK_INTERVAL_MS = 2_000;

export function useSessionTimeout() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const lastActivityRef = useRef(Date.now());
  const loggingOutRef = useRef(false);

  navigateRef.current = navigate;

  useEffect(() => {
    const logout = () => {
      if (loggingOutRef.current) return;
      if (!localStorage.getItem('token')) return;

      loggingOutRef.current = true;
      clearSession();
      toast.error(SESSION_ENDED_MSG, { duration: 5000 });
      navigateRef.current('/login', { replace: true, state: { sessionEnded: true } });
    };

    const onActivity = () => {
      lastActivityRef.current = Date.now();
    };

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, onActivity, { passive: true })
    );

    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        lastActivityRef.current = Date.now();
        loggingOutRef.current = false;
        return;
      }

      if (isSessionExpired(token)) {
        logout();
        return;
      }

      if (Date.now() - lastActivityRef.current >= getIdleTimeoutMs()) {
        logout();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
    };
  }, []);
}
