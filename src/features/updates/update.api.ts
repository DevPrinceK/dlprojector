import packageJson from "../../../package.json";

const latestReleaseApi = "https://api.github.com/repos/DevPrinceK/dlprojector/releases/latest";

export interface UpdateStatus {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseUrl: string;
}

export async function checkForUpdates(): Promise<UpdateStatus> {
  const response = await fetch(latestReleaseApi, {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (!response.ok) {
    throw new Error(`Could not check for updates (${response.status}).`);
  }
  const release = (await response.json()) as { tag_name?: string; html_url?: string };
  const latestVersion = (release.tag_name || packageJson.version).replace(/^v/, "");
  return {
    currentVersion: packageJson.version,
    latestVersion,
    updateAvailable: compareVersions(latestVersion, packageJson.version) > 0,
    releaseUrl: release.html_url || "https://github.com/DevPrinceK/dlprojector/releases/latest"
  };
}

function compareVersions(left: string, right: string) {
  const a = left.split(".").map(Number);
  const b = right.split(".").map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] || 0) - (b[index] || 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
