interface StyleCardProps {
  label: string;
  output: string;
}

export function StyleCard({ label, output }: StyleCardProps) {
  return (
    <div className="flex flex-col gap-2 border border-mist p-4">
      <span className="text-xs tracking-wide text-graphite uppercase">
        {label}
      </span>
      <p className="min-h-8 break-all text-lg text-ink">
        {output || <span className="text-graphite">—</span>}
      </p>
    </div>
  );
}
