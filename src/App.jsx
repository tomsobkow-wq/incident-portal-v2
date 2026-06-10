import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadState, saveState, loadRoute, saveRoute } from './lib/storage.js';
import { migrateCase, newInvestigation, uid } from './lib/model.js';
import { CaseList } from './components/CaseList.jsx';
import { CaseShell } from './components/CaseShell.jsx';

const CasesContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useCases = () => useContext(CasesContext);

export default function App() {
  const [cases, setCases] = useState(() => loadState().cases);
  const [route, setRoute] = useState(() => loadRoute());

  useEffect(() => saveState({ cases }), [cases]);
  useEffect(() => saveRoute(route), [route]);

  const ctx = useMemo(() => {
    const goHome = () => setRoute({ view: 'home' });
    const openCase = (id, step = 'details') =>
      setRoute({ view: 'case', id, step });
    const goStep = (step) => setRoute((r) => ({ ...r, step }));
    const createCase = (title) => {
      const inv = newInvestigation(title, cases);
      setCases((cs) => [inv, ...cs]);
      openCase(inv.id);
    };
    const deleteCase = (id) => {
      setCases((cs) => cs.filter((c) => c.id !== id));
      setRoute((r) => (r.view === 'case' && r.id === id ? { view: 'home' } : r));
    };
    const updateCase = (id, fn) =>
      setCases((cs) =>
        cs.map((c) =>
          c.id === id ? { ...fn(c), updatedAt: new Date().toISOString() } : c
        )
      );
    // Restore a case from an exported .json backup. A fresh id is assigned if
    // the backup collides with a case already on this device.
    const importCase = (obj) => {
      const inv = migrateCase(obj);
      if (cases.some((c) => c.id === inv.id)) inv.id = uid();
      setCases((cs) => [inv, ...cs]);
      return inv;
    };
    return { cases, route, goHome, openCase, goStep, createCase, deleteCase, updateCase, importCase };
  }, [cases, route]);

  const openInv =
    route.view === 'case' ? cases.find((c) => c.id === route.id) : null;

  return (
    <CasesContext.Provider value={ctx}>
      {openInv ? <CaseShell inv={openInv} /> : <CaseList />}
    </CasesContext.Provider>
  );
}
