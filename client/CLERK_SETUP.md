# Clerk Configuration for Taco Truck Locator

## Environment Variables

Create a `.env` file in the root directory with your Clerk publishable key:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

## Getting Your Clerk Keys

1. Go to https://clerk.com and sign up/login
2. Create a new application
3. Go to API Keys section
4. Copy your Publishable Key
5. Add it to `.env` file

## OAuth Configuration

### Google OAuth Setup

1. In Clerk Dashboard, go to "User & Authentication" > "Social Connections"
2. Enable "Google"
3. Clerk will automatically handle the OAuth flow
4. In Expo, run: `npx expo install expo-auth-session expo-crypto`

### Required Clerk Settings

- Enable Email/Password authentication
- Enable Google OAuth
- Configure redirect URLs in Clerk dashboard
- Set up user metadata for vendor/customer role

## Next Steps

After getting your Clerk Publishable Key:
1. Add it to `.env` file
2. Run `npx expo start -c` to restart with new env vars
3. Test login/signup flows
4. Test Google OAuth
