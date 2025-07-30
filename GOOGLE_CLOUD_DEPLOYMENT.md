# Google Cloud Deployment Guide

## Quick Setup (Web Interface - Recommended)

### Prerequisites
1. Google Cloud account (free tier available)
2. Project created in Google Cloud Console

### Step 1: Enable Required Services

Go to [Google Cloud Console](https://console.cloud.google.com) and enable:
- Cloud Run API
- Container Registry API
- Cloud Build API

### Step 2: Deploy Backend

1. **Open Google Cloud Shell** (button in top-right of console)

2. **Clone your repository:**
```bash
git clone YOUR_GITHUB_REPO_URL
cd "Weekend Destination"
```

3. **Build and deploy backend:**
```bash
cd server
gcloud builds submit --tag gcr.io/PROJECT_ID/weekender-backend
gcloud run deploy weekender-backend \
  --image gcr.io/PROJECT_ID/weekender-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

4. **Set environment variables:**
```bash
gcloud run services update weekender-backend \
  --set-env-vars NODE_ENV=production \
  --set-env-vars GOOGLE_PLACES_API_KEY=your_api_key \
  --set-env-vars GOOGLE_MAPS_API_KEY=your_api_key \
  --set-env-vars GOOGLE_GEOCODING_API_KEY=your_api_key \
  --set-env-vars OPENWEATHER_API_KEY=your_api_key
```

5. **Note the backend URL** (you'll need it for frontend)

### Step 3: Deploy Frontend

1. **Update frontend API URL:**
```bash
cd ../client
export BACKEND_URL=$(gcloud run services describe weekender-backend --region=us-central1 --format='value(status.url)')
```

2. **Build and deploy frontend:**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/weekender-frontend
gcloud run deploy weekender-frontend \
  --image gcr.io/PROJECT_ID/weekender-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars REACT_APP_API_URL=$BACKEND_URL
```

### Step 4: Get Your URLs

```bash
echo "Backend URL:"
gcloud run services describe weekender-backend --region=us-central1 --format='value(status.url)'

echo "Frontend URL:"
gcloud run services describe weekender-frontend --region=us-central1 --format='value(status.url)'
```

## Alternative: Manual Docker Build

If you prefer to build locally:

### 1. Install Docker Desktop
Download from [docker.com](https://www.docker.com/products/docker-desktop)

### 2. Build Images Locally
```bash
# Build backend
cd server
docker build -t weekender-backend .

# Build frontend  
cd ../client
docker build -t weekender-frontend .
```

### 3. Push to Google Container Registry
```bash
# Tag images
docker tag weekender-backend gcr.io/PROJECT_ID/weekender-backend
docker tag weekender-frontend gcr.io/PROJECT_ID/weekender-frontend

# Push images
docker push gcr.io/PROJECT_ID/weekender-backend
docker push gcr.io/PROJECT_ID/weekender-frontend
```

## Environment Variables Needed

Replace these with your actual API keys:

- `GOOGLE_PLACES_API_KEY`: Your Google Places API key
- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key  
- `GOOGLE_GEOCODING_API_KEY`: Your Google Geocoding API key
- `OPENWEATHER_API_KEY`: Your OpenWeather API key

## Costs

- **Google Cloud Run**: Pay per request (very cheap)
- **Container Registry**: ~$0.10/GB per month
- **First 2 million requests per month**: FREE

## Troubleshooting

### Common Issues:
1. **Build fails**: Check Dockerfile syntax
2. **Container won't start**: Check port configuration (must be 8080)
3. **API errors**: Verify environment variables are set
4. **CORS issues**: Check backend CORS configuration

### Debug Commands:
```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=weekender-backend" --limit 50

# Check service status
gcloud run services describe weekender-backend --region=us-central1
```

## Success!

After deployment, you'll have:
- **Backend**: `https://weekender-backend-HASH-uc.a.run.app`
- **Frontend**: `https://weekender-frontend-HASH-uc.a.run.app`

Both will be:
- ✅ Automatically scaling
- ✅ HTTPS enabled
- ✅ Globally distributed
- ✅ Pay per use 