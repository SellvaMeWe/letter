import { User as FirebaseUser } from "firebase/auth";

export interface User {
  uid: string;
  email?: string;
  createdAt: Date;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  sourceAppId: string;
}

export interface Letter {
  id: string;
  senderId: string;
  recipientId: string;
  description: string;
  imageUrl: string;
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<FirebaseUser>;
  signInWithEmail: (email: string, password: string) => Promise<FirebaseUser>;
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
