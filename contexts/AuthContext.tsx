"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { User, AuthContextType } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          // Check if user exists in Firestore, if not create them
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (!userDoc.exists()) {
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              createdAt: new Date(),
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
            setUser(newUser);
          } else {
            setUser(userDoc.data() as User);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      if (error.code === "auth/admin-restricted-operation") {
        console.error(
          "Anonymous authentication is disabled. Please enable it in Firebase Console."
        );
        alert(
          "Anonymous authentication is disabled. Please use email/password authentication instead."
        );
      } else {
        console.error("Error signing in anonymously:", error);
        alert("Sign-in failed. Please try again.");
      }
    }
  };

  const handleSignUpWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing up with email:", error);
      throw error;
    }
  };

  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInAnonymously: handleAnonymousSignIn,
    signUpWithEmail: handleSignUpWithEmail,
    signInWithEmail: handleSignInWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
