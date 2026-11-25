export interface MinimalFileDescriptor {
  name: string;
  type?: string;
}

export interface MatchableTool {
  id: string;
  shortName: string;
  shortTag: string;
  category: string;
  path: string;
  iconName: string;
  accepts: string[];
}

function getExt(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

function matchesMimeOrExt(file: MinimalFileDescriptor, accepts: string[]): boolean {
  const ext = getExt(file.name);
  const mime = (file.type || '').toLowerCase();
  return accepts.some((rule) => {
    if (rule.startsWith('.')) return ext === rule;
    if (rule.endsWith('/*')) return mime.startsWith(rule.slice(0, -1));
    return mime === rule;
  });
}

/**
 * Match dropped files to ranked tools so the homepage Universal Drop Bar
 * surfaces immediate one-click actions.
 */
export function matchToolsForFiles<T extends MatchableTool>(
  files: MinimalFileDescriptor[],
  tools: T[]
): T[] {
  if (!files || files.length === 0) return [];

  const matched = tools.filter((t) =>
    files.every((f) => matchesMimeOrExt(f, t.accepts))
  );

  // Fallback if heterogeneous files were dropped: match any file
  const candidates =
    matched.length > 0
      ? matched
      : tools.filter((t) => files.some((f) => matchesMimeOrExt(f, t.accepts)));

  const firstExt = getExt(files[0].name);
  const isMulti = files.length > 1;

  // Smart action priority ranking
  const priorityOrder: Record<string, string[]> = {
    '.pdf': isMulti
      ? ['merge-pdf', 'split-pdf', 'rotate-pdf', 'protect-pdf', 'pdf-to-images', 'pdf-to-doc', 'pdf-page-numberer', 'redact-flatten-pdf']
      : ['split-pdf', 'pdf-to-images', 'pdf-to-doc', 'rotate-pdf', 'protect-pdf', 'pdf-page-numberer', 'redact-flatten-pdf', 'merge-pdf'],
    '.svg': ['svg-optimizer', 'image-converter', 'image-resizer'],
  };

  const order = priorityOrder[firstExt];
  if (order) {
    return [...candidates].sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }

  return candidates;
}

const DB_NAME = 'novatools-handoff';
const STORE_NAME = 'pending';
const HANDOFF_TTL_MS = 2 * 60 * 1000;

interface HandoffRecord {
  targetPath: string;
  files: File[];
  createdAt: number;
}

function openHandoffDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'targetPath' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storeHandoffFiles(targetPath: string, files: File[]): Promise<void> {
  if (typeof indexedDB === 'undefined' || files.length === 0) return;
  const db = await openHandoffDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record: HandoffRecord = {
      targetPath,
      files,
      createdAt: Date.now(),
    };
    store.put(record);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function consumeHandoffFiles(targetPath: string): Promise<File[]> {
  if (typeof indexedDB === 'undefined') return [];
  try {
    const db = await openHandoffDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(targetPath);
      getReq.onsuccess = () => {
        const record = getReq.result as HandoffRecord | undefined;
        store.delete(targetPath);
        if (!record || Date.now() - record.createdAt > HANDOFF_TTL_MS) {
          resolve([]);
          return;
        }
        resolve(record.files || []);
      };
      getReq.onerror = () => resolve([]);
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    });
  } catch {
    return [];
  }
}
