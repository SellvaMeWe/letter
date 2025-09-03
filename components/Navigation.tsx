"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "./Avatar";
import { Mail, Send, Users, Upload, LogOut } from "lucide-react";

export default function Navigation() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              href="/inbox"
              className="flex items-center space-x-2 text-xl font-bold text-primary-600"
            >
              <Mail className="h-8 w-8" />
              <span>Letter App</span>
            </Link>

            <div className="flex items-center space-x-6">
              <Link
                href="/inbox"
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span>Inbox</span>
              </Link>

              <Link
                href="/sent"
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Send className="h-5 w-5" />
                <span>Sent</span>
              </Link>

              <Link
                href="/contacts"
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Users className="h-5 w-5" />
                <span>Contacts</span>
              </Link>

              <Link
                href="/upload"
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span>Send Letter</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {user.name && (
                <Avatar photoUrl={user.photoUrl} name={user.name} size="sm" />
              )}
              <span className="text-sm text-gray-600">
                {user.name ? user.name : `User: ${user.uid.slice(0, 8)}...`}
              </span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
