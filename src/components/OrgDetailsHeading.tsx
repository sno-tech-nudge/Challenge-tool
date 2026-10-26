import { FileText } from 'lucide-react';

/** The "organisation details" card heading, with a button to the organisation's factsheet PDF.
 *  The PDF opens in a new tab. The label is never shortened: the button grows to fit it. */
export function OrgDetailsHeading({ orgId, hasFactsheet }: { orgId: string; hasFactsheet: boolean }) {
  return (
    <div className="od-heading">
      <h2>organisation details</h2>
      {hasFactsheet && (
        <a className="btn secondary sm factsheet-btn" href={`/api/factsheet/${orgId}`} target="_blank" rel="noopener noreferrer">
          <FileText size={14} strokeLinejoin="miter" strokeLinecap="square" aria-hidden="true" />
          <span>click to view the organisation factsheet</span>
        </a>
      )}
    </div>
  );
}
