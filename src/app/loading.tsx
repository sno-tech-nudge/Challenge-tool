export default function Loading() {
  return (
    <div className="wrap stack" aria-busy="true" aria-label="loading">
      <div className="skeleton" style={{ height: 36, width: '40%' }} />
      <div className="skeleton" style={{ height: 16, width: '65%' }} />
      <div className="skeleton" style={{ height: 220 }} />
    </div>
  );
}
