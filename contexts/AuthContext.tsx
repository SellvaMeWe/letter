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
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { User, AuthContextType } from "../types";
import { meweService } from "../services/meweService";

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

            // Start MeWe authentication for new users
            if (firebaseUser.email) {
              console.log(
                "New user created, starting MeWe authentication for:",
                firebaseUser.email
              );
              handleMeWeAuthentication(firebaseUser.email).catch((error) => {
                console.error(
                  "MeWe authentication failed for new user:",
                  error
                );
              });
            }
          } else {
            const userData = userDoc.data() as User;
            console.log("Loaded user from Firestore:", userData);
            console.log(
              "User has meweLoginRequestToken:",
              !!userData.meweLoginRequestToken
            );
            setUser(userData);

            // Start MeWe authentication if user doesn't have a token yet
            if (firebaseUser.email && !userData.meweLoginRequestToken) {
              console.log(
                "Existing user without MeWe token, starting authentication for:",
                firebaseUser.email
              );
              handleMeWeAuthentication(firebaseUser.email).catch((error) => {
                console.error(
                  "MeWe authentication failed for existing user:",
                  error
                );
              });
            }
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
      // Note: MeWe authentication requires email, so we skip it for anonymous users
      console.log(
        "Anonymous sign-in successful. MeWe authentication requires email/password sign-in."
      );
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

      // Don't start MeWe authentication here - let onAuthStateChanged handle it
      // after the user state is properly loaded from Firestore
      console.log(
        "Email sign-in successful, waiting for user state to load..."
      );

      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const handleMeWeAuthentication = async (email: string) => {
    try {
      console.log("Starting MeWe login request for:", email);
      const loginRequestToken = await meweService.getLoginRequestToken(email);
      console.log("Got MeWe login request token:", loginRequestToken);

      // Get the current user from Firestore to ensure we have the latest data
      const currentUserDoc = await getDoc(
        doc(db, "users", auth.currentUser?.uid || "")
      );
      if (!currentUserDoc.exists()) {
        console.error("User document not found in Firestore");
        return;
      }

      const currentUserData = currentUserDoc.data() as User;
      const updatedUser = {
        ...currentUserData,
        meweLoginRequestToken: loginRequestToken,
      };

      // Filter out undefined values before saving to Firestore
      const cleanUpdatedUser = Object.fromEntries(
        Object.entries(updatedUser).filter(([_, value]) => value !== undefined)
      );

      console.log("About to save to Firestore:", {
        uid: currentUserData.uid,
        updatedUser: cleanUpdatedUser,
        loginRequestToken,
      });

      await setDoc(doc(db, "users", currentUserData.uid), cleanUpdatedUser, {
        merge: true,
      });
      console.log("Successfully saved to Firestore");

      // Verify the save by reading back from Firestore
      const verifyDoc = await getDoc(doc(db, "users", currentUserData.uid));
      if (verifyDoc.exists()) {
        const savedData = verifyDoc.data();
        console.log("Verification - Data saved to Firestore:", savedData);
        console.log(
          "Verification - meweLoginRequestToken in saved data:",
          !!savedData.meweLoginRequestToken
        );
      } else {
        console.error("Verification failed - Document not found after save");
      }

      // Update local user state with the cleaned data
      setUser(cleanUpdatedUser as unknown as User);
      console.log(
        "MeWe login request token saved to user document and state updated"
      );
      console.log("Updated user state:", cleanUpdatedUser);
    } catch (error) {
      console.error("MeWe login request error:", error);
      throw error;
    }
  };

  const getMeWeAuthToken = async () => {
    if (!user?.meweLoginRequestToken) {
      throw new Error(
        "No MeWe login request token found. Please sign in again."
      );
    }

    try {
      console.log(
        "Getting MeWe auth token with login request token:",
        user.meweLoginRequestToken
      );
      const tokenResponse = await meweService.getAuthToken(
        user.meweLoginRequestToken
      );
      console.log(
        "Got MeWe auth token response:",
        JSON.stringify(tokenResponse, null, 2)
      );

      // Store auth token in user's Firestore document
      if (user && tokenResponse.token) {
        // Try to get expiration time from various possible field names
        // MeWe tokens typically expire after 24 hours if not specified
        const expirationTime =
          tokenResponse.expiresAt ||
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        console.log("Token expiration time:", expirationTime);
        console.log("Token pending status:", tokenResponse.pending);
        console.log("About to save token data to database:", {
          meweToken: tokenResponse.token,
          meweTokenExpiresAt: expirationTime,
          pending: tokenResponse.pending,
        });

        const updatedUser = {
          ...user,
          meweToken: tokenResponse.token,
          meweTokenExpiresAt: expirationTime,
        };

        // Filter out undefined values before saving to Firestore
        const cleanUpdatedUser = Object.fromEntries(
          Object.entries(updatedUser).filter(
            ([_, value]) => value !== undefined
          )
        );

        await setDoc(doc(db, "users", user.uid), cleanUpdatedUser, {
          merge: true,
        });

        // Verify the save by reading back from Firestore
        const verifyDoc = await getDoc(doc(db, "users", user.uid));
        if (verifyDoc.exists()) {
          const savedData = verifyDoc.data();
          console.log("Verification - Token data saved to Firestore:", {
            meweToken: savedData.meweToken,
            meweTokenExpiresAt: savedData.meweTokenExpiresAt,
            pending: tokenResponse.pending,
          });
        }

        // Update local user state
        setUser(cleanUpdatedUser as unknown as User);
        console.log("MeWe auth token saved to user document and state updated");
      }

      return tokenResponse;
    } catch (error) {
      console.error("Error getting MeWe auth token:", error);
      throw error;
    }
  };

  const connectToMeWe = async () => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      console.log("Starting MeWe connection process...");

      // First get the auth token
      const tokenResponse = await getMeWeAuthToken();

      if (tokenResponse.pending) {
        throw new Error(
          "MeWe authentication is still pending. Please complete the OTP verification first."
        );
      }

      if (!tokenResponse.token) {
        throw new Error("Failed to get MeWe auth token");
      }

      // Get user info from MeWe
      console.log("Getting MeWe user info...");
      const userInfoResponse = await fetch(
        `/api/mewe/me?token=${tokenResponse.token}`
      );

      if (!userInfoResponse.ok) {
        throw new Error("Failed to get MeWe user information");
      }

      const userInfo = await userInfoResponse.json();
      console.log("Got MeWe user info:", userInfo);

      // Update user with MeWe information
      const updatedUser = {
        ...user,
        meweUserId: userInfo.userId,
        name: userInfo.name,
        photoUrl: userInfo.profilePhoto.small,
      };

      // Filter out undefined values before saving to Firestore
      const cleanUpdatedUser = Object.fromEntries(
        Object.entries(updatedUser).filter(([_, value]) => value !== undefined)
      );

      await setDoc(doc(db, "users", user.uid), cleanUpdatedUser, {
        merge: true,
      });

      // Update local user state
      setUser(cleanUpdatedUser as unknown as User);
      console.log("MeWe connection completed successfully");

      return { userInfo, token: tokenResponse.token };
    } catch (error) {
      console.error("Error connecting to MeWe:", error);
      throw error;
    }
  };

  const loadMeWeContacts = async (meweToken: string) => {
    if (!meweToken) {
      throw new Error(
        "No MeWe auth token found. Please connect to MeWe first."
      );
    }

    try {
      console.log("Loading MeWe contacts with token:", meweToken);
      const contactsResponse = await meweService.getContacts(meweToken);
      console.log("Got MeWe contacts:", contactsResponse);

      // Clear existing contacts for the current user
      console.log("Clearing existing contacts for user:", user?.uid);
      const existingContactsQuery = query(
        collection(db, "contacts"),
        where("userId", "==", user?.uid || "")
      );
      const existingContactsSnapshot = await getDocs(existingContactsQuery);

      if (!existingContactsSnapshot.empty) {
        const deleteBatch: Promise<void>[] = [];
        existingContactsSnapshot.forEach((docSnapshot) => {
          deleteBatch.push(deleteDoc(docSnapshot.ref));
        });
        await Promise.all(deleteBatch);
        console.log(
          `Deleted ${existingContactsSnapshot.size} existing contacts`
        );
      }

      // Save new contacts to Firestore
      if (contactsResponse.list && contactsResponse.list.length > 0) {
        console.log(
          `Saving ${contactsResponse.list.length} MeWe contacts to database...`
        );
        const batch = [];
        for (const meweContact of contactsResponse.list) {
          // Use contactId as the document ID to prevent duplicates
          const contactRef = doc(db, "contacts", `${meweContact.user.userId}`);
          const contact = meweContact.user;
          const contactData = {
            userId: user?.uid || "",
            name: contact.name,
            contactId: contact.userId,
            handle: contact.handle,
            updatedAt: new Date(),
            photoUrl: contact.profilePhoto.small,
          };
          console.log("Saving contact:", contactData);
          batch.push(setDoc(contactRef, contactData, { merge: true }));
        }
        await Promise.all(batch);
        console.log(
          `Successfully saved ${contactsResponse.list.length} MeWe contacts to database`
        );
      } else {
        console.log("No contacts to save or contacts list is empty");
      }

      return contactsResponse;
    } catch (error) {
      console.error("Error loading MeWe contacts:", error);
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
    getMeWeAuthToken,
    connectToMeWe,
    loadMeWeContacts: (meweToken: string | null) => {
      if (!meweToken) {
        return Promise.reject(new Error("MeWe token is required"));
      }
      return loadMeWeContacts(meweToken);
    },
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
