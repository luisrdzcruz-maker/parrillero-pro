import { ds } from "@/lib/design-system";

export type MetricTone = "orange" | "red" | "sky";

export type MetricTileProps = {
  label: string;
  value: string;
  tone?: MetricTone;
  /** Use the compact size (truncated, smaller). Defaults to large. */
  compact?: boolean;
  /** Override the wrapping element's class for layout. */
  className?: string;
  /** Title attribute for hover tooltip; defaults to value. */
  title?: string;
};

export function getMetricToneClass(tone: MetricTone) {
  return ds.metricTone[tone];
}

/**
 * Small framed metric showing one labeled value (Time, Temp., Doneness, Pull
 * Temp, Heat). Extracted from the inline `renderControlMetric` helper that
 * lived in components/ResultHero.tsx so it can be reused across Live and
 * Parrillada Review per docs/design/hybrid-premium-ui-spec.md §6 "MetricTile".
 *
 * Visual is byte-equivalent to the previous inline implementation.
 */
export function MetricTile({
  label,
  value,
  tone = "orange",
  compact = false,
  className,
  title,
}: MetricTileProps) {
  return (
    <div
      className={`${ds.panel.metric} ${getMetricToneClass(tone)}${className ? ` ${className}` : ""}`}
    >
      <p className={`${ds.text.metricEyebrow} text-current/58`}>{label}</p>
      <p
        className={compact ? ds.text.metricCompact : ds.text.metricLarge}
        title={title ?? value}
      >
        {value}
      </p>
    </div>
  );
}
