# Publishing Guide

## Quick Start

```bash
# Local
npm run publish:dry  # test first
npm run publish      # publish (handles auth automatically)

# CI/CD
npm version patch && git push --tags
```

---

## Prerequisites

Update version in `package.json` following [semantic versioning](https://semver.org/).

> The publish script automatically runs build, lint, and test. You only need to run these manually for debugging.

---

## Local Publishing

**Step 1: Test with Dry-run**

```bash
npm run publish:dry
```

This will:
- ✓ Check authentication
- ✓ Show what would be built, linted, tested, and published
- ✗ Not actually publish to npm

**Step 2: Publish**

```bash
npm run publish
```

The script will:
1. **Check authentication** - If not logged in, it will prompt you to choose:
   - **Interactive Login** (persists across sessions): Runs `npm login` for you
   - **Environment Variable** (for automation): Set `NPM_TOKEN=your_token_here`
2. Build the package
3. Run linter
4. Run tests
5. Publish to npm with `--access public`

**Two-Factor Authentication (2FA)**

npm requires 2FA for publishing packages. The process depends on your 2FA method:

**Security Key (YubiKey, etc.)**
```bash
npm run publish
```
npm will prompt you to tap your security key during the publish process. No additional flags needed.

**Authenticator App (Google Authenticator, Authy, etc.)**
```bash
npm run publish -- --otp=123456
```
Replace `123456` with the 6-digit code from your authenticator app.

> [!NOTE]
> If you don't have 2FA enabled yet, run `npm profile enable-2fa auth-and-writes` to set it up.

---

## CI/CD Publishing

Publishing is automated via GitHub Actions on version tags.

**Step 1: Update Version**

```bash
npm version patch  # bug fixes
npm version minor  # new features
npm version major  # breaking changes
```

**Step 2: Push Tag**

```bash
git push origin main --tags
```

**Step 3: Monitor**

[View workflow runs →](https://github.com/dunika/result-try/actions)

---

## Troubleshooting

### Authentication Failed

**Local:**
- Check: `npm whoami`
- Login: `npm login`
- Or set: `NPM_TOKEN` environment variable

**CI:**
- Set `NPM_TOKEN` secret in: Repository → Settings → Secrets and variables → Actions

### Two-Factor Authentication Required

If you see: `Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages`

**Solution:** Use the `--otp` flag with your authenticator code:
```bash
npm run publish -- --otp=123456
```

> [!IMPORTANT]
> Don't create a token with "bypass 2FA" - it's less secure. Just use the OTP code from your authenticator app.

### Build/Lint/Test Failures

```bash
npm run build
npm run lint
npm run test
```

### Version Already Published

- Update version in `package.json`
- Check published versions: [npmjs.com/package/result-try](https://www.npmjs.com/package/result-try)

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run publish` | Full publish pipeline (auth → build → lint → test → publish) |
| `npm run publish:dry` | Dry-run mode (test without publishing) |
| `npm run build` | Build the package only |
| `npm run lint` | Run linter only |
| `npm run test` | Run tests only |

## Checklist

- [ ] Version updated
- [ ] CHANGELOG updated (if applicable)
- [ ] README updated (if applicable)
- [ ] Dry-run successful
- [ ] Ready to publish
