'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Breadcrumb plus previous / next organisation. Left and right arrow keys also move, except while
 *  typing in a field. When `lockedReason` is set (jurors who have not submitted their scores yet)
 *  both buttons and the arrow keys are disabled and the reason is shown. */
export function OrgPager({
  base,
  baseLabel,
  name,
  prevId,
  nextId,
  position,
  total,
  lockedReason,
}: {
  base: string;
  baseLabel: string;
  name: string;
  prevId: string | null;
  nextId: string | null;
  position: number;
  total: number;
  lockedReason?: string;
}) {
  const router = useRouter();
  const locked = Boolean(lockedReason);
  const prev = locked ? null : prevId;
  const next = locked ? null : nextId;

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey || document.body.style.overflow === 'hidden') return;
      if (e.key === 'ArrowLeft' && prev) router.push(`${base}/${prev}`);
      if (e.key === 'ArrowRight' && next) router.push(`${base}/${next}`);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [router, base, prev, next]);

  const title = (label: string) => (locked ? lockedReason : label);

  return (
    <div className="pager">
      <div className="crumbs">
        <Link href={base}>{baseLabel}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{name}</span>
      </div>
      <div className="pager-nav" aria-label="move between organisations">
        {locked && <span className="small muted pager-hint">{lockedReason}</span>}
        <Link href={prev ? `${base}/${prev}` : '#'} className="btn secondary sm" aria-disabled={!prev} tabIndex={prev ? 0 : -1} title={title('previous (left arrow)')}>
          <ChevronLeft size={14} strokeLinejoin="miter" strokeLinecap="square" /> previous
        </Link>
        <span className="pos">{position} of {total}</span>
        <Link href={next ? `${base}/${next}` : '#'} className="btn secondary sm" aria-disabled={!next} tabIndex={next ? 0 : -1} title={title('next (right arrow)')}>
          next <ChevronRight size={14} strokeLinejoin="miter" strokeLinecap="square" />
        </Link>
      </div>
    </div>
  );
}
