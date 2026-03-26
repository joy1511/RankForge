interface ScoreBadgeProps {
  score: number;
  showIcon?: boolean;
}

export function ScoreBadge({ score, showIcon = true }: ScoreBadgeProps) {
  const getColor = () => {
    if (score >= 80) return "bg-[--success]/15 text-[--success]";
    if (score >= 60) return "bg-[--warning]/15 text-[--warning]";
    return "bg-[--danger]/15 text-[--danger]";
  };

  const getIcon = () => {
    if (score >= 80) return "";
    if (score >= 60) return "!";
    return "";
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getColor()}`}>
      {showIcon && <span>{getIcon()}</span>}
      {score}
    </span>
  );
}
