"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { Letter, Contact } from "../../types";
import Navigation from "../../components/Navigation";
import { Send, Calendar, User } from "lucide-react";
import Link from "next/link";

export default function SentPage() {
  const { user } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen to contacts
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

    // Listen to sent letters
    const lettersQuery = query(
      collection(db, "letters"),
      where("senderId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const lettersUnsubscribe = onSnapshot(lettersQuery, (snapshot) => {
      const lettersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Letter[];
      setLetters(lettersData);
      setLoading(false);
    });

    return () => {
      contactsUnsubscribe();
      lettersUnsubscribe();
    };
  }, [user]);

  const getContactName = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? contact.name : "Unknown Contact";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to view your sent letters.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Send className="h-8 w-8 text-primary-600" />
            <span>Sent Letters</span>
          </h1>
          <p className="mt-2 text-gray-600">View all letters you've sent</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading letters...</p>
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-12">
            <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No sent letters yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't sent any letters yet.
            </p>
            <Link href="/upload" className="btn-primary">
              Send Your First Letter
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {letters.map((letter) => (
              <Link key={letter.id} href={`/letter/${letter.id}`}>
                <div className="card hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    {letter.imageUrl ? (
                      <img
                        src={letter.imageUrl}
                        alt="Letter"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Send className="h-16 w-16 text-gray-400" />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>To: {getContactName(letter.recipientId)}</span>
                    </div>

                    <p className="text-gray-900 line-clamp-2">
                      {letter.description}
                    </p>

                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{letter.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


