# Weekend Destination - Family & Pet-Friendly Outing Planner

A beautiful, Pinterest-inspired web application that helps families plan perfect weekend outings with their pets. Built with React, Node.js, and powered by Google Maps Platform.

## 🌟 Features

- **Smart Recommendations**: AI-powered destination suggestions based on family size, pet preferences, and travel time
- **Pinterest-Inspired UI**: Beautiful masonry grid layout with progressive disclosure
- **Real-Time Data**: Live Google Maps integration for ratings, photos, and nearby attractions
- **Family Insights**: LLM-generated inspirational itineraries based on real reviews
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Save & Share**: Save favorite destinations and share with family

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "Weekend Destination"
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cd server
   cp .env.template .env
   # Edit .env with your API keys
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5002

## 🌐 Deployment

### Deploy to Render

This project is configured for easy deployment to Render using the `render.yaml` file.

#### Option 1: One-Click Deploy (Recommended)

1. **Fork this repository** to your GitHub account
2. **Connect to Render**:
   - Go to [render.com](https://render.com)
   - Sign up/Login with your GitHub account
   - Click "New +" → "Blueprint"
   - Connect your forked repository
   - Render will automatically detect the `render.yaml` and deploy both services

#### Option 2: Manual Deployment

1. **Deploy Backend**:
   - Create a new Web Service
   - Connect your GitHub repository
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Add environment variables (see below)

2. **Deploy Frontend**:
   - Create a new Static Site
   - Connect your GitHub repository
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/build`
   - Add environment variable: `REACT_APP_API_URL` = your backend URL

#### Environment Variables

Set these in your Render dashboard:

**Backend Environment Variables:**
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `GOOGLE_PLACES_API_KEY`: Your Google Places API key
- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key
- `GOOGLE_GEOCODING_API_KEY`: Your Google Geocoding API key
- `OPENWEATHER_API_KEY`: Your OpenWeatherMap API key
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Your Firebase private key
- `FIREBASE_CLIENT_EMAIL`: Your Firebase client email

**Frontend Environment Variables:**
- `REACT_APP_API_URL`: Your backend service URL (e.g., `https://your-backend.onrender.com`)

## 🔧 API Setup

See [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md) for detailed instructions on setting up Google Maps Platform APIs.

## 📱 Usage

1. **Select your home city** from the Bay Area dropdown
2. **Configure your family**:
   - Add adults and kids
   - Check if you have a dog
   - Set your travel time budget
   - Choose preferred activities
3. **Generate recommendations** and explore beautiful destinations
4. **Save favorites** and share with family
5. **Load more** recommendations as needed

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, CSS3
- **Backend**: Node.js, Express.js
- **APIs**: Google Maps Platform, OpenWeatherMap
- **Deployment**: Render
- **Styling**: Custom CSS with Pinterest-inspired design system

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions, please open an issue on GitHub. 