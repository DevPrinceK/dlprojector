# Release signing

The release workflow always builds Windows, macOS, and Linux installers. Signing is opt-in so forks and development releases can still build without paid certificates.

## Versioning

Create a semantic version tag such as `v0.1.8`. The workflow runs:

```powershell
npm run version:sync -- 0.1.8
```

This synchronizes `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` before packaging.

## Windows

Add these GitHub Actions secrets:

- `WINDOWS_CERTIFICATE`: base64 text of the exported code-signing `.pfx`.
- `WINDOWS_CERTIFICATE_PASSWORD`: the `.pfx` export password.
- `WINDOWS_CERTIFICATE_THUMBPRINT`: the certificate SHA-1 thumbprint without spaces.

Add the repository variable `ENABLE_WINDOWS_SIGNING=true`. The workflow imports the certificate into the runner's current-user certificate store and asks Tauri to sign and timestamp the installers.

Without these values, Windows installers still build but may trigger Microsoft SmartScreen warnings.

## macOS

Add these GitHub Actions secrets:

- `APPLE_CERTIFICATE`: base64 text of the Developer ID Application `.p12`.
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_PASSWORD`: an app-specific Apple password.
- `APPLE_TEAM_ID`

Add the repository variable `ENABLE_APPLE_SIGNING=true`. The workflow validates the certificate before building and lets Tauri sign and notarize the DMG.

Without these values, the workflow creates an ad-hoc signed DMG that macOS users may need to approve manually.
