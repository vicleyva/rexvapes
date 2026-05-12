# Rexvapes Deployment Guide

## How Deployment Works

This project uses **GitHub Actions** (not gh-pages branch) to deploy.

- **Workflow file:** `.github/workflows/deploy.yml`
- **Trigger:** Push to `master` branch
- **URL:** https://vicleyva.github.io/rexvapes/

## Deployment Steps

```bash
git add .
git commit -m "your message"
git push origin master
```

The workflow automatically builds and deploys. Check status:
```bash
gh run list --limit 3
```

## Common Issue: package-lock.json Out of Sync

### Symptoms
- Workflow fails at "Install dependencies" step
- Error: `npm ci can only install packages when your package.json and package-lock.json are in sync`
- Error: `Missing: @some/package@version from lock file`

### Cause
When you install a new package locally (`npm install some-package`), it updates both:
- `package.json` (dependency added)
- `package-lock.json` (dependency tree updated)

If you commit `package.json` but not `package-lock.json`, or if the lock file gets corrupted, the CI fails.

### Fix
```bash
# Regenerate lock file from scratch
rm -rf node_modules package-lock.json
npm install

# Commit and push
git add package-lock.json
git commit -m "fix: Regenerate package-lock.json"
git push origin master
```

### Prevention
**ALWAYS commit package-lock.json when adding/removing packages:**
```bash
npm install some-package
git add package.json package-lock.json
git commit -m "feat: Add some-package"
git push origin master
```

## DO NOT USE

- `npm run deploy` - This pushes to gh-pages branch which is NOT used
- Changing GitHub Pages settings to "Deploy from branch" - Keep it on "GitHub Actions"

## Version Bumping

Version is defined in TWO files - update both:
- `src/components/Sidebar.jsx` - `APP_VERSION` constant
- `src/components/PublicLayout.jsx` - `APP_VERSION` constant
