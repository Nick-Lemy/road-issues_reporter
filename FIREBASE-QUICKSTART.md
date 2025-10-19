# Quick Start Guide - Firebase Integration

## What You Need

This app now uses Firebase for:

- **Authentication**: User login and registration
- **Database**: Storing and retrieving road issue reports
- **Real-time Updates**: Live synchronization across users
- **Auto-deletion**: Issues expire after a set duration

## Firebase Environment Variables Required

You need to create a `.env` file in the project root with these variables from your Firebase project:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Where to Get These Values

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select or Create Your Project**
3. **Project Settings** (click the gear icon)
4. **Scroll to "Your apps"** section
5. **Click the Web icon** (`</>`) if you haven't added a web app
6. **Copy the config values** from the `firebaseConfig` object

### Example Firebase Config Object

When you register your web app, you'll see something like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-12345.firebaseapp.com",
  projectId: "your-project-12345",
  storageBucket: "your-project-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};
```

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env
```

Then edit `.env` and fill in your Firebase values.

### 3. Enable Firebase Services

In Firebase Console:

#### A. Authentication

1. Go to **Build > Authentication**
2. Click **Get started**
3. Enable **Email/Password** sign-in method

#### B. Firestore Database

1. Go to **Build > Firestore Database**
2. Click **Create database**
3. Start in **production mode**
4. Choose your region
5. See `FIREBASE-SETUP.md` for security rules

### 4. Run the App

```bash
npm run dev
```

## First Time Using the App

1. **Sign Up**: Click the login icon in the header, then click "Sign Up"
2. **Create Account**: Enter your name, email, and password
3. **Report Issues**: You can now report road issues!

## Creating an Admin User

Regular users can only see issues. Admins can:

- See who posted each issue
- Delete any issue
- Access the admin panel

**To make a user admin:**

1. User signs up through the app
2. Go to Firebase Console > Firestore Database
3. Find the user in the `users` collection
4. Edit their document
5. Change `role` from `"user"` to `"admin"`

## Key Features

### For All Users

- Sign up/Login with email and password
- Report road issues with custom duration (1 hour to 1 week)
- View all active issues on the map
- See your own reported issues
- Issues automatically expire and get deleted

### For Admins Only

- Access admin panel from profile page (Shield icon)
- View all issues including expired ones
- See reporter name and email for each issue
- Manually delete any issue
- Bulk cleanup of expired issues

## Troubleshooting

**"Please sign in to report issues"**

- You must be logged in to report issues
- Click the login icon in the top right

**Issues not showing up**

- Make sure Firestore is enabled in Firebase Console
- Check browser console for errors
- Verify your `.env` file has correct values

**"Missing or insufficient permissions"**

- Make sure you've set up Firestore security rules (see FIREBASE-SETUP.md)
- Check that authentication is enabled

## Need More Help?

See the detailed setup guide: `FIREBASE-SETUP.md`
