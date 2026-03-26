import { useEffect, useState } from "react";

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: "primary" | "success" | "warning" | "danger" | "secondary";
  showValue?: boolean;
  height?: "thin" | "standard";
}

const colorMap = {
  primary: "bg-gradient-to-r from-[--accent-primary] to-[--accent-secondary]",
  success: "bg-[--success]",
  warning: "bg-[--warning]",
  danger: "bg-[--danger]",
  secondary: "bg-[--accent-secondary]",
};

const heightMap = {
  thin: "h-2",
  standard: "h-3",
};

export function ProgressBar({ 
  value, 
  className = "", 
  color = "primary", 
  showValue = false,
  height = "standard" 
}: ProgressBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-[--bg-tertiary] rounded-md overflow-hidden ${heightMap[height]}`}>
        <div
          className={`${heightMap[height]} ${colorMap[color]} rounded-md transition-all duration-600 ease-out`}
          style={{ width: `${animatedValue}%` }}
        />
      </div>
      {showValue && (
        <p className="text-xs text-[--text-secondary] mt-1">{value}%</p>
      )}
    </div>
  );
}
