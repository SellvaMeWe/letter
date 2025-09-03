import { User as FirebaseUser } from "firebase/auth";

export interface User {
  uid: string;
  email?: string;
  createdAt: Date;
  meweLoginRequestToken?: string;
  meweToken?: string;
  meweTokenExpiresAt?: string;
  meweUserId?: string;
  name?: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  contactId: string;
  handle: string;
  updatedAt?: Date;
  photoUrl?: string;
}

export interface Letter {
  id: string;
  senderId: string;
  recipientId: string;
  description: string;
  imageUrl: string;
  fileType?: string;
  fileName?: string;
  thumbnailUrl?: string;
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<FirebaseUser>;
  signInWithEmail: (email: string, password: string) => Promise<FirebaseUser>;
  getMeWeAuthToken: () => Promise<any>;
  connectToMeWe: () => Promise<any>;
  loadMeWeContacts: (meweToken: string | null) => Promise<any>;
  signOut: () => Promise<void>;
}

export interface ContactImportData {
  name: string;
  sourceAppId: string;
}

export interface LetterUploadData {
  recipientId: string;
  description: string;
  image: File;
}
