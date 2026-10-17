import React from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#030712] text-white p-8">
      <div className="max-w-3xl mx-auto rounded-2xl border border-gray-800 bg-[#0a0a0a] p-8 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-[#06B6D4]">Admin</p>
        <h1 className="mt-3 text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-4 text-gray-400">
          Welcome{user?.fullName ? `, ${user.fullName}` : ""}. This is the admin landing page.
        </p>
      </div>
    </div>
  );
}
