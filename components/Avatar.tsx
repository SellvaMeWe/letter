"use client";

import React, { useState } from "react";
import { User } from "lucide-react";

interface AvatarProps {
  photoUrl?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  photoUrl,
  name,
  size = "md",
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getPhotoUrl = () => {
    if (photoUrl) {

      // If photoUrl is a relative path, prepend the host
      const host =
        process.env.NEXT_PUBLIC_HOST || process.env.NEXT_PUBLIC_MEWE_HOST;
      if (host) {
        const fullUrl = `${host}${photoUrl}`;
        console.log("Using host + photoUrl:", fullUrl);
        return fullUrl;
      }

      // Fallback: return the photoUrl as is if no host is configured
      console.log("No host configured, using photoUrl as is:", photoUrl);
      return photoUrl;
    }
    return `https://ui-avatars.com/api/?name=${name}&background=random&rounded=true`;
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ${className}`}
    >
      {photoUrl && !imageError ? (
        <img
          src={getPhotoUrl()}
          alt={name || "Avatar"}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
          {name ? (
            getInitials(name)
          ) : (
            <User
              className={`${
                size === "sm"
                  ? "h-4 w-4"
                  : size === "md"
                  ? "h-5 w-5"
                  : "h-6 w-6"
              }`}
            />
          )}
        </div>
      )}
    </div>
  );
};
