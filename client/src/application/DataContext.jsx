import React, { createContext, useContext, useEffect, useState } from 'react';
import { resolveRepository } from '../infrastructure';

const DataContext = createContext(null);
export const useRepo = () => useContext(DataContext);

export function DataProvider({ children, fallback }) {
  const [repo, setRepo] = useState(null);
  useEffect(() => { resolveRepository().then(setRepo); }, []);
  if (!repo) return fallback;
  return <DataContext.Provider value={repo}>{children}</DataContext.Provider>;
}
