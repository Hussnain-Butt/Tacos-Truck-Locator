# Clerk OAuth Setup Guide for Expo

## Step-by-Step Configuration

### 1. Clerk Dashboard Setup

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **"User & Authentication"** → **"Social Connections"**
4. Enable **"Google"**

### 2. Redirect URLs Configuration

In your Clerk Dashboard under **"Paths"** or **"OAuth"** settings, add these URLs:

#### Development URLs (Expo Go):
```
exp://localhost:8081
exp://192.168.1.8:8081
```

#### Custom Scheme (for production):
```
tacotrucklocator://oauth-callback
```

### 3. Allowed Origins

Add these origins in Clerk Dashboard:
```
http://localhost:8081
http://192.168.1.8:8081
```

### 4. Enable OAuth in Your Expo App

Your `app.json` needs to include the custom scheme:

```json
{
  "expo": {
    "scheme": "tacotrucklocator",
    "ios": {
      "bundleIdentifier": "com.yourcompany.tacotrucklocator"
    },
    "android": {
      "package": "com.yourcompany.tacotrucklocator"
    }
  }
}
```

### 5. Google OAuth Implementation

The Google Sign-in button will work after:
1. ✅ Enabling Google in Clerk Dashboard
2. ✅ Adding redirect URLs (above)
3. ✅ Getting your Clerk Publishable Key
4. ✅ Adding key to `.env` file

### 6. Testing OAuth Flow

1. Make sure Expo server is running: `npx expo start -c`
2. Open app in Expo Go
3. Tap "Continue with Google"
4. You'll be redirected to Google sign-in
5. After authentication, you'll return to the app

### Important Notes

- **Expo Go Limitation**: OAuth with Expo Go can be tricky. For best results, consider building a custom development client:
  ```bash
  npx expo install expo-dev-client
  npx expo run:android  # or run:ios
  ```

- **Alternative**: For quick testing, use email/password authentication which works perfectly right now!

### Current Status

✅ Email/Password Login - **Working**
⚠️ Google OAuth - **Requires Clerk Dashboard configuration** (follow steps above)

Once you add the redirect URLs in Clerk Dashboard and enable Google, the OAuth flow will work automatically!
