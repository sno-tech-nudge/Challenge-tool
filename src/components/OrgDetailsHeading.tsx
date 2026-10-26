import { FileText } from 'lucide-react';

/** The "organisation details" card heading, with a button to the evaluation fact sheet (a PDF written
 *  by the third party M&E partner, which the label says). The PDF opens in a new tab. The label is
 *  never shortened: the button grows to fit it. */
export function OrgDetailsHeading({ orgId, hasFactsheet }: { orgId: string; hasFactsheet: boolean }) {
  return (
    <div className="od-heading">
      <h2>organisation details</h2>
      {hasFactsheet && (
        <div className="od-factsheet">
          <a className="btn secondary sm factsheet-btn" href={`/api/factsheet/${orgId}`} target="_blank" rel="noopener noreferrer">
            <FileText size={14} strokeLinejoin="miter" strokeLinecap="square" aria-hidden="true" />
            <span>click to view the evaluation fact sheet (by <span className="keep-case">M&amp;E</span> partner)</span>
          </a>
        </div>
      )}
    </div>
  );
}
