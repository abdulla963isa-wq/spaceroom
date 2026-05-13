# SpaceRoom

A full-stack space booking platform consisting of a **React Native mobile app** for customers and a **Next.js web dashboard** for admins and venue owners — all backed by Firebase.

---

## Project Structure

```
spaceroom/
├── admin/               # Next.js web dashboard (Admin & Owner portals)
│   ├── src/
│   │   ├── app/         # Next.js App Router pages
│   │   │   ├── admin/   # Admin portal pages
│   │   │   └── owner/   # Owner portal pages
│   │   ├── components/  # Shared UI components
│   │   ├── context/     # Auth context
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Firebase, Firestore helpers, utils
│   │   └── types/       # TypeScript types
├── components/          # Shared React Native components
├── constants/           # Colors, constants
├── context/             # Auth, Favourites context providers
├── navigation/          # React Navigation setup (AppNavigator)
├── screens/             # All app screens
│   ├── Auth/            # Login, Register, Forgot Password
│   ├── homeScreen.tsx
│   ├── SpaceDetailsScreen.tsx
│   ├── BookingScreen.tsx
│   ├── BookingSuccessScreen.tsx
│   ├── MyBookingsScreen.tsx
│   ├── FavouriteScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── SettingScreen.tsx
│   └── personalDetails.tsx
├── types/               # Shared TypeScript types
└── utils/               # Helper functions
```

---

## Tech Stack

### Mobile App
| Layer | Technology |
|---|---|
| Framework | React Native 0.84.1 |
| Language | TypeScript |
| Navigation | React Navigation 7 (Stack + Bottom Tabs) |
| Backend | Firebase (Auth + Firestore) |
| Safe Area | react-native-safe-area-context |
| Gestures | react-native-gesture-handler |
| Location | react-native-geolocation-service |

### Web Dashboard (`admin/`)
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Firebase Firestore |
| Toasts | react-hot-toast |
| Icons | lucide-react |
| Charts | recharts |

---

## Firebase Collections

| Collection | Description |
|---|---|
| `users` | User profiles with `role` field (`customer`, `owner`, `admin`) |
| `venues` | Venue documents with `ownerId`, categories, images |
| `spaces` | Space listings linked to venues via `venueId` |
| `bookings` | Booking records with `status`, `reservedSlots`, `total` |
| `notifications` | In-app notifications with `receiverRole` / `receiverId` |
| `pendingChanges` | Owner edit/create requests awaiting admin approval |
| `favourites` | Per-user favourite spaces |

---

## Getting Started

### Prerequisites

- Node.js >= 22.11.0
- Android Studio / Xcode (for mobile)
- A Firebase project with Firestore and Authentication enabled

### 1. Clone & install dependencies

```sh
# Mobile app (root)
npm install

# Web dashboard
cd admin && npm install
```

### 2. Firebase configuration

**Mobile app** — add your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) to the appropriate native folders.

**Web dashboard** — create `admin/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 3. Firestore Security Rules

Apply the following rules in **Firebase Console → Firestore Database → Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isOwnerRole() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }

    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow write: if isSignedIn() && (request.auth.uid == userId || isAdmin());
    }

    match /venues/{venueId} {
      allow read: if isSignedIn();
      allow create: if isAdmin() || isOwnerRole();
      allow update, delete: if isAdmin() ||
        (isOwnerRole() && resource.data.ownerId == request.auth.uid);
    }

    match /spaces/{spaceId} {
      allow read: if isSignedIn();
      allow create: if isAdmin() || isOwnerRole();
      allow update, delete: if isAdmin() ||
        (isOwnerRole() && resource.data.ownerId == request.auth.uid);
    }

    match /bookings/{bookingId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isAdmin() ||
        (isOwnerRole() && resource.data.ownerId == request.auth.uid) ||
        (isSignedIn() && resource.data.userId == request.auth.uid);
      allow delete: if isAdmin();
    }

    match /notifications/{notifId} {
      allow get: if isSignedIn();
      allow list: if isAdmin() ||
        (isSignedIn() && resource.data.receiverId == request.auth.uid);
      allow create: if isSignedIn();
      allow update: if isAdmin() ||
        (isSignedIn() && resource.data.receiverId == request.auth.uid);
      allow delete: if isAdmin();
    }

    match /pendingChanges/{changeId} {
      allow read: if isAdmin() ||
        (isOwnerRole() && resource.data.ownerId == request.auth.uid);
      allow create: if isAdmin() || isOwnerRole();
      allow update, delete: if isAdmin();
    }

    match /favourites/{userId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
  }
}
```

---

## Running the App

### Mobile (React Native)

```sh
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (install pods first)
bundle install
bundle exec pod install
npm run ios
```

### Web Dashboard

```sh
cd admin
npm run dev     # Development server on http://localhost:3000
npm run build   # Production build
npm start       # Start production server
```

---

## Features

### Customer Mobile App
- Browse venues and spaces with real-time availability
- Slot-based booking with time selection
- Live availability tracking (fully booked spaces dimmed automatically)
- Booking history with status tracking
- Favourites list
- Profile and personal details management
- Settings (notifications, privacy, appearance)

### Owner Web Dashboard (`/owner`)
- Real-time new booking popup alerts
- Venue and space management (edits go through admin approval)
- Booking calendar with slot blocking
- Analytics (revenue, bookings over time)
- Notification centre

### Admin Web Dashboard (`/admin`)
- Overview stats (users, venues, spaces, bookings, revenue)
- User, venue, space, and booking management
- Pending change approval queue (venue/space edit requests from owners)
- Real-time new booking popup alerts
- Notification centre
- Analytics charts
