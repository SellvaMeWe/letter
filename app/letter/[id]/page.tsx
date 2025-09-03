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
import { Mail, Calendar, User, ArrowLeft, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { PDFViewer } from "../../../components/PDFViewer";
import { PDFThumbnail } from "../../../components/PDFThumbnail";

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
      })) as unknown as Contact[];
      setContacts(contactsData);
    });

    return () => {
      letterUnsubscribe();
      contactsUnsubscribe();
    };
  }, [user, letterId]);

  const getContactName = (contactId: string) => {
    const contact = contacts.find((c) => c.contactId === contactId);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Elegant Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href={isSender ? "/sent" : "/inbox"}
                className="group flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors duration-200"
              >
                <div className="p-2 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <ArrowLeft className="h-4 w-4" />
                </div>
                <span className="font-medium">Back</span>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-white shadow-sm">
                {letter.fileType === "application/pdf" ? (
                  <FileText className="h-6 w-6 text-red-500" />
                ) : (
                  <Mail className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Letter</h1>
                <p className="text-sm text-slate-500">
                  {letter.fileType === "application/pdf"
                    ? "PDF Document"
                    : "Image Document"}
                </p>
              </div>
            </div>
          </div>

          {/* Letter Metadata */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    {letter.description}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="font-medium">
                        {isSender ? "To: " : "From: "}
                        {isSender
                          ? getContactName(letter.recipientId)
                          : getContactName(letter.senderId)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{letter.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{letter.createdAt.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="px-4 py-2 bg-slate-100 rounded-full">
                  <span className="text-sm font-medium text-slate-700">
                    {isSender ? "Sent" : "Received"}
                  </span>
                </div>
                {isSender && (
                  <Link
                    href="/upload"
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                  >
                    Send Another
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Reading Area */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 overflow-hidden">
          <div className="p-8">
            {letter.imageUrl ? (
              letter.fileType === "application/pdf" ? (
                <div className="relative">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <PDFViewer
                      pdfUrl={letter.imageUrl}
                      fileName={letter.fileName}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 overflow-hidden">
                    <img
                      src={letter.imageUrl}
                      alt="Letter"
                      className="w-full h-auto object-contain rounded-xl shadow-sm"
                    />
                  </div>
                  {/* Subtle overlay for better focus */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              )
            ) : (
              <div className="w-full h-96 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200">
                <Mail className="h-16 w-16 text-slate-400 mb-4" />
                <p className="text-slate-500 font-medium">
                  No content available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Reading Progress Indicator */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span>Reading mode</span>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
