import { useEffect, useState } from "react";

interface ScoreGaugeProps {
  value: number;
  size?: "small" | "medium" | "large";
  label?: string;
  showValue?: boolean;
}

const sizes = {
  small: { diameter: 48, stroke: 4, fontSize: "text-sm" },
  medium: { diameter: 80, stroke: 6, fontSize: "text-xl" },
  large: { diameter: 120, stroke: 8, fontSize: "text-3xl" },
};

export function ScoreGauge({ 
  value, 
  size = "medium", 
  label, 
  showValue = true 
}: ScoreGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const config = sizes[size];
  const radius = (config.diameter - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = value / 50;
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setAnimatedValue(value);
          clearInterval(interval);
        } else {
          setAnimatedValue(current);
        }
      }, 20);
      return () => clearInterval(interval);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.diameter, height: config.diameter }}>
        <svg width={config.diameter} height={config.diameter} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            fill="none"
            stroke="var(--score-ring-bg)"
            strokeWidth={config.stroke}
          />
          {/* Gradient fill */}
          <defs>
            <linearGradient id={`gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            fill="none"
            stroke={`url(#gradient-${size})`}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {showValue && (
          <div className={`absolute inset-0 flex items-center justify-center ${config.fontSize} font-bold text-[--text-primary]`}>
            {Math.round(animatedValue)}
          </div>
        )}
      </div>
      {label && (
        <p className="text-xs text-[--text-secondary] text-center">{label}</p>
      )}
    </div>
  );
}
