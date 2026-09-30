"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  job_id: string | null;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

const POLL_MS = 30000;

function hrefFor(n: Notification) {
  if (n.type === "job_request") return "/admin/job-requests";
  if (n.job_id) return `/admin/jobs/${n.job_id}`;
  if (n.type?.includes("inspection")) return "/admin/inspections";
  return "/admin";
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {
      // silently ignore
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function togglePanel() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={togglePanel}
        className="relative rounded-full p-2 text-muted-foreground transition hover:bg-secondary dark:hover:bg-secondary"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-950/300 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg dark:border-border dark:bg-card">
          <div className="border-b border-border px-4 py-2.5 text-sm font-semibold text-foreground dark:border-border dark:text-white">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              <ul className="divide-y divide-border dark:divide-border">
                {notifications.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <Link href={hrefFor(n)} className="block" onClick={() => setOpen(false)}>
                      <p className="text-sm text-foreground dark:text-foreground">
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
