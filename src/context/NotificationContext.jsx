import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import "../components/Notifications/Notifications.css";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((message, type = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setNotifications((current) => [...current.slice(-3), { id, message: String(message), type }]);
    timers.current.set(id, setTimeout(() => dismiss(id), 4200));
    return id;
  }, [dismiss]);

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className="notifications" aria-label="Notifications">
        {notifications.map((item) => {
          const Icon = item.type === "error" ? CircleAlert : item.type === "info" ? Info : CheckCircle2;
          return (
            <div key={item.id} className={`notification notification--${item.type}`} role={item.type === "error" ? "alert" : "status"}>
              <Icon size={19} aria-hidden="true" />
              <p>{item.message}</p>
              <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification"><X size={16} /></button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
  return context;
}
