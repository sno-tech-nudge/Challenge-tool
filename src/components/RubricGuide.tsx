import { PARAMETERS, SCORE_SCALE, SCORE_MAX } from '@/lib/rubric';
import { toJuryScale } from '@/lib/scoring';
import { ECOCIATE_MAX, JURY_MAX } from '@/lib/constants';

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
        score every criterion out of {SCORE_MAX}. each criterion carries a weightage, and your six scores combine into a total out of {JURY_MAX}:
      </p>
      <p className="small guide-formula">points = (score ÷ {SCORE_MAX}) × weightage × {JURY_MAX / 100}</p>
      <p className="small">
        for example, 8 on economic viability (25% weightage, worth {toJuryScale(25)} points) gives {toJuryScale((8 / SCORE_MAX) * 25)} of {toJuryScale(25)}, while the same 8 on focus on the TG (7.5% weightage, worth {toJuryScale(7.5)} points) gives {toJuryScale((8 / SCORE_MAX) * 7.5)} of {toJuryScale(7.5)}.
        the average of all jurors' totals is added to the M&amp;E score for the final score. the calculation is automatic.
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
          <strong>{i + 1}. {p.label}</strong>
          <p className="guide-weight"><span className="pill">weightage {p.weight}%</span></p>
          <h4>component questions</h4>
          <ul>{p.components.map((t) => <li key={t}>{t}</li>)}</ul>
          <h4>jury lens: scale and punt-ability</h4>
          <ul>{p.lens.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}
