"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { Contact } from "../../types";
import Navigation from "../../components/Navigation";
import { Users, Plus, Trash2, Smartphone } from "lucide-react";

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportForm, setShowImportForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", sourceAppId: "" });

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
      })) as Contact[];
      setContacts(contactsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleImportContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newContact.name || !newContact.sourceAppId) return;

    try {
      await addDoc(collection(db, "contacts"), {
        userId: user.uid,
        name: newContact.name,
        sourceAppId: newContact.sourceAppId,
      });

      setNewContact({ name: "", sourceAppId: "" });
      setShowImportForm(false);
    } catch (error) {
      console.error("Error importing contact:", error);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "contacts", contactId));
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please sign in to view your contacts.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Users className="h-8 w-8 text-primary-600" />
            <span>Contacts</span>
          </h1>
          <p className="mt-2 text-gray-600">Manage your imported contacts</p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowImportForm(!showImportForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Import Contact</span>
          </button>
        </div>

        {showImportForm && (
          <div className="card mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Import New Contact
            </h3>
            <form onSubmit={handleImportContact} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Contact Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="Enter contact name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="sourceAppId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Source App ID
                </label>
                <input
                  type="text"
                  id="sourceAppId"
                  value={newContact.sourceAppId}
                  onChange={(e) =>
                    setNewContact({
                      ...newContact,
                      sourceAppId: e.target.value,
                    })
                  }
                  className="input-field"
                  placeholder="Enter source app identifier"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button type="submit" className="btn-primary">
                  Import Contact
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No contacts yet
            </h3>
            <p className="text-gray-600 mb-6">
              Import your first contact to get started.
            </p>
            <button
              onClick={() => setShowImportForm(true)}
              className="btn-primary"
            >
              Import Your First Contact
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {contact.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Smartphone className="h-4 w-4" />
                      <span>App ID: {contact.sourceAppId}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-red-600 hover:text-red-800 transition-colors p-1"
                    title="Delete contact"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


