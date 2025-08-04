import React, { useEffect, useState } from "react";

// Use Quantico font for seven-segment style
const pad = (num: number) => num.toString().padStart(2, "0");

const TimeDisplay: React.FC = () => {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      style={{
        fontFamily: "'Quantico', 'Roboto Mono', 'Courier New', monospace",
        fontSize: "1.7rem",
        color: "#ffffff",
        background: "#a3b18a",
        padding: "0.025em 0.7em",
        borderRadius: "6px",
        letterSpacing: "0.15em",
        // boxShadow: "0 0 8px #606c38",
        fontVariantNumeric: "tabular-nums",
        display: "inline-block",
        marginRight: "1rem",
        userSelect: "none",
      }}
    >
      {time}
    </span>
  );
};

export default TimeDisplay;