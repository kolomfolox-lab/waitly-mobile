# Waitly Mobile App - Setup Guide for Physical Device

## Quick Start

Your app is now configured to work on your physical device with IP: **192.168.31.242**

### Step 1: Start Django Backend

```bash
cd d:\SaaS\waitly_backend
python manage.py runserver 0.0.0.0:8000
```

> **Important:** Use `0.0.0.0:8000` instead of just `8000` to allow connections from other devices on your network.

### Step 2: Start Expo App

```bash
cd d:\SaaS\waitly-mobile
npx expo start
```

### Step 3: Connect Your Phone

1. **Install Expo Go** app on your phone from App Store or Google Play
2. **Make sure your phone and computer are on the same WiFi network** (192.168.31.x)
3. Open Expo Go and scan the QR code shown in your terminal

### Step 4: Test the Connection

1. Login with a test user (create one in Django admin if needed)
2. Check if data loads from the backend

---

## Configuration Details

### Mobile App
- **API URL:** `http://192.168.31.242:8000/api`
- **File:** `d:\SaaS\waitly-mobile\src\api\client.js`

### Django Backend
- **ALLOWED_HOSTS:** Includes `192.168.31.242`
- **CORS_ALLOWED_ORIGINS:** Allows Expo dev server
- **File:** `d:\SaaS\waitly_backend\config\settings.py`

---

## Troubleshooting

### "Network request failed" error
1. Verify Django is running with `0.0.0.0:8000`
2. Check if both devices are on same WiFi
3. Try accessing `http://192.168.31.242:8000/api/docs` from your phone's browser

### "Connection refused"
1. Windows Firewall might be blocking port 8000
2. Add firewall rule:
   ```bash
   netsh advfirewall firewall add rule name="Django Dev Server" dir=in action=allow protocol=TCP localport=8000
   ```

### Different network?
If your IP changes (different WiFi), run `ipconfig` and update:
- `src/api/client.js` → change API_URL
- `config/settings.py` → change ALLOWED_HOSTS

---

## Testing Checklist

- [ ] Django server running on `0.0.0.0:8000`
- [ ] Expo app running
- [ ] Phone on same WiFi (192.168.31.x)
- [ ] QR code scanned in Expo Go
- [ ] Can login successfully
- [ ] Data loads from backend (orders, tables, shifts)
