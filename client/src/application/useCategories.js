import { useEffect, useState } from 'react';
import { useRepo } from './DataContext';
import { CATEGORIES } from '../domain/course';

/** Category names managed by admins. Falls back to the built-in list if the request fails. */
export function useCategories() {
  const repo = useRepo();
  const [names, setNames] = useState(CATEGORIES);
  useEffect(() => {
    let live = true;
    Promise.resolve(repo.categories?.list?.()).then((n) => { if (live && n?.length) setNames(n); }).catch(() => {});
    return () => { live = false; };
  }, [repo]);
  return names;
}