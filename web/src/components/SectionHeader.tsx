type Props = { title: string; hint?: string };

export function SectionHeader({ title, hint }: Props) {
  return (
    <div className="section-header">
      <h1 className="t-display-xl">{title}</h1>
      {hint && <p className="hint t-label-sm">{hint}</p>}
    </div>
  );
}
