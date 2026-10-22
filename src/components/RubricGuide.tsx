import { PARAMETERS } from '@/lib/rubric';
import { ECOCIATE_MAX, JURY_MAX, JURY_RAW_MAX } from '@/lib/constants';

/** Content for the "scoring guide" side panel, shown to both roles. */
export function RubricGuide() {
  return (
    <div>
      <p className="small" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        each juror scores 7 parameters, {JURY_RAW_MAX} points in total. the average of the jurors' totals is scaled to {JURY_MAX} and added to the ecociate score (out of {ECOCIATE_MAX}), so the final score is out of 100.
      </p>
      {PARAMETERS.map((p, i) => (
        <div className="guide-item" key={p.key}>
          <div className="row">
            <strong>{i + 1}. {p.label}</strong>
            <span className="pill">max {p.max}</span>
          </div>
          <p className="small muted" style={{ marginTop: 4 }}>{p.hint}</p>
        </div>
      ))}
    </div>
  );
}
