// localStorage persistence. One key holds every investigation.

import { migrateCase } from './model.js';

const KEY = 'incident-portal-v2';
const ROUTE_KEY = 'incident-portal-v2:route';

export const loadState = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { cases: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.cases)) return { cases: [] };
    return { ...parsed, cases: parsed.cases.map(migrateCase) };
  } catch {
    return { cases: [] };
  }
};

export const saveState = (state) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Could not save to localStorage', err);
  }
};

export const loadRoute = () => {
  try {
    const raw = localStorage.getItem(ROUTE_KEY);
    if (!raw) return { view: 'home' };
    const parsed = JSON.parse(raw);
    return parsed && parsed.view ? parsed : { view: 'home' };
  } catch {
    return { view: 'home' };
  }
};

export const saveRoute = (route) => {
  try {
    localStorage.setItem(ROUTE_KEY, JSON.stringify(route));
  } catch {
    /* non-fatal */
  }
};
