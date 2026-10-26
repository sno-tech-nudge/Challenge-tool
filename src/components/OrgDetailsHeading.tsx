import { FileText } from 'lucide-react';
import { InfoTip } from './InfoTip';

/** The "organisation details" card heading, with a button to the evaluation fact sheet (a PDF written
 *  by a third party) and a small "i" that says so. The PDF opens in a new tab. The label is never
 *  shortened: the button grows to fit it. */
export function OrgDetailsHeading({ orgId, hasFactsheet }: { orgId: string; hasFactsheet: boolean }) {
  return (
    <div className="od-heading">
      <h2>organisation details</h2>
      {hasFactsheet && (
        <div className="od-factsheet">
          <a className="btn secondary sm factsheet-btn" href={`/api/factsheet/${orgId}`} target="_blank" rel="noopener noreferrer">
            <FileText size={14} strokeLinejoin="miter" strokeLinecap="square" aria-hidden="true" />
            <span>click to view the evaluation fact sheet</span>
          </a>
          <InfoTip label="about this evaluation" text="this evaluation has been provided by a third-party" />
        </div>
      )}
    </div>
  );
}
