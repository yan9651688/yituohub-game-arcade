const DB_NAME = "republic-frontier-saves";
const STORE = "saves";
const META = "republic-frontier-save-meta-v1";
let dbPromise;
function database() {
  if (!dbPromise)
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore(STORE, { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error || new Error("存档数据库无法打开"));
      };
      request.onblocked = () => {
        dbPromise = null;
        reject(new Error("存档数据库被另一窗口占用"));
      };
    });
  return dbPromise;
}
export function latestMeta() {
  try {
    return JSON.parse(localStorage.getItem(META) || "null");
  } catch {
    return null;
  }
}
export async function listSaves() {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve(req.result.sort((a, b) => b.savedAt - a.savedAt));
    req.onerror = () => reject(req.error);
  });
}
export async function writeSave(snapshot, meta, automatic = false) {
  // Structured clone detaches the exact saved tick from the live simulation.
  const frozen = structuredClone(snapshot);
  const db = await database();
  const saves = automatic
    ? (await listSaves()).filter((x) => x.automatic).slice(0, 2)
    : [];
  const record = {
    id: automatic ? "auto-0" : "manual",
    savedAt: Date.now(),
    automatic,
    meta: structuredClone(meta),
    snapshot: frozen,
  };
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite"),
      store = tx.objectStore(STORE);
    if (automatic) {
      store.delete("auto-1");
      store.delete("auto-2");
      saves.forEach((old, i) => store.put({ ...old, id: `auto-${i + 1}` }));
    }
    store.put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error || new Error("存档写入失败"));
    tx.onabort = () =>
      reject(tx.error || new Error("存档未完成，请检查浏览器存储空间"));
  });
  try {
    localStorage.setItem(
      META,
      JSON.stringify({ ...record.meta, savedAt: record.savedAt }),
    );
  } catch {
    /* The durable save is already committed. */
  }
  return record;
}
export async function readSave(id) {
  const saves = await listSaves();
  return id ? saves.find((x) => x.id === id) : saves[0];
}
export function exportSave(record) {
  const blob = new Blob(
    [
      JSON.stringify({
        format: "republic-frontier-save",
        version: 1,
        ...record,
      }),
    ],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `共和国之辉-${new Date(record.savedAt).toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
