// Local-folder backup via the File System Access API (Edge / Chrome).
// The user picks a folder once; every change is then mirrored as one plain
// JSON file per investigation — fully transparent, no install, no service.
// The folder handle is remembered in IndexedDB; after a browser restart the
// browser may ask for one click to re-confirm access.

const DB_NAME = 'incident-portal-backup';
const STORE = 'handles';

export const backupSupported =
  typeof window !== 'undefined' && 'showDirectoryPicker' in window;

const openDb = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const idbGet = async (key) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const rq = db.transaction(STORE).objectStore(STORE).get(key);
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => reject(rq.error);
  });
};

const idbSet = async (key, value) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const idbDelete = async (key) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getSavedFolder = () => idbGet('dir').catch(() => null);

export const chooseBackupFolder = async () => {
  const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
  await idbSet('dir', handle).catch(() => {});
  return handle;
};

export const forgetBackupFolder = () => idbDelete('dir').catch(() => {});

// true when we can write right now; ask=true may show the browser's
// one-click permission prompt (must be called from a user gesture).
export const hasWriteAccess = async (handle, ask = false) => {
  const opts = { mode: 'readwrite' };
  try {
    if ((await handle.queryPermission(opts)) === 'granted') return true;
    if (ask && (await handle.requestPermission(opts)) === 'granted') return true;
  } catch {
    return false;
  }
  return false;
};

// One file per investigation, named by its reference — stable across renames.
export const writeBackup = async (handle, cases) => {
  for (const c of cases) {
    const file = await handle.getFileHandle(`${c.ref}.json`, { create: true });
    const writable = await file.createWritable();
    await writable.write(JSON.stringify(c, null, 2));
    await writable.close();
  }
};
