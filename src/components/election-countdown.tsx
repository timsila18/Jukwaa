"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";

const electionDate = new Date("2027-08-10T06:00:00+03:00").getTime();

function getParts(now = Date.now()) {
  const distance = Math.max(0, electionDate - now);
  const totalSeconds = Math.floor(distance / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function ElectionCountdown({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  const parts = useMemo(() => getParts(now), [now]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const cells = [
    ["Days", parts.days],
    ["Hours", parts.hours],
    ["Mins", parts.minutes],
    ["Secs", parts.seconds],
  ];

  return (
    <div className={compact ? "j-countdown j-countdown-compact" : "j-countdown"}>
      <div className="j-countdown-label">
        <CalendarClock size={compact ? 14 : 16} />
        <span>Kenya General Election</span>
        <strong>10 Aug 2027</strong>
      </div>
      <div className="j-countdown-grid">
        {cells.map(([label, value]) => (
          <div className="j-countdown-cell" key={label}>
            <strong>{Number(value).toLocaleString("en-KE", { minimumIntegerDigits: label === "Days" ? 1 : 2 })}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
