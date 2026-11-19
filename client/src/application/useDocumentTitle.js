import { useEffect } from 'react';
export function useDocumentTitle(title) {
  useEffect(() => { document.title = title ? `${title} · Coursely` : 'Coursely — Enhance your skills for a brighter future'; }, [title]);
}
