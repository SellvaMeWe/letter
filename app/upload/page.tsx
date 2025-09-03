"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase/config";
import { Contact } from "../../types";
import Navigation from "../../components/Navigation";
import { Upload, Image, User, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { generatePDFThumbnail } from "../../utils/thumbnailGenerator";

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    recipientId: "",
    description: "",
  });

  useEffect(() => {
    if (!user) return;

    const contactsQuery = query(
      collection(db, "contacts"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(contactsQuery, (snapshot) => {
      const contactsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as unknown as Contact[];
      setContacts(contactsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (
      file &&
      (file.type.startsWith("image/") || file.type === "application/pdf")
    ) {
      setSelectedFile(file);
    } else {
      alert("Please select a valid image or PDF file");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !user ||
      !selectedFile ||
      !formData.recipientId ||
      !formData.description
    ) {
      alert("Please fill in all fields and select a file");
      return;
    }

    setUploading(true);

    try {
      // Upload file to Firebase Storage
      const storageRef = ref(
        storage,
        `letters/${user.uid}/${Date.now()}_${selectedFile.name}`
      );
      const uploadResult = await uploadBytes(storageRef, selectedFile);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // Generate thumbnail for PDF files
      let thumbnailUrl: string | undefined;
      if (selectedFile.type === "application/pdf") {
        try {
          thumbnailUrl = (await generatePDFThumbnail(imageUrl)) || undefined;
        } catch (error) {
          console.warn("Failed to generate PDF thumbnail:", error);
        }
      }

      // Save letter metadata to Firestore
      await addDoc(collection(db, "letters"), {
        senderId: user.uid,
        recipientId: formData.recipientId,
        description: formData.description,
        imageUrl,
        fileType: selectedFile.type,
        fileName: selectedFile.name,
        thumbnailUrl,
        createdAt: new Date(),
      });

      // Reset form and redirect
      setFormData({ recipientId: "", description: "" });
      setSelectedFile(null);
      router.push("/sent");
    } catch (error) {
      console.error("Error uploading letter:", error);
      alert("Error uploading letter. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to upload letters.</p>
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
              href="/inbox"
              className="text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Upload className="h-8 w-8 text-primary-600" />
              <span>Upload Letter</span>
            </h1>
          </div>
          <p className="mt-2 text-gray-600">
            Create and send a new letter to one of your contacts
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No contacts available
            </h3>
            <p className="text-gray-600 mb-6">
              You need to import contacts before you can send letters.
            </p>
            <Link href="/contacts" className="btn-primary">
              Import Contacts
            </Link>
          </div>
        ) : (
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="recipient"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <User className="h-4 w-4 inline mr-2" />
                  Recipient
                </label>
                <select
                  id="recipient"
                  value={formData.recipientId}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientId: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Select a recipient</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Letter Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field"
                  rows={4}
                  placeholder="Write a description for your letter..."
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="file"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Upload className="h-4 w-4 inline mr-2" />
                  Letter File (Image or PDF)
                </label>
                <input
                  type="file"
                  id="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  className="input-field"
                  required
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={
                    uploading ||
                    !selectedFile ||
                    !formData.recipientId ||
                    !formData.description
                  }
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Send Letter</span>
                    </>
                  )}
                </button>

                <Link href="/inbox" className="btn-secondary">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
