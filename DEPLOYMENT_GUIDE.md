# 🚀 Deployment Guide - Render

This guide will walk you through deploying your Weekend Destination app to Render, a modern cloud platform that offers free hosting for web applications.

## 📋 Prerequisites

1. **GitHub Account**: Your code must be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **API Keys**: Ensure you have your Google Maps Platform API keys ready

## 🎯 Quick Deploy (Recommended)

### Step 1: Prepare Your Repository

1. **Fork or push your code** to GitHub
2. **Ensure your repository structure** looks like this:
   ```
   Weekend Destination/
   ├── client/           # React frontend
   ├── server/           # Node.js backend
   ├── render.yaml       # Render configuration
   └── README.md
   ```

### Step 2: Deploy with Blueprint

1. **Go to Render Dashboard**:
   - Visit [render.com](https://render.com)
   - Sign in with your GitHub account

2. **Create Blueprint**:
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`

3. **Configure Environment Variables**:
   - Add your API keys in the environment variables section
   - See the "Environment Variables" section below

4. **Deploy**:
   - Click "Apply" to start the deployment
   - Render will build and deploy both services automatically

## 🔧 Manual Deployment

If you prefer to deploy services individually:

### Backend Deployment

1. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**:
   - **Name**: `weekender-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`

3. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   GOOGLE_PLACES_API_KEY=your_places_api_key
   GOOGLE_MAPS_API_KEY=your_maps_api_key
   GOOGLE_GEOCODING_API_KEY=your_geocoding_api_key
   OPENWEATHER_API_KEY=your_weather_api_key
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Note the generated URL (e.g., `https://weekender-backend.onrender.com`)

### Frontend Deployment

1. **Create Static Site**:
   - Click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure Build Settings**:
   - **Name**: `weekender-frontend`
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/build`

3. **Set Environment Variables**:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

4. **Deploy**:
   - Click "Create Static Site"
   - Your app will be available at the generated URL

## 🔑 Environment Variables

### Backend Variables

Set these in your Render backend service:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `10000` |
| `GOOGLE_PLACES_API_KEY` | Google Places API key | `AIza...` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | `AIza...` |
| `GOOGLE_GEOCODING_API_KEY` | Google Geocoding API key | `AIza...` |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key | `abc123...` |

### Frontend Variables

Set these in your Render frontend service:

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend service URL | `https://weekender-backend.onrender.com` |

## 🔍 Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check that all dependencies are in `package.json`
   - Ensure build commands are correct
   - Check Render logs for specific errors

2. **API Calls Fail**:
   - Verify `REACT_APP_API_URL` is set correctly
   - Check that backend is running and accessible
   - Ensure CORS is configured properly

3. **Environment Variables Not Working**:
   - Variables must be set in Render dashboard
   - Frontend variables must start with `REACT_APP_`
   - Redeploy after changing variables

### Debugging Steps

1. **Check Build Logs**:
   - Go to your service in Render dashboard
   - Click "Logs" tab
   - Look for error messages

2. **Test Backend Health**:
   - Visit `https://your-backend.onrender.com/health`
   - Should return status information

3. **Check Frontend Console**:
   - Open browser developer tools
   - Look for network errors or console errors

## 📊 Monitoring

### Render Dashboard Features

- **Automatic Deploys**: Deploy on every Git push
- **Build Logs**: Real-time build and deployment logs
- **Health Checks**: Automatic health monitoring
- **Metrics**: Performance and usage statistics

### Custom Domain (Optional)

1. **Add Custom Domain**:
   - Go to your service settings
   - Click "Custom Domains"
   - Add your domain name

2. **Configure DNS**:
   - Point your domain to Render's servers
   - Follow Render's DNS configuration guide

## 🔄 Updates and Maintenance

### Automatic Updates

- Render automatically redeploys when you push to your main branch
- No manual intervention required for updates

### Manual Updates

1. **Redeploy**:
   - Go to your service dashboard
   - Click "Manual Deploy"
   - Select branch to deploy

2. **Rollback**:
   - Go to "Deploys" tab
   - Click "Rollback" on previous deployment

## 💰 Costs

### Free Tier

- **Web Services**: 750 hours/month (enough for 24/7 operation)
- **Static Sites**: Unlimited
- **Bandwidth**: 100GB/month
- **Perfect for development and small projects**

### Paid Plans

- **Starter**: $7/month for additional resources
- **Standard**: $25/month for production workloads
- **Professional**: Custom pricing for enterprise needs

## 🎉 Success!

Once deployed, your app will be available at:
- **Frontend**: `https://your-frontend.onrender.com`
- **Backend**: `https://your-backend.onrender.com`

Share your app with family and friends! 🚀 