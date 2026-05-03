# Waitly Mobile App - Quick Start

## 📱 Setup

```bash
cd waitly-mobile

# Install dependencies
npm install

# Start development server
npm start
```

## 🚀 Running the App

### Android
```bash
npm run android
```

### iOS (Mac only)
```bash
npm run ios
```

### Web
```bash
npm run web
```

## 📝 Features Implemented

✅ Login screen with phone number authentication
✅ Dashboard with shift management
✅ Table list view
✅ JWT token auto-refresh
✅ API integration with backend

## 🔧 Configuration

Edit `services/api.js` and change `BASE_URL` to your backend URL:

```javascript
const BASE_URL = 'https://your-backend-url.com';
```

## 📱 Test Credentials

Use the credentials from your seeded data:
- Phone: +998901234567
- Password: test123

## 🎯 Next Steps

1. Install Expo Go app on your phone
2. Scan QR code from `npm start`
3. Test login and features
4. Build production app with `eas build`

## 📚 Documentation

See `MOBILE_APP_GUIDE.md` for complete documentation.
# waitly-mobile
