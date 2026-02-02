"use client";

import { useState, useEffect } from "react";
import KaggleConnectForm from "./KaggleConnectForm";
import KaggleProfileCard from "./KaggleProfileCard";

/**
 * ConnectedPlatforms Component
 * 
 * Displays a user's connected external platform profiles.
 * Currently supports Kaggle, but architecture allows easy addition of:
 * - GitHub
 * - Codeforces
 * - LeetCode
 * - etc.
 * 
 * DESIGN PRINCIPLES:
 * - Each platform is isolated in its own section
 * - Users can connect/disconnect independently
 * - Only public data is displayed
 * - Clear privacy messaging
 */

interface KaggleProfileData {
  id: string;
  username: string;
  profileUrl: string;
  rankTier: string | null;
  medalsGold: number | null;
  medalsSilver: number | null;
  medalsBronze: number | null;
  competitionsCount: number | null;
  lastSyncedAt: string;
}

interface ConnectedPlatformsProps {
  userId: string;
}

export default function ConnectedPlatforms({ userId }: ConnectedPlatformsProps) {
  const [kaggleProfile, setKaggleProfile] = useState<KaggleProfileData | null>(null);
  const [isLoadingKaggle, setIsLoadingKaggle] = useState(true);
  const [showKaggleConnect, setShowKaggleConnect] = useState(false);

  // Fetch Kaggle profile on mount
  useEffect(() => {
    fetchKaggleProfile();
  }, [userId]);

  const fetchKaggleProfile = async () => {
    if (!userId) return;
    
    setIsLoadingKaggle(true);
    try {
      const response = await fetch(`/api/integrations/kaggle?userId=${userId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setKaggleProfile(data.data);
      } else {
        setKaggleProfile(null);
      }
    } catch (err) {
      console.error("Error fetching Kaggle profile:", err);
      setKaggleProfile(null);
    } finally {
      setIsLoadingKaggle(false);
    }
  };

  const handleKaggleConnected = () => {
    setShowKaggleConnect(false);
    fetchKaggleProfile();
  };

  const handleKaggleDisconnected = () => {
    setKaggleProfile(null);
  };

  const handleKaggleRefreshed = () => {
    fetchKaggleProfile();
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Connected Platforms
        </h3>
        <span 
          className="text-xs px-2 py-1 rounded"
          style={{ 
            background: 'rgba(59, 130, 246, 0.1)',
            color: 'rgb(59, 130, 246)',
          }}
        >
          Public data only
        </span>
      </div>

      <p 
        className="text-sm mb-6"
        style={{ color: 'var(--text-secondary)' }}
      >
        Connect your competition profiles to showcase your achievements. 
        Only publicly visible information is displayed.
      </p>

      {/* Kaggle Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span 
            className="text-sm font-medium"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Data Science & ML
          </span>
        </div>

        {/* Loading State */}
        {isLoadingKaggle && (
          <div 
            className="card p-4 flex items-center justify-center"
            style={{ minHeight: '100px' }}
          >
            <div 
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--accent-color)', borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {/* Kaggle Connected */}
        {!isLoadingKaggle && kaggleProfile && (
          <KaggleProfileCard
            profile={kaggleProfile}
            userId={userId}
            onDisconnect={handleKaggleDisconnected}
            onRefresh={handleKaggleRefreshed}
          />
        )}

        {/* Kaggle Not Connected - Show Connect Button or Form */}
        {!isLoadingKaggle && !kaggleProfile && (
          <>
            {showKaggleConnect ? (
              <div className="card p-4">
                <KaggleConnectForm
                  userId={userId}
                  onSuccess={handleKaggleConnected}
                  onCancel={() => setShowKaggleConnect(false)}
                />
              </div>
            ) : (
              <div 
                className="card p-4 flex items-center justify-between"
                style={{ border: '1px dashed var(--border-color)' }}
              >
                <div className="flex items-center gap-3">
                  {/* Kaggle Logo */}
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(32, 190, 255, 0.1)' }}
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      className="w-5 h-5"
                      fill="#20beff"
                    >
                      <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.281.18.046.149.034.255-.036.315l-6.555 6.344 6.836 8.507c.095.104.117.208.075.285z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 
                      className="font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Kaggle
                    </h4>
                    <p 
                      className="text-sm"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      Show your competition rankings and medals
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowKaggleConnect(true)}
                  className="btn btn-secondary"
                >
                  Connect
                </button>
              </div>
            )}
          </>
        )}

        {/* Future Platforms Placeholder */}
        <div 
          className="text-xs p-3 rounded-lg"
          style={{ 
            background: 'var(--bg-tertiary)',
            color: 'var(--text-tertiary)',
          }}
        >
          <strong>Coming soon:</strong> GitHub, Codeforces, LeetCode
        </div>
      </div>
    </div>
  );
}
