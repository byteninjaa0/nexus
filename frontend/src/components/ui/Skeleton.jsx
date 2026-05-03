export function Skeleton({ style = {}, className = "" }) {
  return <div className={`skeleton ${className}`} style={{ height: 14, ...style }} />;
}

export function CardSkeleton() {
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <Skeleton style={{ width: "40%", height: 18, marginBottom: 16 }} />
      <Skeleton style={{ width: "100%", marginBottom: 8 }} />
      <Skeleton style={{ width: "85%" }} />
    </div>
  );
}
