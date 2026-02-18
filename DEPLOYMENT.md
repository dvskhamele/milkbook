# Deploy MilkRecord to Vercel

## Quick Deploy (Recommended)

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Navigate to the project directory**:
```bash
cd /Users/test/startups/milkrecord
```

3. **Login to Vercel**:
```bash
vercel login
```

4. **Deploy**:
```bash
vercel
```

5. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? (select your account)
   - Link to existing project? **N**
   - What's your project's name? **milkrecord**
   - In which directory is your code located? **./**
   - Want to override the settings? **N**

6. **Deploy to production**:
```bash
vercel --prod
```

### Option 2: Deploy via GitHub

1. **Create a GitHub repository** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit: MilkRecord PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/milkrecord.git
git push -u origin main
```

2. **Go to [vercel.com](https://vercel.com)**

3. **Click "Add New Project"**

4. **Import your GitHub repository**

5. **Configure project**:
   - Framework Preset: **Other**
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: (leave empty)

6. **Click "Deploy"**

7. **Your app will be live at**: `https://milkrecord.vercel.app`

## Post-Deployment Configuration

### 1. Update PWA Settings

After deployment, update the `manifest.json` with your production URL:

```json
{
  "name": "MilkRecord - Dairy Collection System",
  "short_name": "MilkRecord",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#f4f7fb",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Configure Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Click on "Settings" → "Domains"
3. Add your custom domain (e.g., `milkrecord.yourdomain.com`)
4. Update DNS records as instructed

### 3. Enable HTTPS (Automatic)

Vercel automatically provides HTTPS for all deployments. No configuration needed.

## Environment Variables (if needed)

If you need to add environment variables in the future:

1. Go to Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add variables as needed
4. Redeploy for changes to take effect

## Continuous Deployment

Once connected to GitHub, every push to the `main` branch will automatically deploy to production.

### Deployment Workflow:

```bash
# Make changes
git add .
git commit -m "Your commit message"
git push origin main

# Vercel will automatically deploy
```

## Preview Deployments

For pull requests or feature branches:

```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

Vercel will create a preview deployment with a unique URL.

## Monitoring & Analytics

1. **Deployment Logs**: Available in Vercel dashboard
2. **Analytics**: Enable Vercel Analytics in project settings
3. **Speed Insights**: Enable Vercel Speed Insights for performance monitoring

## Troubleshooting

### Issue: Service Worker not registering

**Solution**: Ensure the service worker path is correct in `index.html`:
```javascript
navigator.serviceWorker.register('/sw.js')
```

### Issue: PWA not installable

**Solution**: 
1. Ensure `manifest.json` is linked in `index.html`
2. Ensure HTTPS is enabled (automatic with Vercel)
3. Ensure service worker is registered

### Issue: Icons not loading

**Solution**: 
1. Create `icons/` directory
2. Add icon files (192x192.png, 512x512.png)
3. Update paths in `manifest.json`

## Production Checklist

- [ ] Deploy to Vercel
- [ ] Test all features in production
- [ ] Verify PWA installation works
- [ ] Test offline functionality
- [ ] Verify WhatsApp links work
- [ ] Test on mobile devices
- [ ] Configure custom domain (if needed)
- [ ] Enable analytics (optional)
- [ ] Set up monitoring

## Support

For Vercel-specific issues:
- Documentation: [vercel.com/docs](https://vercel.com/docs)
- Support: [vercel.com/support](https://vercel.com/support)

For MilkRecord-specific issues:
- Check the README.md in the project root
- Review the implementation documentation
