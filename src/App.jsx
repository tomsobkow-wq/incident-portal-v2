import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadState, saveState, loadRoute, saveRoute } from './lib/storage.js';
import {
  backupSupported,
  chooseBackupFolder,
  forgetBackupFolder,
  getSavedFolder,
  hasWriteAccess,
  writeBackup,
} from './lib/backup.js';
import { migrateCase, newInvestigation, uid } from './lib/model.js';
import { CaseList } from './components/CaseList.jsx';
import { CaseShell } from './components/CaseShell.jsx';

const CasesContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useCases = () => useContext(CasesContext);

export default function App() {
  const [cases, setCases] = useState(() => loadState().cases);
  const [route, setRoute] = useState(() => loadRoute());

  // Local-folder backup: 'off' | 'connected' | 'reconnect' | 'error'
  const [backup, setBackup] = useState({ status: 'off', folder: '', lastSaved: null });
  const folderRef = useRef(null);

  useEffect(() => saveState({ cases }), [cases]);
  useEffect(() => saveRoute(route), [route]);

  // Restore the remembered backup folder on startup.
  useEffect(() => {
    if (!backupSupported) return;
    getSavedFolder().then(async (handle) => {
      if (!handle) return;
      folderRef.current = handle;
      const ok = await hasWriteAccess(handle);
      setBackup((b) => ({ ...b, status: ok ? 'connected' : 'reconnect', folder: handle.name }));
    });
  }, []);

  // Mirror every change to the backup folder, debounced so typing stays light.
  useEffect(() => {
    if (backup.status !== 'connected' || !folderRef.current || !cases.length) return;
    const t = setTimeout(() => {
      writeBackup(folderRef.current, cases)
        .then(() => setBackup((b) => ({ ...b, lastSaved: new Date().toISOString() })))
        .catch(() => setBackup((b) => ({ ...b, status: 'error' })));
    }, 1500);
    return () => clearTimeout(t);
  }, [cases, backup.status]);

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

    const connectBackup = async () => {
      try {
        const handle = await chooseBackupFolder();
        folderRef.current = handle;
        await writeBackup(handle, cases);
        setBackup({ status: 'connected', folder: handle.name, lastSaved: new Date().toISOString() });
      } catch {
        /* picker dismissed */
      }
    };
    const reconnectBackup = async () => {
      const handle = folderRef.current;
      if (!handle) return;
      if (await hasWriteAccess(handle, true)) {
        await writeBackup(handle, cases).catch(() => {});
        setBackup({ status: 'connected', folder: handle.name, lastSaved: new Date().toISOString() });
      }
    };
    const disconnectBackup = async () => {
      folderRef.current = null;
      await forgetBackupFolder();
      setBackup({ status: 'off', folder: '', lastSaved: null });
    };

    return {
      cases, route, goHome, openCase, goStep, createCase, deleteCase,
      updateCase, importCase,
      backup, backupSupported, connectBackup, reconnectBackup, disconnectBackup,
    };
  }, [cases, route, backup]);

  const openInv =
    route.view === 'case' ? cases.find((c) => c.id === route.id) : null;

  return (
    <CasesContext.Provider value={ctx}>
      {openInv ? <CaseShell inv={openInv} /> : <CaseList />}
    </CasesContext.Provider>
  );
}
