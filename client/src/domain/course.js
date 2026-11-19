// Domain layer: pure business rules and vocabulary. No React, no network.

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
export const BADGES = ['NEW', 'HOT', 'FEATURED', 'SPECIAL'];
export const CATEGORIES = [
  'Art & Design', 'Development', 'Business', 'Marketing',
  'Data Science', 'Photography', 'Music', 'Communication',
];
export const SORTS = [
  { value: 'newest', label: 'Release date (newest first)' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

export const formatPrice = (n) => (Number(n) === 0 ? 'Free' : `$${Number(n).toFixed(2)}`);

export function formatDuration(minutes = 0) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h} ${h === 1 ? 'hour' : 'hours'}`;
  return `${h}h ${m}m`;
}

export const formatHours = (minutes = 0) => `${Math.round(minutes / 6) / 10} hrs`.replace('.0 ', ' ');

export const discountPercent = (c) =>
  c.originalPrice && c.originalPrice > c.price ? Math.round((1 - c.price / c.originalPrice) * 100) : 0;

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

export const formatCount = (n = 0) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '')}k` : String(n));

export function curriculumStats(modules = []) {
  const lessons = modules.flatMap((m) => m.lessons || []);
  return {
    modules: modules.length,
    lessons: lessons.length,
    minutes: lessons.reduce((s, l) => s + (Number(l.durationMinutes) || 0), 0),
  };
}

/** Filter + sort the catalogue. Filters are OR within a group and AND between groups. */
export function applyCatalogFilters(courses, f) {
  const q = (f.q || '').trim().toLowerCase();
  const out = courses.filter((c) => {
    if (q && !`${c.title} ${c.category} ${c.instructor?.name || ''}`.toLowerCase().includes(q)) return false;
    if (f.categories?.length && !f.categories.includes(c.category)) return false;
    if (f.levels?.length && !f.levels.includes(c.level)) return false;
    if (f.badges?.length && !f.badges.includes(c.badge)) return false;
    if (f.minRating && c.rating < f.minRating) return false;
    if (f.price === 'free' && c.price !== 0) return false;
    if (f.price === 'under25' && c.price >= 25) return false;
    if (f.price === '25to50' && (c.price < 25 || c.price > 50)) return false;
    if (f.price === 'over50' && c.price <= 50) return false;
    return true;
  });
  const by = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    popular: (a, b) => b.students - a.students,
    rating: (a, b) => b.rating - a.rating,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
  }[f.sort || 'newest'];
  return [...out].sort(by);
}

export const emptyFilters = { q: '', categories: [], levels: [], badges: [], minRating: 0, price: '', sort: 'newest' };

export function activeFilterCount(f) {
  return f.categories.length + f.levels.length + f.badges.length + (f.minRating ? 1 : 0) + (f.price ? 1 : 0);
}

export function nextLesson(course) {
  const lessons = (course.modules || []).flatMap((m) => m.lessons);
  return lessons.find((l) => !l.completed) || lessons[0] || null;
}

export function validateCourseDraft(d) {
  const errors = {};
  if (!d.title?.trim()) errors.title = 'Give your course a title.';
  else if (d.title.length > 120) errors.title = 'Keep the title under 120 characters.';
  if (!d.category) errors.category = 'Choose a category.';
  if (!d.description?.trim() || d.description.trim().length < 20) errors.description = 'Describe the course in at least 20 characters.';
  if (d.price === '' || Number.isNaN(Number(d.price)) || Number(d.price) < 0) errors.price = 'Enter a price of 0 or more.';
  if (d.originalPrice !== '' && d.originalPrice != null && Number(d.originalPrice) < Number(d.price)) errors.originalPrice = 'Original price must be higher than the sale price.';
  return errors;
}

export function validateCredentials({ name, email, password }, { register = false } = {}) {
  const errors = {};
  if (register && !name?.trim()) errors.name = 'Tell us your name.';
  if (!/^\S+@\S+\.\S+$/.test(email || '')) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Enter your password.';
  else if (register && password.length < 8) errors.password = 'Use at least 8 characters.';
  return errors;
}
