# Firebase Setup Guide

This guide explains how to set up Firebase for the Road Issues Reporter app with authentication, Firestore database, and admin functionality.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "road-issues-reporter")
4. Follow the setup wizard (you can disable Google Analytics if not needed)

## 2. Set Up Firebase Authentication

1. In the Firebase Console, go to **Build > Authentication**
2. Click "Get started"
3. Go to the **Sign-in method** tab
4. Enable **Email/Password** authentication
5. Click "Save"

## 3. Set Up Firestore Database

1. In the Firebase Console, go to **Build > Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we'll add rules next)
4. Select a location closest to your users
5. Click "Enable"

### Configure Firestore Security Rules

Go to the **Rules** tab and replace the default rules with:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Issues collection
    match /issues/{issueId} {
      // Anyone authenticated can read active issues
      allow read: if request.auth != null;

      // Only authenticated users can create issues
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.userEmail == request.auth.token.email;

      // Users can update their own issues
      allow update: if request.auth != null
                    && resource.data.userId == request.auth.uid;

      // Only admins can delete any issue, users can delete their own
      allow delete: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
  }
}
```

Click "Publish" to save the rules.

### Create Firestore Indexes

Go to the **Indexes** tab and create these composite indexes:

1. **Index for active issues:**

   - Collection: `issues`
   - Fields:
     - `expiresAt` (Ascending)
     - `createdAt` (Descending)

2. **Index for user issues:**
   - Collection: `issues`
   - Fields:
     - `userId` (Ascending)
     - `createdAt` (Descending)

> **Note:** Firebase will automatically prompt you to create indexes when you run queries that need them. You can also create them from those prompts.

## 4. Get Your Firebase Configuration

1. In Firebase Console, go to **Project settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Road Issues Web App")
5. Copy the Firebase configuration object

It will look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123...",
};
```

## 5. Configure Your App

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase configuration in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123...
   ```

## 6. Create an Admin User

By default, all users are created with the `user` role. To create an admin:

### Option 1: Manual Update via Firebase Console

1. Sign up a user through your app
2. Go to **Firestore Database** in Firebase Console
3. Navigate to the `users` collection
4. Find the user document you want to make admin
5. Edit the document and change `role` from `"user"` to `"admin"`
6. Save

### Option 2: Using Firebase Admin SDK (Server-side)

Create a script or Cloud Function to promote users:

```javascript
const admin = require("firebase-admin");
admin.initializeApp();

async function makeAdmin(userEmail) {
  const usersRef = admin.firestore().collection("users");
  const snapshot = await usersRef.where("email", "==", userEmail).get();

  if (snapshot.empty) {
    console.log("User not found");
    return;
  }

  snapshot.forEach((doc) => {
    doc.ref.update({ role: "admin" });
    console.log(`User ${userEmail} is now an admin`);
  });
}

// Usage
makeAdmin("admin@example.com");
```

## 7. Install Dependencies and Run

1. Install npm packages:

   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## Features Implemented

### User Features

- ✅ Email/password authentication
- ✅ Report road issues with location and duration
- ✅ View all active issues on the map
- ✅ Issues auto-delete after specified duration (1 hour to 1 week)
- ✅ Real-time updates when issues are added/removed
- ✅ User profile with statistics

### Admin Features

- ✅ Admin panel accessible from profile page
- ✅ View all issues (including expired ones)
- ✅ See who posted each issue (email and name)
- ✅ Delete any issue manually
- ✅ Bulk cleanup of expired issues
- ✅ Filter issues by status (all/active/expired)

### Technical Features

- ✅ Firebase Authentication
- ✅ Cloud Firestore for data storage
- ✅ Real-time data synchronization
- ✅ Automatic cleanup service (runs every hour)
- ✅ Secure Firestore rules
- ✅ Role-based access control

## Issue Duration

When reporting an issue, users can select a duration:

- 1 hour
- 3 hours
- 6 hours
- 12 hours
- 24 hours (1 day) - **default**
- 48 hours (2 days)
- 72 hours (3 days)
- 168 hours (1 week)

Issues automatically expire and are cleaned up after their duration.

## Privacy

- Regular users **cannot** see who posted an issue
- Only **admins** can see the reporter's name and email
- User email addresses are stored securely in Firebase Auth

## Security Notes

1. Never commit your `.env` file to version control
2. The `.env.example` file is safe to commit (no actual credentials)
3. Firestore security rules ensure data privacy
4. Only admins can view user information for issues

## Troubleshooting

### "Missing or insufficient permissions" error

- Check your Firestore security rules are correctly configured
- Make sure the user is authenticated
- Verify the user has the correct role for the operation

### Issues not appearing

- Check the Firebase Console > Firestore to see if data is being saved
- Look at browser console for errors
- Ensure indexes are created in Firestore

### Auto-cleanup not working

- The cleanup service runs every hour
- Check browser console for cleanup logs
- Manually trigger cleanup from Admin Panel

## Support

For Firebase-specific help:

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
