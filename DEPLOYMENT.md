# Deploy Nexs-Admin to GitHub Pages

This guide explains how to deploy the Nexs-Admin dashboard to GitHub Pages at `admin.nexspiresolutions.co.in`.

## Quick Deploy

```bash
npm run deploy
```

This command will:
1. Build the production version
2. Deploy to GitHub Pages automatically

## Manual Setup (First Time Only)

### 1. Enable GitHub Pages

1. Go to your GitHub repository: `https://github.com/amankumarsahani/NexSpireSolutions`
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - **Source**: Deploy from a branch
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
4. Click **Save**

### 2. Configure Custom Domain

In the same **Pages** settings:

1. Under **Custom domain**, enter: `admin.nexspiresolutions.co.in`
2. Click **Save**
3. Wait for DNS check to complete
4. Enable **Enforce HTTPS** (after DNS propagates)

### 3. Configure DNS in Cloudflare

Go to Cloudflare Dashboard → DNS → Add record:

```
Type: CNAME
Name: admin
Target: amankumarsahani.github.io
Proxy status: DNS only (gray cloud)
TTL: Auto
```

This is the same pattern as your nexs-agency deployment!

## Deployment Workflow

### Option 1: Automatic (Recommended)

Every push to `master` branch automatically triggers GitHub Actions to build and deploy.

```bash
# Make your changes
git add .
git commit -m "Update dashboard"
git push origin master
```

GitHub Actions will:
- Build the project with production settings
- Deploy to GitHub Pages
- Your changes will be live in 2-5 minutes

### Option 2: Manual Deploy

Use the deploy script anytime:

```bash
npm run deploy
```

This creates a `gh-pages` branch and pushes the built files.

## Verify Deployment

1. **Check GitHub Actions**: 
   - Go to repository → **Actions** tab
   - See the latest workflow run
   - Ensure it completed successfully

2. **Visit the Site**:
   - Temporary URL: `https://amankumarsahani.github.io/nexs-admin/`
   - Custom domain: `https://admin.nexspiresolutions.co.in` (after DNS setup)

3. **Test Functionality**:
   - Login page loads
   - API calls work with backend
   - All routes function correctly

## Important Notes

### Base Path

The app is configured with base path `/nexs-admin/` in `vite.config.js`. This is required for GitHub Pages subdirectory deployment.

### Environment Variables

Production API URL is set in the GitHub Actions workflow:
```yaml
VITE_API_URL: https://api.nexspiresolutions.co.in/api
```

### CORS Configuration

Backend already includes admin subdomain in CORS:
```javascript
'https://admin.nexspiresolutions.co.in'
```

## Troubleshooting

### Build Fails in GitHub Actions

- Check the Actions log for errors
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

### 404 on Routes

- Ensure `base: '/nexs-admin/'` is in `vite.config.js`
- Check that routes in React Router match the base path

### Custom Domain Not Working

- Verify CNAME record in Cloudflare DNS
- Check that `public/CNAME` file contains correct domain
- Wait up to 24 hours for DNS propagation
- Ensure DNS is set to "DNS only" (gray cloud), not proxied

### API Calls Fail

- Check backend CORS includes admin subdomain
- Verify `VITE_API_URL` in production build
- Check browser console for CORS errors

## Comparison: GitHub Pages vs Cloudflare Pages

You're now using GitHub Pages (same as nexs-agency):

✅ **Benefits**:
- Familiar workflow
- Same deployment process as nexs-agency
- Free hosting
- Automatic HTTPS
- Simple DNS setup with CNAME

**How it works**:
```
Push to GitHub → GitHub Actions builds → Deploys to GitHub Pages → Live!
```

Same as nexs-agency, but with automatic builds via GitHub Actions!
