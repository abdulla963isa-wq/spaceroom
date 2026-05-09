# SpaceRoom — Complete Project Overview

---

## 1. Project Summary

**SpaceRoom** is a workspace booking platform built for the Bahraini market. It allows users to discover, browse, and book workspaces (meeting rooms, event halls, studios, coworking desks, offices, etc.) at real venues in Bahrain. The platform has two surfaces: a **React Native mobile app** used by customers to browse and book spaces, and a **Next.js web dashboard** used by administrators and venue owners to manage everything.

The project is a **monorepo** — both apps live in the same Git repository:
- `c:\Projects\spaceroom\` — root, contains the React Native mobile app
- `c:\Projects\spaceroom\admin\` — subfolder, contains the Next.js admin/owner web dashboard

Both apps share the same **Firebase backend** (Firestore, Firebase Authentication, Firebase Storage).

---

## 2. Tech Stack

### Mobile App (Customer-Facing)
| Layer | Technology |
|---|---|
| Framework | React Native (bare workflow) |
| Language | TypeScript |
| Navigation | React Navigation (Stack + Bottom Tabs) |
| Auth | @react-native-firebase/auth |
| Database | @react-native-firebase/firestore |
| Storage | Local assets (bundled images) |
| Location | react-native-geolocation-service |
| Async Storage | @react-native-async-storage/async-storage |

### Web Dashboard (Admin & Owner)
| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.5 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Firebase Web SDK v10 (firebase/auth) |
| Database | Firebase Web SDK v10 (firebase/firestore) |
| Image Upload | Cloudinary (unsigned upload API) |
| Charts | Recharts 2.x |
| Icons | Lucide React |
| Notifications | react-hot-toast |
| Date Utilities | date-fns |
| UI Utils | clsx, tailwind-merge |

### Backend / Infrastructure
| Service | Purpose |
|---|---|
| Firebase Authentication | User identity for both mobile and web |
| Cloud Firestore | Primary database (NoSQL, real-time) |
| Cloudinary | Image storage for venue/space photos uploaded via dashboard |
| Firebase (mobile images) | Mobile app uses bundled local assets |

---

## 3. Repository Structure

```
spaceroom/                          ← React Native mobile app (root)
├── App.tsx                         ← Entry point, renders AppNavigator
├── package.json                    ← Mobile dependencies
├── .gitignore                      ← Ignores admin/.next, admin/node_modules, etc.
│
├── assets/
│   └── images/                     ← Bundled venue/space images (diwan.jpg, savoy.jpg, etc.)
│
├── screens/
│   ├── Auth/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── ForgotPasswordScreen.tsx
│   ├── homeScreen.tsx
│   ├── SpaceDetailsScreen.tsx
│   ├── BookingScreen.tsx
│   ├── BookingSuccessScreen.tsx
│   ├── MyBookingsScreen.tsx
│   ├── CalendarScreen.tsx
│   ├── FavouriteScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── SettingScreen.tsx
│   └── personalDetails.tsx
│
├── navigation/                     ← React Navigation setup
├── lib/                            ← Firebase config, Firestore helpers
├── types/                          ← Shared TypeScript types
│
└── admin/                          ← Next.js web dashboard
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── .env.local                  ← Firebase + Cloudinary env vars
    │
    ├── public/
    │   └── images/                 ← Copies of mobile images served by Next.js
    │       ├── diwan.jpg
    │       ├── savoy.jpg
    │       ├── aurora_savoy.jpg
    │       ├── board_room_diwan.png
    │       ├── day_office_diwan.png
    │       ├── day_pass_diwan.jpeg
    │       ├── event_space_diwan.jpg
    │       ├── lumainia_savoy.jpg
    │       ├── Meeting_room_diwan.jpg
    │       └── reef_graden_pool_deck_savoy.jpg
    │
    └── src/
        ├── app/
        │   ├── layout.tsx                  ← Root layout (AuthProvider, Toaster)
        │   ├── page.tsx                    ← Root redirect (→ /login or /admin or /owner)
        │   ├── login/page.tsx              ← Login page (admin & owner)
        │   ├── admin/
        │   │   ├── layout.tsx              ← Admin sidebar layout
        │   │   ├── page.tsx                ← Admin dashboard
        │   │   ├── bookings/page.tsx
        │   │   ├── venues/page.tsx
        │   │   ├── spaces/page.tsx
        │   │   ├── users/page.tsx
        │   │   ├── notifications/page.tsx
        │   │   ├── analytics/page.tsx
        │   │   └── settings/page.tsx
        │   └── owner/
        │       ├── layout.tsx              ← Owner sidebar layout
        │       ├── page.tsx                ← Owner dashboard
        │       ├── venues/page.tsx
        │       ├── spaces/page.tsx
        │       ├── bookings/page.tsx
        │       ├── analytics/page.tsx
        │       ├── notifications/page.tsx
        │       └── settings/page.tsx
        │
        ├── components/
        │   ├── layout/
        │   │   ├── Header.tsx
        │   │   └── Sidebar.tsx
        │   ├── ui/
        │   │   ├── Badge.tsx
        │   │   ├── DataTable.tsx
        │   │   ├── LoadingSpinner.tsx
        │   │   ├── Modal.tsx
        │   │   ├── ConfirmModal.tsx
        │   │   ├── Pagination.tsx
        │   │   ├── StatCard.tsx
        │   │   ├── Toggle.tsx              ← Shared toggle switch component
        │   │   └── PasswordInput.tsx       ← Password input with show/hide toggle
        │   ├── forms/
        │   │   ├── VenueForm.tsx           ← Create/edit venue with Cloudinary upload
        │   │   └── SpaceForm.tsx           ← Create/edit space with Cloudinary upload
        │   └── charts/
        │       ├── BookingChart.tsx        ← Daily bookings line chart (Recharts)
        │       ├── RevenueChart.tsx        ← Monthly revenue bar chart (Recharts)
        │       ├── SpacePopularityChart.tsx
        │       └── PeakHoursChart.tsx
        │
        ├── context/
        │   └── AuthContext.tsx             ← Firebase Auth state, role detection
        │
        ├── hooks/
        │   ├── useAuth.ts                  ← Consumes AuthContext
        │   ├── useFirestore.ts             ← useCollection (real-time listener hook)
        │   └── useNotifications.ts         ← Fetches notifications for current user
        │
        ├── lib/
        │   ├── firebase.ts                 ← Firebase app, auth, db, storage init
        │   ├── firestore.ts                ← createDoc, updateDoc, deleteDoc, etc.
        │   ├── images.ts                   ← resolveImage() utility
        │   └── utils.ts                    ← formatCurrency, formatDate, groupByDate, etc.
        │
        └── types/
            └── index.ts                    ← All TypeScript interfaces
```

---

## 4. Data Models (Firestore)

All data lives in Cloud Firestore. There are 5 top-level collections.

### `users`
```typescript
interface User {
  id: string;             // = Firebase Auth UID
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'admin' | 'owner' | 'customer';
  createdAt: Timestamp | string;
  isActive: boolean;
}
```
- Created automatically on first login (role defaults to 'customer')
- Admins create owner accounts via the dashboard without signing out (uses Firebase Auth REST API: `POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=API_KEY`)

### `venues`
```typescript
interface Venue {
  id: string;
  name: string;
  location: string;       // e.g. "Adliya, Bahrain"
  description: string;
  heroImage: string;      // Either asset name ("diwan") or Cloudinary URL
  categories: string[];   // Subset of: Work, Meetings, Events, Studio, Training, Coworking
  ownerId: string;        // Firebase Auth UID of the owner user
  latitude: number;
  longitude: number;
  isActive: boolean;
}
```

### `spaces`
```typescript
interface Space {
  id: string;
  venueId: string;        // References venues collection
  title: string;
  description: string;
  image: string;          // Either asset name or Cloudinary URL
  tags: string[];         // e.g. ["wifi", "projector", "whiteboard"]
  type: string;           // One of the SPACE_TYPES list
  capacity: number;
  pricePerHour: number;   // In BHD (Bahraini Dinar)
  availabilityText: string; // e.g. "9:00 AM - 9:00 PM, Mon-Sat"
  isActive: boolean;
  quantity: number;       // How many units of this space exist
}
```
Space types: `Office`, `Meeting Room`, `Event Hall`, `Studio`, `Coworking`, `Private Room`, `Conference`, `Meetings`, `Events`, `Work`

### `bookings`
```typescript
interface Booking {
  id: string;
  userId: string;
  venueId: string;
  spaceId: string;
  venueName: string;      // Denormalized for display
  spaceName: string;      // Denormalized for display
  location: string;
  date: string;           // e.g. "2026-05-10"
  fullDate: string;
  startTime: string;      // e.g. "09:00"
  endTime: string;        // e.g. "11:00"
  duration: number;       // In hours
  reservedSlots: string[]; // Time slots blocked
  pricePerHour: number;
  total: number;          // pricePerHour × duration
  status: 'Confirmed' | 'Cancelled';
  createdAt: Timestamp | string;
}
```

### `notifications`
```typescript
interface Notification {
  id: string;
  receiverId: string;     // Firebase Auth UID
  receiverRole: 'admin' | 'owner' | 'customer';
  title: string;
  message: string;
  type: 'booking' | 'system' | 'announcement';
  isRead: boolean;
  createdAt: Timestamp | string;
  metadata?: Record<string, unknown>;
}
```

---

## 5. Firebase Security Rules

### Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /venues/{venueId} {
      allow read: if true;               // Public (mobile app needs unauthenticated access)
      allow write: if request.auth != null;
    }
    match /spaces/{spaceId} {
      allow read: if true;               // Public
      allow write: if request.auth != null;
    }
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null;
    }
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null;
    }
  }
}
```
**Note:** Rules deliberately avoid cross-document `get()` calls because they cascade-fail in Firebase, causing all rules to deny even when they should allow.

### Firebase Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
**Note:** Firebase Storage was not provisioned (the project region does not support free-tier storage buckets), so image uploads use **Cloudinary** instead.

---

## 6. Authentication & Role System

### How it works
1. User logs in with email + password via Firebase Authentication
2. `AuthContext` (`context/AuthContext.tsx`) listens to `onAuthStateChanged`
3. On login, fetches the user's document from `users/{uid}` in Firestore
4. The `role` field on that document determines access: `admin`, `owner`, or `customer`
5. Root page (`app/page.tsx`) redirects:
   - Admins → `/admin`
   - Owners → `/owner`
   - Customers / unauthenticated → `/login` (customers cannot use the dashboard)

### Creating New Users (Admin Action)
Admins create owner accounts without signing themselves out by calling Firebase's Identity Toolkit REST API directly:
```
POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=FIREBASE_API_KEY
Body: { email, password, returnSecureToken: true }
```
This returns a `localId` (the new user's UID). The admin then:
1. Creates the Firebase Auth account via the REST API
2. Creates the Firestore `users/{localId}` document with the owner role
3. Updates the selected venue's `ownerId` field to the new UID

### Password Change
Uses Firebase's `reauthenticateWithCredential` before `updatePassword` to:
- Force the user to enter their current password (security requirement)
- Refresh the auth token (required by Firebase for sensitive operations)
```typescript
const credential = EmailAuthProvider.credential(user.email, currentPassword);
await reauthenticateWithCredential(user, credential);
await updatePassword(user, newPassword);
```
Error codes handled: `auth/wrong-password`, `auth/invalid-credential`

---

## 7. Admin Dashboard — Pages & Features

### Role: Admin (full platform access)

#### `/admin` — Dashboard
- Real-time stats via `onSnapshot` listeners on all 4 collections simultaneously
- **Stat cards:** Total Users, Total Bookings, Total Venues, Total Spaces, Total Revenue (BHD), Active Listings
- **Charts:** Daily Bookings line chart (last 30 days), Monthly Revenue bar chart (last 6 months)
- **Most Booked Space** highlight card with booking count and percentage of platform total
- **Recent Bookings** table (last 5)
- **Top Spaces** table (ranked by booking count)

#### `/admin/bookings` — Bookings Management
- Table of all bookings across all venues
- Filter by venue, status (Confirmed/Cancelled), date range
- View booking details (modal with full info)
- Cancel booking action
- Pagination (10 per page)

#### `/admin/venues` — Venue Management
- Table of all venues with status, location, categories
- Filter by status (active/inactive)
- Add new venue (modal with VenueForm)
- Edit existing venue
- Activate / Deactivate toggle
- Delete venue (with confirmation modal)

#### `/admin/spaces` — Space Management
- Table of all spaces with venue name, type, price/hr, capacity, quantity, status
- Filter by venue, status
- Add new space (modal with SpaceForm)
- Edit existing space
- Activate / Deactivate
- Delete space

#### `/admin/users` — User Management
- Table of all users with role, email, phone, status, join date
- Filter by role (admin/owner/customer), status
- **Add User modal:** Full Name, Email, Password (with show/hide), Phone, Role; if Role = owner, a venue dropdown appears to assign their venue
- **Edit User modal:** Edit profile fields, change role, reassign venue if owner
- Suspend / Activate user (toggles `isActive`)
- Delete user (with confirmation)
- When creating an owner, the selected venue's `ownerId` is updated automatically

#### `/admin/notifications` — Notification Management
- List of all notifications in the system
- Filter by type (booking/system/announcement) and read status
- **Compose Notification** modal:
  - Send to: All Users, All Owners, Specific User (by UID)
  - Title, Message, Type
- Mark all as read
- Delete individual notifications

#### `/admin/analytics` — Analytics
- Date range filter: Last 7 days, Last 30 days, Last 90 days
- **Stat cards:** Total Bookings, Revenue, Avg Booking Value, Cancellation Rate
- **Daily Bookings** line chart (filtered range)
- **Monthly Revenue** bar chart (last 6 months)
- **Top 5 Spaces by Bookings** bar chart
- **Peak Booking Hours** bar chart (9am–6pm)
- **Most Active Users** table (top 10 by booking count)

#### `/admin/settings` — Admin Settings
- Edit profile (full name, email)
- Change password (current password required → reauthenticate → update)
- **Danger Zone:**
  - Normalize Venue Names (migrates old booking records with outdated venue names like "Diwan Hub" → "Diwan Studio")

---

### Role: Owner (own venues/spaces only)

Owners see the same UI shell but all Firestore queries are filtered by `ownerId == user.uid`, so they only see data related to their venues.

#### `/owner` — Owner Dashboard
- Stats: My Venues, My Spaces, Total Bookings, Revenue, Upcoming Bookings, Cancelled
- Monthly Revenue chart (own venues only)
- Daily Bookings chart (own venues only)
- Recent Bookings table (own venues only)

#### `/owner/venues` — My Venues
- Card grid view (not table) showing venue image, name, location, categories, status badge
- Add Venue, Edit Venue, Activate/Deactivate, Delete
- Filtered to only venues where `ownerId == currentUser.uid`

#### `/owner/spaces` — My Spaces
- Table view of all spaces in owner's venues
- Filter by venue (dropdown), search by title
- Add Space, Edit Space, Activate/Deactivate, Delete

#### `/owner/bookings` — My Bookings
- All bookings for the owner's venues
- Filter by venue, status

#### `/owner/analytics` — My Analytics
- Same charts as admin analytics but filtered to own venues/spaces

#### `/owner/notifications` — My Notifications
- Notifications where `receiverId == currentUser.uid`
- Mark as read, delete

#### `/owner/settings` — Owner Settings
- Edit profile (full name, phone number)
- Change password (current password required)
- Notification preferences (toggles for New Bookings, Cancellations, Announcements, Daily Summary) — UI only, preferences stored in component state

---

## 8. Mobile App — Screens

### Auth Flow
- **LoginScreen** — Email/password login with Firebase Auth, show/hide password toggle
- **RegisterScreen** — Create new customer account, writes to `users` collection
- **ForgotPasswordScreen** — Firebase `sendPasswordResetEmail`

### Main App (Bottom Tab Navigation)
After login, users access a tab bar with:
1. **Home** (`homeScreen.tsx`) — Browse venues and spaces, search functionality
2. **Calendar** (`CalendarScreen.tsx`) — View bookings by date
3. **Favourites** (`FavouriteScreen.tsx`) — Saved/bookmarked spaces
4. **Profile** (`ProfileScreen.tsx`) — User profile and settings

### Stack Screens (pushed over tabs)
- **SpaceDetailsScreen** — Full details for a space: images, description, pricing, tags, capacity, availability; "Book Now" CTA
- **BookingScreen** — Date picker, time slot selection, duration, total price calculation; submits booking to Firestore
- **BookingSuccessScreen** — Confirmation screen after successful booking
- **MyBookingsScreen** — List of the user's past and upcoming bookings with status badges
- **personalDetails.tsx** — Edit personal information
- **SettingScreen** — App settings

---

## 9. Image Handling

This was a significant design challenge because the mobile app and web dashboard handle images differently.

### Mobile App
Images are **bundled local assets** in `assets/images/`. The Firestore documents store a short key name (e.g. `"diwan"`, `"savoy"`) rather than a URL, because React Native requires `require('./assets/...')` at build time.

### Web Dashboard — `resolveImage()`
The dashboard has a utility function (`src/lib/images.ts`) that bridges the two worlds:
```typescript
const ASSET_MAP: Record<string, string> = {
  diwan: '/images/diwan.jpg',
  savoy: '/images/savoy.jpg',
  aurora_savoy: '/images/aurora_savoy.jpg',
  board_room_diwan: '/images/board_room_diwan.png',
  day_office_diwan: '/images/day_office_diwan.png',
  day_pass_diwan: '/images/day_pass_diwan.jpeg',
  event_space_diwan: '/images/event_space_diwan.jpg',
  lumainia_savoy: '/images/lumainia_savoy.jpg',
  meeting_room_diwan: '/images/Meeting_room_diwan.jpg',
  reef_graden_pool_deck_savoy: '/images/reef_graden_pool_deck_savoy.jpg',
};

export function resolveImage(key: string | undefined): string {
  if (!key) return '';
  if (key.startsWith('http')) return key;       // Cloudinary URL → pass through
  return ASSET_MAP[key.toLowerCase()] ?? '';    // Asset name → /public/images/ path
}
```
The same images are copied into `admin/public/images/` so Next.js can serve them.

### New Images (Uploaded via Dashboard)
When an admin or owner uploads a photo through the venue/space form, it goes to **Cloudinary**:
- Cloud name: `dt1t0s4bs`
- Upload preset: `spaceroom_uploads` (unsigned, no server required)
- Endpoint: `https://api.cloudinary.com/v1_1/dt1t0s4bs/image/upload`
- The returned `secure_url` (e.g. `https://res.cloudinary.com/dt1t0s4bs/image/upload/v.../filename.jpg`) is saved to Firestore
- This URL works in both the web dashboard and the mobile app (it's just a regular HTTPS URL)

---

## 10. Key Environment Variables

File: `admin/.env.local`
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=spaceroom-e38cb.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=spaceroom-e38cb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=spaceroom-e38cb.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dt1t0s4bs
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=spaceroom_uploads
```

---

## 11. Real-Time Data Architecture

The dashboard uses Firestore's `onSnapshot` listeners for real-time updates. The pattern used throughout:

```typescript
// Single collection listener
const unsubscribe = onSnapshot(collection(db, 'venues'), (snapshot) => {
  setVenues(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Venue)));
});
return () => unsubscribe(); // Cleanup on unmount

// Custom hook (useCollection) wraps this pattern
const { data: spaces, loading } = useCollection<Space>('spaces');
```

For owners, queries are filtered:
```typescript
const q = query(collection(db, 'venues'), where('ownerId', '==', user.uid));
```

**Known limitation:** Firestore's `in` operator supports a maximum of 10 values. Owner dashboard's bookings query batches venue IDs to the first 10 if an owner has more than 10 venues.

---

## 12. Shared UI Components

### `DataTable`
Generic table component accepting typed column definitions with optional render functions. Column keys serve as both the data accessor and the React key.

### `Modal` / `ConfirmModal`
Overlay modals. `ConfirmModal` includes a variant prop for `danger` (red confirm button) or `default`.

### `Badge`
Status badge: `active` (green), `inactive` (grey), `Confirmed` (green), `Cancelled` (red).

### `StatCard`
Metric display card with title, value, icon, and color variant.

### `Toggle`
Custom toggle switch (48×26px track, 20×20px knob, 3px symmetric padding). Uses `translate-x-[22px]` for the active state to maintain pixel-perfect alignment. Replaces inline toggle implementations throughout the app.
```typescript
<Toggle checked={isActive} onChange={() => setIsActive(!isActive)} />
```

### `PasswordInput`
Password input with show/hide toggle using Eye/EyeOff icons from Lucide. Manages its own `show` state internally. Used on: Login page, Settings (×3), Add User modal.

### Charts (Recharts)
- `BookingChart` — `LineChart` showing daily booking counts
- `RevenueChart` — `BarChart` showing monthly revenue in BHD
- `SpacePopularityChart` — Horizontal `BarChart` of top spaces
- `PeakHoursChart` — `BarChart` showing booking volume by hour of day

---

## 13. Forms

### `VenueForm`
Used in both admin and owner venue pages. Fields:
- Venue Name (required)
- Location (required)
- Description
- Hero Photo (file upload via Cloudinary OR paste URL)
- Latitude / Longitude
- Categories (multi-select pill buttons from: Work, Meetings, Events, Studio, Training, Coworking)
- Active Listing toggle

### `SpaceForm`
Used in both admin and owner space pages. Fields:
- Venue (dropdown — admin sees all venues, owner sees only their venues)
- Space Title (required)
- Type (dropdown)
- Capacity (required)
- Price per Hour in BHD (required)
- Quantity
- Description
- Space Photo (file upload via Cloudinary OR paste URL)
- Tags (comma-separated)
- Availability Text
- Active Listing toggle

Both forms handle the image upload the same way:
1. User selects a file → local preview shown immediately via `URL.createObjectURL()`
2. "Uploading…" overlay appears
3. File is sent to Cloudinary via `fetch` (FormData with `file` and `upload_preset`)
4. On success: `secure_url` stored in form state; on form submit it goes to Firestore

---

## 14. Known Existing Venues & Spaces in the Database

The Firestore database was seeded with real Bahraini venues:

### Venues
- **Diwan Studio** (previously called "Diwan Hub" / "Diwan Hub, Adliya" — names were migrated)
  - Location: Adliya, Bahrain
  - `heroImage: "diwan"` (local asset)
- **Savoy Grande Hotel**
  - `heroImage: "savoy"` (local asset)

### Spaces (examples)
- Board Room @ Diwan Studio (`image: "board_room_diwan"`)
- Day Office @ Diwan Studio (`image: "day_office_diwan"`)
- Day Pass @ Diwan Studio (`image: "day_pass_diwan"`)
- Event Space @ Diwan Studio (`image: "event_space_diwan"`)
- Meeting Room @ Diwan Studio (`image: "meeting_room_diwan"`)
- Aurora @ Savoy Grande Hotel (`image: "aurora_savoy"`)
- Lumainia @ Savoy Grande Hotel (`image: "lumainia_savoy"`)
- Reef Garden Pool Deck @ Savoy Grande Hotel (`image: "reef_graden_pool_deck_savoy"`)

---

## 15. Currency & Locale

- All prices are in **BHD (Bahraini Dinar)**
- `formatCurrency()` utility formats numbers as BHD strings
- The platform is targeted at Bahrain; venue locations are in Bahrain
- No i18n/multi-language support currently

---

## 16. Development Setup

### Running the Mobile App
```bash
cd C:\Projects\spaceroom
npm install
npx react-native run-android   # or run-ios
```

### Running the Admin Dashboard
```bash
cd C:\Projects\spaceroom\admin
npm install
npm run dev         # Starts Next.js on http://localhost:3000
```
Next.js version 16 with Turbopack is used. The dev server is fast (~240ms cold start).

### Firebase Project
- Project ID: `spaceroom-e38cb`
- Auth domain: `spaceroom-e38cb.firebaseapp.com`
- The project is on the **Spark (free) plan** — Firebase Storage could not be provisioned because the project region does not support free-tier storage buckets. Cloudinary is used instead.

---

## 17. Notifications System

The admin can compose and send notifications to:
- **All Users** (role: customer) — iterates all users with role='customer' and creates one notification doc per user
- **All Owners** (role: owner) — same, for owners
- **Specific User** — by Firebase Auth UID

Notification types: `booking` (triggered by booking events), `system`, `announcement`

On the dashboard, notifications are fetched client-side:
- Admin sees all notifications
- Owners/customers see only their own (filtered by `receiverId == uid`)

The `useNotifications` hook fetches the latest 50 notifications for the current user, sorted client-side by `createdAt` (Firestore composite indexes were not set up, so `orderBy` was removed from queries and sorting is done in JavaScript).

---

## 18. Analytics Detail

The analytics page (admin) computes entirely client-side from raw Firestore data:

| Metric | Calculation |
|---|---|
| Total Revenue | Sum of `total` on all `Confirmed` bookings |
| Avg Booking Value | Total Revenue ÷ count of Confirmed bookings |
| Cancellation Rate | (Cancelled ÷ Total) × 100 |
| Daily Bookings | Group bookings by `createdAt` date, count per day |
| Monthly Revenue | Group confirmed bookings by month, sum `total` |
| Space Popularity | Count bookings per `spaceId`, take top 5 |
| Peak Hours | Count bookings per `startTime` hour (9am–6pm) |
| Most Active Users | Count bookings per `userId`, take top 10 |

---

## 19. Routing & Access Control

Access control is enforced client-side via `AuthContext`:
- `/admin/*` routes check `role === 'admin'` in the layout; redirect to `/login` if not
- `/owner/*` routes check `role === 'owner'`; redirect if not
- The root `/` page reads the role from context and redirects accordingly
- An unauthenticated visitor always lands on `/login`

There is no server-side middleware for auth (Next.js middleware was not implemented). All protection is via client-side checks in layout components.

---

## 20. Summary of Design Decisions & Trade-offs

| Decision | Reason |
|---|---|
| Cloudinary instead of Firebase Storage | Firebase project region doesn't support free-tier Storage |
| Client-side sorting instead of Firestore `orderBy` | Composite indexes not set up; avoids Firestore index errors |
| Firebase Auth REST API for creating users | Calling `createUserWithEmailAndPassword` signs out the current user; REST API avoids this |
| `resolveImage()` bridge utility | Mobile app uses named local assets; web needs URLs; this maps both |
| No `get()` in Firestore rules | Cross-document lookups in rules cascade-fail and break all reads |
| Owner data isolation via query filters | All owner queries use `where('ownerId', '==', uid)` — no sensitive data leaks |
| Denormalized `venueName`/`spaceName` in bookings | Avoids extra Firestore reads when displaying booking lists |
| Monorepo (admin inside mobile root) | Single Git repo, shared Firebase config, easier to manage |
