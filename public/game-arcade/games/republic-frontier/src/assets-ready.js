export function artProgress(renderer) {
  const groups = [renderer.atlas.status, renderer.terrainAtlas.status];
  const total = groups.reduce((sum, group) => sum + group.expected, 0);
  const loaded = groups.reduce((sum, group) => sum + group.loaded, 0);
  const failed = groups.flatMap((group) => group.failed || []);
  return {
    total,
    loaded,
    failed,
    pending: Math.max(0, total - loaded - failed.length),
    ready: loaded === total && failed.length === 0,
  };
}

export async function waitForArt(
  renderer,
  onProgress = () => {},
  timeoutMs = 60000,
) {
  const started = Date.now();
  while (true) {
    const status = artProgress(renderer);
    onProgress(status);
    if (status.ready) return status;
    if (status.failed.length)
      throw new Error("部分作战画面未能载入，请重新加载后再试。");
    if (Date.now() - started >= timeoutMs)
      throw new Error("作战画面载入超时，请检查连接并重新加载。");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
