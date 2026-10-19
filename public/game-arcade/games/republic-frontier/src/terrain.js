// Shared terrain semantics for simulation, cursor projection and tactical maps.
export function tileAt(state, x, y) {
  return x >= 0 && y >= 0 && x < state.width && y < state.height
    ? state.tiles[Math.floor(y) * state.width + Math.floor(x)]
    : null;
}
export function tileElevation(tile, fx = 0.5, fy = 0.5) {
  if (!tile) return 0;
  if (!tile.ramp) return tile.height || 0;
  const { axis, low, high, sign } = tile.ramp;
  let t = axis === "x" ? fx : fy;
  if (sign < 0) t = 1 - t;
  return low + (high - low) * Math.max(0, Math.min(1, t));
}
export function elevationAt(state, x, y, movement = null) {
  const t = tileAt(state, x, y);
  if (t?.bridge && movement === "naval") return 0;
  return tileElevation(t, x - Math.floor(x), y - Math.floor(y));
}
export function edgeConnected(from, to, dx, dy, movement = "tracked") {
  if (!from || !to) return false;
  if (movement === "air" || movement === "naval") return true;
  if (from.bridge || to.bridge)
    return Math.abs((from.height || 0) - (to.height || 0)) <= 1;
  const a = tileElevation(
    from,
    dx > 0 ? 1 : dx < 0 ? 0 : 0.5,
    dy > 0 ? 1 : dy < 0 ? 0 : 0.5,
  );
  const b = tileElevation(
    to,
    dx > 0 ? 0 : dx < 0 ? 1 : 0.5,
    dy > 0 ? 0 : dy < 0 ? 1 : 0.5,
  );
  return Math.abs(a - b) < 0.12;
}
export function terrainSpeed(tile, movement = "tracked") {
  if (!tile || movement === "air" || movement === "naval") return 1;
  const foot = movement === "foot";
  if (tile.ramp) return foot ? 0.9 : 0.78;
  if (tile.bridge || tile.kind === "road") return 1.12;
  if (tile.surface === "ice") return foot ? 0.88 : 0.72;
  if (tile.surface === "snow") return foot ? 0.94 : 0.86;
  if (tile.surface === "marsh") return foot ? 0.72 : 0.55;
  if (tile.surface === "sand") return foot ? 0.94 : 0.88;
  return 1;
}
export function tacticalColor(tile) {
  if (tile.ore > 0) return tile.kind === "gem" ? "#bf8fae" : "#ccb15d";
  if (tile.bridge) return "#ceba87";
  if (tile.kind === "water") return "#315c72";
  if (tile.kind === "road") return "#a4a295";
  if (tile.obstacle) return tile.surface === "snow" ? "#71918c" : "#344d3e";
  if (tile.ramp) return tile.surface === "snow" ? "#bdc8cd" : "#ad9b75";
  if (tile.height > 0)
    return tile.surface === "snow"
      ? "#a8b9c7"
      : tile.surface === "sand"
        ? "#ac8260"
        : "#889079";
  return (
    {
      snow: "#d4dde0",
      ice: "#8dbccf",
      marsh: "#5e7160",
      sand: "#b4a080",
      concrete: "#808782",
    }[tile.surface] ||
    { grass: "#617250", dirt: "#887d64", rock: "#747d72" }[tile.kind] ||
    "#617250"
  );
}
