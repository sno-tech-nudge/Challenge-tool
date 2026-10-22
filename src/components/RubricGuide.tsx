import { PARAMETERS, SCORE_SCALE, SCORE_MAX } from '@/lib/rubric';
import { ECOCIATE_MAX, JURY_MAX, JURY_RAW_MAX } from '@/lib/constants';

/** Content for the "scoring guide" side panel, shown to both roles: how the evaluation works, how
 *  scoring works, the scale, and each criterion with its questions. */
export function RubricGuide() {
  return (
    <div className="guide">
      <h3>how the evaluation works</h3>
      <p className="small">
        the final assessment brings together two lenses. {ECOCIATE_MAX}% comes from the M&amp;E team's findings (what has been done) and {JURY_MAX}% from the jury evaluation (what could be: the
        scalability potential of the solution, and its punt-ability, meaning whether we are willing to bet on the team implementing it).
      </p>

      <h3>how scoring works</h3>
      <p className="small">
        score every criterion out of {SCORE_MAX}. the score is scaled to the criterion's weightage, so your six scores add up to a total out of {JURY_RAW_MAX}:
      </p>
      <p className="small guide-formula">weighted points = (score ÷ {SCORE_MAX}) × weightage</p>
      <p className="small">
        for example, 8 on economic viability (25%) gives 20 of 25 points, while the same 8 on focus on the TG (7.5%) gives 6 of 7.5. the average of all jurors' totals is scaled to {JURY_MAX} for the final score.
        the scaling is calculated automatically.
      </p>

      <h3>scoring scale</h3>
      <table className="summary">
        <tbody>
          {SCORE_SCALE.map((s) => (
            <tr key={s.range}>
              <td style={{ whiteSpace: 'nowrap' }}><strong>{s.range}</strong> {s.name}</td>
              <td>{s.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>the six criteria</h3>
      {PARAMETERS.map((p, i) => (
        <div className="guide-item" key={p.key}>
          <div className="row">
            <strong>{i + 1}. {p.label}</strong>
            <span className="pill">{p.weight}%</span>
          </div>
          <h4>component questions</h4>
          <ul>{p.components.map((t) => <li key={t}>{t}</li>)}</ul>
          <h4>jury lens: scale and punt-ability</h4>
          <ul>{p.lens.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}
