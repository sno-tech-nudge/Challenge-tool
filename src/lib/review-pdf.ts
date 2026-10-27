import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { PARAMETERS, SCORE_MAX, weightedPoints, type ScoreEntry } from './rubric';
import { JURY_MAX } from './constants';
import { toJuryScale } from './scoring';

export interface ReviewPdfInput {
  orgName: string;
  jurorName: string;
  submittedAt: Date;
  rescoreCount: number;
  entries: ScoreEntry[];
  total: number; // weighted total out of 100, as stored
  verdict: string | null;
  comment: string | null;
}

const PAGE = { w: 595.28, h: 841.89 }; // A4
const MARGIN = 50;
const RED = rgb(0.698, 0.063, 0.063);
const INK = rgb(0.12, 0.12, 0.12);
const GREY = rgb(0.4, 0.4, 0.4);
const LINE = rgb(0.85, 0.83, 0.82);

const stamp = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

/** The built-in PDF font only knows Latin text. Anything else (emoji, other scripts) becomes "?" rather than failing. */
function makeSafe(font: PDFFont) {
  const known = new Set(font.getCharacterSet());
  return (text: string) =>
    Array.from(text.replace(/\r/g, '').replace(/\t/g, '    '))
      .map((ch) => (ch === '\n' || known.has(ch.codePointAt(0)!) ? ch : '?'))
      .join('');
}

/** A PDF of one juror's submitted review: every question with its weightage, the score and the remarks they gave,
 *  the total, the verdict and the comment. */
export async function buildReviewPdf(input: ReviewPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${input.orgName} - my scores`);
  doc.setAuthor(input.jurorName);
  doc.setCreator('the aahaar bazaar challenge');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const safe = makeSafe(font);

  let page: PDFPage = doc.addPage([PAGE.w, PAGE.h]);
  let y = PAGE.h - MARGIN;
  const width = PAGE.w - MARGIN * 2;

  const wrap = (text: string, f: PDFFont, size: number, maxWidth: number): string[] => {
    const out: string[] = [];
    for (const para of safe(text).split('\n')) {
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        // a single very long word is broken so it can never run off the page
        let w = word;
        while (f.widthOfTextAtSize(w, size) > maxWidth) {
          let cut = w.length - 1;
          while (cut > 1 && f.widthOfTextAtSize(w.slice(0, cut), size) > maxWidth) cut--;
          if (line) { out.push(line); line = ''; }
          out.push(w.slice(0, cut));
          w = w.slice(cut);
        }
        const next = line ? `${line} ${w}` : w;
        if (f.widthOfTextAtSize(next, size) <= maxWidth) line = next;
        else { out.push(line); line = w; }
      }
      out.push(line);
    }
    return out;
  };

  const need = (h: number) => {
    if (y - h < MARGIN + 24) {
      page = doc.addPage([PAGE.w, PAGE.h]);
      y = PAGE.h - MARGIN;
    }
  };
  const text = (t: string, opts: { f?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; x?: number; gap?: number } = {}) => {
    const f = opts.f ?? font;
    const size = opts.size ?? 10.5;
    const x = opts.x ?? MARGIN;
    const lead = size * 1.4;
    for (const line of wrap(t, f, size, PAGE.w - MARGIN - x)) {
      need(lead);
      y -= lead;
      page.drawText(line, { x, y, size, font: f, color: opts.color ?? INK });
    }
    y -= opts.gap ?? 0;
  };
  const rule = () => {
    need(10);
    y -= 6;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE.w - MARGIN, y }, thickness: 0.6, color: LINE });
    y -= 6;
  };

  // heading: the brand mark, the challenge, and whose copy this is
  page.drawRectangle({ x: MARGIN, y: y - 22, width: 22, height: 22, color: RED });
  page.drawText('a', { x: MARGIN + 7, y: y - 17, size: 15, font: bold, color: rgb(1, 1, 1) });
  page.drawText('the aahaar bazaar challenge', { x: MARGIN + 32, y: y - 10, size: 13, font: bold, color: INK });
  page.drawText('jury scores', { x: MARGIN + 32, y: y - 22, size: 9, font, color: GREY });
  y -= 44;
  text(input.orgName, { f: bold, size: 19, gap: 2 });
  text(`scored by ${input.jurorName}`, { color: GREY });
  const when = stamp.format(input.submittedAt);
  text(input.rescoreCount > 0 ? `last submitted ${when} IST (rescored ${input.rescoreCount} ${input.rescoreCount === 1 ? 'time' : 'times'})` : `submitted ${when} IST`, { color: GREY, gap: 4 });
  rule();

  const byKey = new Map(input.entries.map((e) => [e.key, e]));
  PARAMETERS.forEach((p, i) => {
    const e = byKey.get(p.key);
    const points = e ? toJuryScale(weightedPoints(p, e.score)) : 0;
    const worth = toJuryScale(p.weight);
    need(70);
    y -= 6;
    text(`${i + 1}. ${p.label}`, { f: bold, size: 11.5, gap: 1 });
    text(`weightage ${p.weight}% (worth ${worth} points)`, { color: GREY, size: 9.5, gap: 3 });
    text(`score: ${e ? e.score : '-'} / ${SCORE_MAX}   =   ${points} of ${worth} points`, { f: bold, size: 11, color: RED, gap: 3 });
    text('remarks', { color: GREY, size: 9, gap: 0 });
    text(e?.remarks ? e.remarks : 'no remarks', { x: MARGIN + 12, color: e?.remarks ? INK : GREY, gap: 4 });
    rule();
  });

  need(110);
  y -= 8;
  text(`your total: ${toJuryScale(input.total)} / ${JURY_MAX}`, { f: bold, size: 15, color: RED, gap: 4 });
  text(`your final verdict: ${input.verdict === 'Y' ? 'yes' : input.verdict === 'N' ? 'no' : '-'}`, { f: bold, size: 11.5, gap: 4 });
  text('your comment', { color: GREY, size: 9 });
  text(input.comment ? input.comment : '-', { x: MARGIN + 12, gap: 6 });

  // footers: a copy note and page numbers
  const pages = doc.getPages();
  pages.forEach((pg, i) => {
    pg.drawText(safe(`your own copy, downloaded ${stamp.format(new Date())} IST`), { x: MARGIN, y: 28, size: 8, font, color: GREY });
    const label = `page ${i + 1} of ${pages.length}`;
    pg.drawText(label, { x: PAGE.w - MARGIN - font.widthOfTextAtSize(label, 8), y: 28, size: 8, font, color: GREY });
  });
  void width;
  return doc.save();
}
