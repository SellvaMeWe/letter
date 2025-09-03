# Letter App

A digital letter management application built with Next.js, Firebase, and Tailwind CSS.

## Features

- **Digital Letter Management**: Create, view, and organize digital letters
- **Contact Management**: Import and manage contacts from third-party applications
- **Real-time Updates**: Live synchronization using Firestore listeners
- **Image Storage**: Secure cloud storage for letter images using Firebase Storage
- **Authentication**: Anonymous authentication system
- **Responsive Design**: Modern, mobile-friendly UI built with Tailwind CSS

## Architecture

- **Frontend**: Next.js 14 with React 18
- **Backend**: Next.js API Routes (serverless)
- **Database**: Firestore (NoSQL)
- **Storage**: Firebase Storage
- **Authentication**: Firebase Authentication
- **Styling**: Tailwind CSS
- **State Management**: React Context API

## Project Structure

```
letter-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── contacts/      # Contact management APIs
│   │   └── letters/       # Letter management APIs
│   ├── contacts/          # Contacts page
│   ├── inbox/             # Inbox page
│   ├── letter/[id]/       # Letter detail page
│   ├── sent/              # Sent letters page
│   ├── upload/            # Letter upload page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/             # Reusable components
│   └── Navigation.tsx     # Main navigation
├── contexts/               # React contexts
│   └── AuthContext.tsx    # Authentication context
├── firebase/               # Firebase configuration
│   └── config.ts          # Firebase setup
├── types/                  # TypeScript type definitions
│   └── index.ts           # Main types
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── next.config.js         # Next.js configuration
```

## Database Schema

### Collections

#### users

- `uid` (string): User's unique identifier
- `createdAt` (timestamp): Account creation date

#### contacts

- `userId` (string): Reference to user
- `name` (string): Contact name
- `sourceAppId` (string): Source application identifier

#### letters

- `senderId` (string): Reference to sender user
- `recipientId` (string): Reference to recipient contact
- `description` (string): Letter description
- `imageUrl` (string): Firebase Storage URL
- `createdAt` (timestamp): Letter creation date

## API Endpoints

### Contacts

- `POST /api/contacts/import` - Import a new contact
- `GET /api/contacts?userId={uid}` - Get user's contacts

### Letters

- `POST /api/letters` - Upload a new letter
- `GET /api/letters/inbox?userId={uid}` - Get received letters
- `GET /api/letters/sent?userId={uid}` - Get sent letters
- `GET /api/letters/[id]` - Get specific letter details

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project

### 1. Clone the repository

```bash
git clone <repository-url>
cd letter-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Firebase Storage
4. Enable Authentication (Anonymous)
5. Get your Firebase configuration

### 4. Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 5. Firestore Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /contacts/{contactId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    match /letters/{letterId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.senderId ||
         request.auth.uid == resource.data.recipientId);
    }
  }
}
```

### 6. Storage Security Rules

Update your Firebase Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /letters/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
        request.auth.uid == userId;
    }
  }
}
```

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign In**: The app uses anonymous authentication - click "Get Started" to begin
2. **Import Contacts**: Go to Contacts page and add contacts with names and source app IDs
3. **Send Letters**: Use the Upload page to create letters with images and descriptions
4. **View Letters**: Check your Inbox for received letters and Sent for letters you've sent
5. **Letter Details**: Click on any letter to view full details and image

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- Tailwind CSS for styling
- React hooks for state management
- Firebase SDK for backend services

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- AWS Amplify
- Google Cloud Run
- Docker containers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.



