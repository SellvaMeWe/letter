"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { meweService } from "../services/meweService";
import { db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

export const MeWeContacts: React.FC = () => {
  const { user, getMeWeAuthToken, connectToMeWe, loadMeWeContacts } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [meweToken, setMeweToken] = useState<string | null>(null);
  const [justConnected, setJustConnected] = useState(false);

  // Initialize meweToken from user context on mount
  useEffect(() => {
    if (user?.meweToken) {
      setMeweToken(user.meweToken);
    }
  }, []); // Only run once on mount

  // Check if contacts are already loaded when component mounts
  useEffect(() => {
    const checkContactsLoaded = async () => {
      if (user?.uid && !justConnected) {
        try {
          const contactsQuery = query(
            collection(db, "contacts"),
            where("userId", "==", user.uid)
          );
          const contactsSnapshot = await getDocs(contactsQuery);
          setContactsLoaded(!contactsSnapshot.empty);
        } catch (error) {
          console.error("Error checking contacts:", error);
        }
      }
    };

    checkContactsLoaded();
  }, [user?.uid, user?.meweToken, justConnected]);

  const handleConnectToMeWe = async () => {
    try {
      setLoading(true);
      setError(null);

      const { userInfo, token } = await connectToMeWe();

      // Update local state to reflect connection
      console.log("Token:", token);

      // Set the token directly from the return value
      console.log("Setting meweToken to:", token);
      setMeweToken(token);
      setContactsLoaded(false);
      setJustConnected(true);

      console.log("MeWe connection successful:", userInfo);
      console.log(
        "Local state after update - meweToken:",
        token,
        "contactsLoaded:",
        false,
        "justConnected:",
        true
      );
    } catch (error: any) {
      setError(error.message || "Failed to connect to MeWe");
      console.error("Error connecting to MeWe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get the auth token
      console.log("Getting MeWe auth token...");
      const tokenResponse = await getMeWeAuthToken();

      // Even if pending, we still have a valid token and expiration
      // The pending status just means the user needs to complete OTP verification
      if (!tokenResponse.token) {
        setError("Failed to get MeWe auth token. Please try again.");
        return;
      }

      if (tokenResponse.pending) {
        setError(
          "MeWe authentication is pending. Please check your email/SMS for OTP and try again later. Your token has been saved and will be ready once verification is complete."
        );
        return;
      }

      // Then load contacts and save to database
      console.log("Loading MeWe contacts...");
      await loadMeWeContacts(tokenResponse.token);

      // Mark contacts as loaded
      setContactsLoaded(true);
      setJustConnected(false);
    } catch (error: any) {
      setError(error.message || "Failed to load contacts");
      console.error("Error loading MeWe contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Refreshing MeWe contacts...");

      // Load fresh contacts from MeWe and save to database
      const contactsResponse = await loadMeWeContacts(meweToken);

      console.log(
        "Contacts refreshed and saved to database:",
        contactsResponse
      );
    } catch (error: any) {
      setError(error.message || "Failed to refresh contacts");
      console.error("Error refreshing MeWe contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (!meweService.isConfigured()) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">
          MeWe API is not configured. Please check your environment variables.
        </p>
      </div>
    );
  }

  if (!user.email) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          MeWe integration requires email/password authentication. Please sign
          in with email/password.
        </p>
      </div>
    );
  }

  if (!user.meweLoginRequestToken) {
    console.log("Debug - User object:", user);
    console.log("Debug - meweLoginRequestToken:", user.meweLoginRequestToken);
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          MeWe authentication not initialized. Please sign out and sign in again
          with email/password.
        </p>
        <details className="mt-2">
          <summary className="cursor-pointer text-sm">Debug Info</summary>
          <pre className="text-xs mt-1 bg-gray-100 p-2 rounded">
            {JSON.stringify(user, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          MeWe Integration
        </h2>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* MeWe Status */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <h3 className="font-medium text-blue-900 mb-2">
            MeWe Authentication Status
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              ✅ Login Request Token:{" "}
              {user.meweLoginRequestToken ? "Ready" : "Not available"}
            </p>
            <p>
              {meweToken ? "✅" : "⏳"} Auth Token:{" "}
              {meweToken ? "Ready" : "Not obtained"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!meweToken ? (
            <button
              onClick={handleConnectToMeWe}
              disabled={loading}
              className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Connecting..." : "Connect To MeWe"}
            </button>
          ) : !contactsLoaded ? (
            <button
              onClick={handleLoadContacts}
              disabled={loading}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Loading Contacts..." : "Load Contacts"}
            </button>
          ) : (
            <button
              onClick={handleRefreshContacts}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Refreshing..." : "Refresh Contacts"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
