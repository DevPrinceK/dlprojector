import fs from "node:fs";
import path from "node:path";

const requested = process.argv[2]?.replace(/^v/, "");
if (!requested || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(requested)) {
  console.error("Usage: node scripts/sync-version.mjs <major.minor.patch>");
  process.exit(1);
}

const root = process.cwd();
updateJson("package.json", (value) => ({ ...value, version: requested }));
updateJson("package-lock.json", (value) => ({
  ...value,
  version: requested,
  packages: { ...value.packages, "": { ...value.packages?.[""], version: requested } }
}));
updateJson("src-tauri/tauri.conf.json", (value) => ({ ...value, version: requested }));

const cargoPath = path.join(root, "src-tauri", "Cargo.toml");
const cargo = fs.readFileSync(cargoPath, "utf8");
fs.writeFileSync(
  cargoPath,
  cargo.replace(/(\[package\][\s\S]*?\nversion\s*=\s*")[^"]+(")/, `$1${requested}$2`)
);

console.log(`Synchronized DL Projector version ${requested}.`);

function updateJson(relativePath, transform) {
  const filePath = path.join(root, relativePath);
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  fs.writeFileSync(filePath, `${JSON.stringify(transform(value), null, 2)}\n`);
}
