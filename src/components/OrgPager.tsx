'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Breadcrumb plus previous / next organisation. Left and right arrow keys also move, except while
 *  typing in a field. */
export function OrgPager({
  base,
  baseLabel,
  name,
  prevId,
  nextId,
  position,
  total,
}: {
  base: string;
  baseLabel: string;
  name: string;
  prevId: string | null;
  nextId: string | null;
  position: number;
  total: number;
}) {
  const router = useRouter();

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey || document.body.style.overflow === 'hidden') return;
      if (e.key === 'ArrowLeft' && prevId) router.push(`${base}/${prevId}`);
      if (e.key === 'ArrowRight' && nextId) router.push(`${base}/${nextId}`);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [router, base, prevId, nextId]);

  return (
    <div className="pager">
      <div className="crumbs">
        <Link href={base}>{baseLabel}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{name}</span>
      </div>
      <div className="pager-nav" aria-label="move between organisations">
        <Link href={prevId ? `${base}/${prevId}` : '#'} className="btn secondary sm" aria-disabled={!prevId} tabIndex={prevId ? 0 : -1} title="previous (left arrow)">
          <ChevronLeft size={14} strokeLinejoin="miter" strokeLinecap="square" /> previous
        </Link>
        <span className="pos">{position} of {total}</span>
        <Link href={nextId ? `${base}/${nextId}` : '#'} className="btn secondary sm" aria-disabled={!nextId} tabIndex={nextId ? 0 : -1} title="next (right arrow)">
          next <ChevronRight size={14} strokeLinejoin="miter" strokeLinecap="square" />
        </Link>
      </div>
    </div>
  );
}
