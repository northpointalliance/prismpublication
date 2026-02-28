const ChartTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-xs shadow-lg">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="leading-relaxed">
          {p.name}: <span className="font-semibold">
            {typeof p.value === "number" && p.name.includes("$")
              ? `$${p.value.toFixed(2)}`
              : p.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
};

export default ChartTooltip;
