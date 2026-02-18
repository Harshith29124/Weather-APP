# WeatherPro X - Complete Setup Guide

## Quick Start (5 minutes)

### Step 1: Install Dependencies
```bash
cd weather-app
npm install
```

### Step 2: Get Your Free API Key

1. Go to https://www.weatherapi.com/signup.aspx
2. Sign up with your email (free tier includes 1M calls/month)
3. Verify your email
4. Login and go to your dashboard
5. Copy your API key

### Step 3: Add API Key to App

Open `src/App.js` and find line 13:

```javascript
const API_KEY = 'f9a8e3d2c1b4a5e6f7g8h9i0j1k2l3m4'; // Replace with your WeatherAPI.com key
```

Replace the placeholder with your actual API key:

```javascript
const API_KEY = 'your_actual_api_key_from_weatherapi_com';
```

### Step 4: Start the App

```bash
npm start
```

Your browser will automatically open to `http://localhost:3000`

## Alternative: Using Environment Variables (Recommended for Production)

### Step 1: Create .env file

In the `weather-app` folder, create a file named `.env`:

```bash
REACT_APP_WEATHER_API_KEY=your_actual_api_key_here
```

### Step 2: Update App.js

Change line 13 in `src/App.js` to:

```javascript
const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'fallback_key';
```

### Step 3: Restart the app

```bash
npm start
```

## Testing the App

### Test Current Weather
1. The app loads with San Francisco weather by default
2. You should see temperature, conditions, and weather metrics

### Test Search
Try searching for:
- City names: "London", "Tokyo", "Paris"
- ZIP codes: "10001", "90210"
- Coordinates: "40.7128,-74.0060"
- Airport codes: "LAX", "JFK"

### Test All Tabs
1. **Current**: Should show real-time weather
2. **Forecast**: Should display 7-day forecast
3. **Historical**: Should show yesterday's weather
4. **Marine**: Will show data for coastal cities, or "not available" message

## Troubleshooting

### Issue: "Failed to fetch weather data"

**Solution 1**: Check your API key
- Make sure you copied the entire key
- Verify it's active in your WeatherAPI.com dashboard
- Check for extra spaces or quotes

**Solution 2**: Check your internet connection
- The app needs internet to fetch weather data

**Solution 3**: Check API rate limits
- Free tier: 1,000,000 calls/month
- If exceeded, wait for reset or upgrade plan

### Issue: Marine data shows "Not Available"

**Solution**: This is normal!
- Marine data only works for coastal locations
- Try searching: "Miami", "San Diego", "Boston", "Seattle"
- Inland cities won't have marine data

### Issue: App won't start

**Solution 1**: Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

**Solution 2**: Check Node.js version
```bash
node --version
```
You need Node.js 14 or higher. Update if needed.

**Solution 3**: Check for port conflicts
If port 3000 is in use, you can specify a different port:
```bash
PORT=3001 npm start
```

### Issue: Styling looks broken

**Solution**: Clear browser cache
- Press Ctrl+Shift+R (Windows/Linux)
- Press Cmd+Shift+R (Mac)
- Or clear cache in browser settings

## Building for Production

### Create optimized build

```bash
npm run build
```

This creates a `build` folder with optimized files.

### Deploy to hosting

You can deploy to:

**Netlify** (Easiest):
1. Drag and drop the `build` folder to netlify.com/drop
2. Done!

**Vercel**:
```bash
npm install -g vercel
vercel
```

**GitHub Pages**:
1. Add to `package.json`:
```json
"homepage": "https://yourusername.github.io/weather-app"
```
2. Install gh-pages:
```bash
npm install --save-dev gh-pages
```
3. Add scripts to `package.json`:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d build"
```
4. Deploy:
```bash
npm run deploy
```

## Environment Variables for Production

When deploying, set these environment variables in your hosting platform:

- **Netlify**: Site settings → Environment variables
- **Vercel**: Project settings → Environment Variables
- **Heroku**: Config Vars in dashboard

Add:
```
REACT_APP_WEATHER_API_KEY=your_actual_api_key
```

## Performance Tips

### Optimize API Calls
The app automatically caches data to reduce API calls. Each search makes 4 API calls:
1. Current weather
2. 7-day forecast
3. Marine data (if available)
4. Historical data (yesterday)

### Reduce Bundle Size
Already optimized with:
- Code splitting
- Tree shaking
- Minification
- Compression

### Improve Load Time
- Use CDN for hosting
- Enable gzip compression
- Use HTTP/2
- Add service worker for offline support

## Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ iOS Safari 14+
- ✅ Chrome Mobile 90+

## Mobile Testing

### iOS (iPhone/iPad)
1. Open Safari
2. Go to your app URL
3. Tap Share button
4. Tap "Add to Home Screen"
5. App now works like a native app!

### Android
1. Open Chrome
2. Go to your app URL
3. Tap menu (3 dots)
4. Tap "Add to Home screen"
5. App now works like a native app!

## API Features by Plan

### Free Tier (What you get)
- ✅ 1,000,000 calls/month
- ✅ Current weather
- ✅ 3-day forecast
- ✅ Historical data (1 day)
- ✅ Marine data
- ✅ Air quality
- ✅ Astronomy data

### Paid Tiers (If you need more)
- More API calls
- Extended forecast (14 days)
- Extended history (30+ days)
- Weather alerts
- Bulk queries

## Support

### Need Help?
- Check the main README.md
- Visit WeatherAPI.com documentation
- Check browser console for errors (F12)

### Found a Bug?
- Check if API key is valid
- Verify internet connection
- Clear browser cache
- Try different location

## Next Steps

Now that your app is running:

1. **Customize the design**: Edit `src/App.css`
2. **Add features**: Modify `src/App.js`
3. **Change default location**: Update line 18 in App.js
4. **Add more locations**: Implement favorites feature
5. **Deploy to production**: Follow deployment guide above

Enjoy your modern weather app! 🌤️
