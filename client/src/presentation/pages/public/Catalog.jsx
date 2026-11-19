import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { LayoutGrid, List, Minus, Plus, RotateCcw, Search, SlidersHorizontal, X, SearchX, Star } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useSaved } from '../../../application/useSaved';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import CourseCard from '../../components/CourseCard';
import { CardSkeletons, EmptyState, ErrorState } from '../../components/States';
import { CATEGORIES, LEVELS, SORTS, applyCatalogFilters, activeFilterCount, emptyFilters } from '../../../domain/course';

const STATUS = [['FEATURED', 'Featured'], ['HOT', 'Hot'], ['NEW', 'New'], ['SPECIAL', 'Special']];
const PRICES = [['', 'Any price'], ['free', 'Free'], ['under25', 'Under $25'], ['25to50', '$25 – $50'], ['over50', 'Over $50']];
const RATINGS = [[0, 'Any rating'], [4.5, '4.5 & up'], [4, '4.0 & up'], [3, '3.0 & up']];

const readFilters = (sp) => ({
  q: sp.get('q') || '', sort: sp.get('sort') || 'newest',
  categories: sp.getAll('category'), levels: sp.getAll('level'), badges: sp.getAll('badge'),
  minRating: Number(sp.get('rating')) || 0, price: sp.get('price') || '',
});
const toParams = (f) => {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.sort !== 'newest') p.set('sort', f.sort);
  f.categories.forEach((v) => p.append('category', v));
  f.levels.forEach((v) => p.append('level', v));
  f.badges.forEach((v) => p.append('badge', v));
  if (f.minRating) p.set('rating', f.minRating);
  if (f.price) p.set('price', f.price);
  return p;
};

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = title.toLowerCase();
  return (
    <div className="filter-section">
      <button type="button" className="filter-head" aria-expanded={open} aria-controls={`f-${id}`} onClick={() => setOpen(!open)}>
        <span>{title}</span>{open ? <Minus size={20} aria-hidden /> : <Plus size={20} aria-hidden />}
      </button>
      {open && <div id={`f-${id}`} className="filter-body">{children}</div>}
    </div>
  );
}

function CheckGroup({ options, values, onChange, counts }) {
  return options.map(([value, label]) => (
    <label className="check" key={value}>
      <input type="checkbox" checked={values.includes(value)} onChange={(e) => onChange(e.target.checked ? [...values, value] : values.filter((v) => v !== value))} />
      {label}{counts && <span className="count">{counts[value] || 0}</span>}
    </label>
  ));
}

/** Shared by the public site (/courses) and the signed-in app (/app/explore). */
export default function Catalog({ basePath = '/courses', embedded = false }) {
  useDocumentTitle('Courses');
  const repo = useRepo();
  const [sp, setSp] = useSearchParams();
  const f = useMemo(() => readFilters(sp), [sp]);
  const [view, setView] = useState('grid');
  const [drawer, setDrawer] = useState(false);
  const saved = useSaved();
  const { data, error, loading, reload } = useAsync(() => repo.courses.list(), [repo]);
  const update = (patch) => setSp(toParams({ ...f, ...patch }), { replace: true });
  const results = useMemo(() => applyCatalogFilters(data || [], f), [data, f]);
  const n = activeFilterCount(f);
  const closeRef = useRef(null);

  const catCounts = useMemo(() => (data || []).reduce((m, c) => ({ ...m, [c.category]: (m[c.category] || 0) + 1 }), {}), [data]);

  useEffect(() => {
    if (!drawer) return undefined;
    closeRef.current?.focus();
    const esc = (e) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [drawer]);

  const filters = (
    <>
      <Section title="Category"><CheckGroup options={CATEGORIES.map((c) => [c, c])} values={f.categories} counts={catCounts} onChange={(v) => update({ categories: v })} /></Section>
      <Section title="Status"><CheckGroup options={STATUS} values={f.badges} onChange={(v) => update({ badges: v })} /></Section>
      <Section title="Level"><CheckGroup options={LEVELS.map((l) => [l, l])} values={f.levels} onChange={(v) => update({ levels: v })} /></Section>
      <Section title="Rating" defaultOpen={false}>
        {RATINGS.map(([v, label]) => (
          <label className="check" key={v}><input type="radio" name="rating" className="radio" checked={f.minRating === v} onChange={() => update({ minRating: v })} />{v ? <><Star size={14} fill="currentColor" className="star-ic" aria-hidden /> {label}</> : label}</label>
        ))}
      </Section>
      <Section title="Price" defaultOpen={false}>
        {PRICES.map(([v, label]) => (
          <label className="check" key={v || 'any'}><input type="radio" name="price" className="radio" checked={f.price === v} onChange={() => update({ price: v })} />{label}</label>
        ))}
      </Section>
      <div className="filter-actions">
        <button type="button" className="btn btn-primary btn-block show-results" onClick={() => setDrawer(false)}>Show results{data ? ` (${results.length})` : ''}</button>
        <button type="button" className="reset" onClick={() => setSp(new URLSearchParams(), { replace: true })} disabled={!n && !f.q}><RotateCcw size={14} aria-hidden /> Reset all</button>
      </div>
    </>
  );

  return (
    <div className={embedded ? 'catalog embedded' : 'catalog container'}>
      <div className="catalog-top">
        <h1 className="catalog-title">Courses</h1>
        <form className="input-group catalog-search" role="search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="catalog-q" className="sr-only">Search courses</label>
          <input id="catalog-q" className="input" placeholder="Search Courses" value={f.q} onChange={(e) => update({ q: e.target.value })} />
          <button type="submit" aria-label="Search"><Search size={18} aria-hidden /></button>
        </form>
        <div className="catalog-tools">
          <button type="button" className="btn btn-outline btn-sm filters-btn" onClick={() => setDrawer(true)}><SlidersHorizontal size={16} aria-hidden /> Filters{n ? ` (${n})` : ''}</button>
          <div className="sort">
            <label htmlFor="sort">Sort By:</label>
            <select id="sort" className="select" value={f.sort} onChange={(e) => update({ sort: e.target.value })}>{SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
          </div>
          <div className="view-toggle" role="group" aria-label="Layout">
            <button type="button" aria-pressed={view === 'grid'} aria-label="Grid view" onClick={() => setView('grid')}><LayoutGrid size={18} /></button>
            <button type="button" aria-pressed={view === 'list'} aria-label="List view" onClick={() => setView('list')}><List size={18} /></button>
          </div>
        </div>
      </div>

      <div className="catalog-layout">
        {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(false)} aria-hidden />}
        <aside className={`filters ${drawer ? 'open' : ''}`} aria-label="Filters" {...(drawer ? { role: 'dialog', 'aria-modal': 'true' } : {})}>
          <div className="filters-mobile-head"><b>Filters</b><button type="button" className="icon-btn" ref={closeRef} onClick={() => setDrawer(false)} aria-label="Close filters"><X size={18} /></button></div>
          {filters}
        </aside>

        <section className="catalog-results" aria-live="polite" aria-busy={loading}>
          {!loading && !error && <p className="result-count">{results.length} {results.length === 1 ? 'course' : 'courses'}{f.q ? ` for “${f.q}”` : ''}</p>}
          {loading && <CardSkeletons count={6} />}
          {error && <ErrorState error={error} onRetry={reload} title="We could not load courses" />}
          {!loading && !error && results.length === 0 && (
            <EmptyState icon={SearchX} title="No courses match your filters" action={<button type="button" className="btn btn-primary" onClick={() => setSp(new URLSearchParams(), { replace: true })}>Clear all filters</button>}>
              Try a different search term or remove a filter to see more courses.
            </EmptyState>
          )}
          {!loading && !error && results.length > 0 && (
            <div className={view === 'list' ? 'course-list' : 'course-grid cols-3'}>
              {results.map((c, i) => <CourseCard key={c.id} course={c} index={i} to={`${basePath}/${c.id}`} variant={view} saved={saved.has(c.id)} onSave={saved.toggle} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
