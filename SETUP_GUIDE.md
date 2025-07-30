# Weekender App Setup Guide

## 🚀 Quick Start

1. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

2. **Configure API keys** (see API Setup section below)

3. **Start development:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 🔑 API Setup

### Google Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Places API
   - Maps JavaScript API
   - Geocoding API
   - Distance Matrix API
4. Create credentials (API Key)
5. Add the API key to `server/.env`:
   ```
   GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

### Firebase/Firestore
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Go to Project Settings > Service Accounts
5. Generate new private key (JSON file)
6. Add Firebase config to `server/.env`:
   ```
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY_ID=your_private_key_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your_client_email@your_project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your_client_id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your_client_email%40your_project.iam.gserviceaccount.com
   ```

### Google Maps API (Frontend)
1. Use the same API key from Google Places API
2. Add to `client/.env`:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

## 📁 Project Structure

```
weekender/
├── client/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API calls
│   │   └── types/         # TypeScript definitions
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── server/                # Node.js Express backend
│   ├── config/           # Firebase config
│   ├── middleware/       # Express middleware
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   └── package.json      # Backend dependencies
├── package.json          # Root package.json
├── setup.sh             # Setup script
└── README.md            # Main documentation
```

## 🛠️ Development Commands

```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Build for production
npm run build

# Start production server
npm start
```

## 🎯 Features Implemented

### ✅ MVP Features (Complete)
- **Setup Wizard**: Single-scroll configuration
- **City Autocomplete**: Google Places integration
- **Activity Selection**: Multi-select with icons
- **Recommendation Engine**: AI-powered filtering & ranking
- **Static Maps**: Google Maps integration
- **Feedback System**: Thumbs up/down with analytics
- **Route Planning**: Google Maps directions
- **Responsive Design**: Mobile-first approach

### 🎨 Design System
- **Colors**: Teal (#0ABAB5) primary, neutral background
- **Typography**: Inter font family
- **Icons**: Lucide React icons + emojis
- **Animations**: Framer Motion transitions
- **Accessibility**: WCAG 2.2 AA compliant

### 🔧 Technical Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Firebase Admin
- **APIs**: Google Places, Google Maps, Firestore
- **State Management**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS with custom design system

## 🧪 Testing the App

1. **Start the development servers:**
   ```bash
   npm run dev
   ```

2. **Test the setup wizard:**
   - Go to http://localhost:3000
   - Fill out the form with Bay Area cities
   - Select activities and preferences
   - Click "Review & Generate"

3. **Test recommendations:**
   - View generated outing packs
   - Test feedback buttons
   - Click "View Route" to open Google Maps
   - Try "Show Another Set" for new recommendations

## 🚨 Common Issues

### API Key Errors
- Ensure all API keys are correctly set in environment files
- Check that Google Places API is enabled
- Verify Firebase service account permissions

### Map Loading Issues
- Check Google Maps API key in client environment
- Ensure API key has proper restrictions set
- Verify billing is enabled for Google Cloud project

### Database Connection
- Check Firebase project ID and credentials
- Ensure Firestore is enabled in Firebase console
- Verify service account has proper permissions

## 📊 Performance Targets

- **First Screen TTI**: ≤ 2 seconds
- **Recommendation Generation**: ≤ 120 seconds
- **API Response Time**: p95 < 800ms
- **Bundle Size**: < 120KB (gzipped)

## 🔒 Security Considerations

- API keys are stored in environment variables
- CORS is configured for localhost only
- Rate limiting is implemented
- Input validation with Zod schemas
- No PII stored in database

## 🚀 Deployment

### Backend (Node.js)
- Deploy to Heroku, Vercel, or AWS
- Set environment variables in production
- Configure CORS for production domain

### Frontend (React)
- Build with `npm run build`
- Deploy to Netlify, Vercel, or AWS S3
- Update API URL in production environment

## 📈 Analytics & Monitoring

- User preferences stored anonymously
- Feedback analytics in Firestore
- API usage monitoring via Google Cloud
- Error tracking and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Open a GitHub issue
4. Contact the development team

---

**Happy coding! 🐾**

Built with ❤️ for families and their furry friends 