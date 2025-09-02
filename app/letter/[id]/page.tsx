"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import {
  doc,
  getDoc,
  onSnapshot,
  query,
  collection,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase/config";
import { Letter, Contact } from "../../../types";
import Navigation from "../../../components/Navigation";
import { Mail, Calendar, User, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";

export default function LetterDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const letterId = params.id as string;

  const [letter, setLetter] = useState<Letter | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !letterId) return;

    // Listen to letter document
    const letterUnsubscribe = onSnapshot(
      doc(db, "letters", letterId),
      (doc) => {
        if (doc.exists()) {
          const letterData = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          } as Letter;
          setLetter(letterData);
        } else {
          setError("Letter not found");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching letter:", error);
        setError("Error loading letter");
        setLoading(false);
      }
    );

    // Listen to contacts for sender/recipient names
    const contactsQuery = query(
      collection(db, "contacts"),
      where("userId", "==", user.uid)
    );

    const contactsUnsubscribe = onSnapshot(contactsQuery, (snapshot) => {
      const contactsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Contact[];
      setContacts(contactsData);
    });

    return () => {
      letterUnsubscribe();
      contactsUnsubscribe();
    };
  }, [user, letterId]);

  const getContactName = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? contact.name : "Unknown Contact";
  };

  const isSender = letter?.senderId === user?.uid;
  const isRecipient = letter?.recipientId === user?.uid;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to view letters.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading letter...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Letter not found
            </h3>
            <p className="text-gray-600 mb-6">
              {error || "The letter you are looking for does not exist."}
            </p>
            <Link href="/inbox" className="btn-primary">
              Back to Inbox
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href={isSender ? "/sent" : "/inbox"}
              className="text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Mail className="h-8 w-8 text-primary-600" />
              <span>Letter Details</span>
            </h1>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Letter Image */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Letter Image
            </h3>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {letter.imageUrl ? (
                <img
                  src={letter.imageUrl}
                  alt="Letter"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Mail className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Letter Information */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Letter Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      {isSender ? "To:" : "From:"}
                    </span>
                    <p className="text-gray-900">
                      {isSender
                        ? getContactName(letter.recipientId)
                        : getContactName(letter.senderId)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Sent:
                    </span>
                    <p className="text-gray-900">
                      {letter.createdAt.toLocaleDateString()} at{" "}
                      {letter.createdAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Status:
                    </span>
                    <p className="text-gray-900">
                      {isSender ? "Sent" : "Received"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Description
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {letter.description}
              </p>
            </div>

            <div className="flex space-x-4">
              {isSender && (
                <Link href="/upload" className="btn-primary">
                  Send Another Letter
                </Link>
              )}
              <Link
                href={isSender ? "/sent" : "/inbox"}
                className="btn-secondary"
              >
                Back to {isSender ? "Sent" : "Inbox"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


