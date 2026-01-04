"use client";

import { useState, useEffect } from "react";
import ProfileForm from "@/components/ProfileForm";

/**
 * User data from API
 */
interface UserData {
  id: string;
  name: string;
  email: string;
}

/**
 * Profile Page
 * 
 * Allows users to create/edit their extended profile.
 * In MVP without auth, users select their identity from a dropdown.
 * In production, this would load the authenticated user automatically.
 * 
 * PRIVACY NOTE: This page only allows editing your own profile.
 * Viewing other users' profiles is restricted and handled separately.
 */
export default function ProfilePage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Fetch available users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setUsers(data.data);
          setSelectedUserId(data.data[0].id);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
        <div className="card bg-yellow-50 border-yellow-200">
          <p className="text-yellow-700">
            No users found. Please create a user first before setting up your profile.
          </p>
        </div>
      </div>
    );
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
      <p className="text-gray-600 mb-6">
        Complete your profile to help team leaders learn more about you when reviewing join requests.
      </p>

      {/* User Selector (MVP - would be replaced with auth in production) */}
      <div className="card bg-gray-50 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Editing profile as (demo):
        </label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {/* Current User Info */}
      {selectedUser && (
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl text-primary-700 font-bold">
                {selectedUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedUser.name}
              </h2>
              <p className="text-gray-500">{selectedUser.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      {selectedUserId && (
        <ProfileForm
          key={selectedUserId} // Force remount when user changes
          userId={selectedUserId}
        />
      )}
    </div>
  );
}
