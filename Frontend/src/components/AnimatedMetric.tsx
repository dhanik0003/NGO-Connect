import CountUp from "@/components/CountUp";
import { cn } from "@/lib/utils";

interface AnimatedMetricProps {
  value: string | number;
  className?: string;
  duration?: number;
  startWhen?: boolean;
}

function parseMetricValue(value: string | number) {
  if (typeof value === "number") {
    return {
      prefix: "",
      numericValue: value,
      suffix: "",
      separator: Math.abs(value) >= 1000 ? "," : "",
    };
  }

  const match = value.trim().match(/^([^0-9]*)([+-]?\d[\d,]*(?:\.\d+)?)(.*)$/);

  if (!match) {
    return null;
  }

  const [, rawPrefix, rawNumeric, suffix] = match;
  const normalized = rawNumeric.replace(/,/g, "");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (rawNumeric.startsWith("+")) {
    return {
      prefix: `${rawPrefix}+`,
      numericValue: Math.abs(parsed),
      suffix,
      separator: rawNumeric.includes(",") || Math.abs(parsed) >= 1000 ? "," : "",
    };
  }

  if (rawNumeric.startsWith("-")) {
    return {
      prefix: `${rawPrefix}-`,
      numericValue: Math.abs(parsed),
      suffix,
      separator: rawNumeric.includes(",") || Math.abs(parsed) >= 1000 ? "," : "",
    };
  }

  return {
    prefix: rawPrefix,
    numericValue: parsed,
    suffix,
    separator: rawNumeric.includes(",") || Math.abs(parsed) >= 1000 ? "," : "",
  };
}

export function AnimatedMetric({
  value,
  className,
  duration = 1.3,
  startWhen = true,
}: AnimatedMetricProps) {
  const parsed = parseMetricValue(value);

  if (!parsed) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={cn("inline-flex items-baseline", className)}>
      {parsed.prefix}
      <CountUp
        from={0}
        to={parsed.numericValue}
        separator={parsed.separator}
        direction="up"
        duration={duration}
        startWhen={startWhen}
      />
      {parsed.suffix}
    </span>
  );
}
