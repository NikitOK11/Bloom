"use client";

import { useState } from "react";

/**
 * KaggleProfileCard Component
 * 
 * Displays connected Kaggle profile data with stats and actions.
 * 
 * FEATURES:
 * - Shows username with link to Kaggle profile
 * - Displays rank tier with color-coded badge
 * - Shows medal counts if available
 * - Allows refresh and disconnect actions
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

interface KaggleProfileCardProps {
  profile: KaggleProfileData;
  userId: string;
  onDisconnect: () => void;
  onRefresh: () => void;
}

/**
 * Get color for Kaggle rank tier
 */
function getTierColor(tier: string | null): { bg: string; text: string; border: string } {
  if (!tier) {
    return { 
      bg: 'rgba(156, 163, 175, 0.2)', 
      text: 'rgb(107, 114, 128)', 
      border: 'rgba(156, 163, 175, 0.4)' 
    };
  }
  
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    "Grandmaster": { 
      bg: 'rgba(212, 175, 55, 0.2)', 
      text: 'rgb(161, 127, 20)', 
      border: 'rgba(212, 175, 55, 0.5)' 
    },
    "Master": { 
      bg: 'rgba(255, 106, 0, 0.2)', 
      text: 'rgb(204, 85, 0)', 
      border: 'rgba(255, 106, 0, 0.5)' 
    },
    "Expert": { 
      bg: 'rgba(123, 104, 238, 0.2)', 
      text: 'rgb(99, 79, 199)', 
      border: 'rgba(123, 104, 238, 0.5)' 
    },
    "Contributor": { 
      bg: 'rgba(0, 206, 209, 0.2)', 
      text: 'rgb(0, 139, 139)', 
      border: 'rgba(0, 206, 209, 0.5)' 
    },
    "Novice": { 
      bg: 'rgba(152, 216, 200, 0.2)', 
      text: 'rgb(45, 145, 122)', 
      border: 'rgba(152, 216, 200, 0.5)' 
    },
  };

  return colors[tier] || colors["Novice"];
}

export default function KaggleProfileCard({ 
  profile, 
  userId,
  onDisconnect,
  onRefresh,
}: KaggleProfileCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tierColors = getTierColor(profile.rankTier);
  const hasMedals = profile.medalsGold !== null || 
                   profile.medalsSilver !== null || 
                   profile.medalsBronze !== null;
  const hasStats = hasMedals || profile.competitionsCount !== null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/integrations/kaggle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to refresh");
        return;
      }

      onRefresh();
    } catch (err) {
      console.error("Error refreshing:", err);
      setError("Failed to refresh profile");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/integrations/kaggle?userId=${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to disconnect");
        return;
      }

      onDisconnect();
    } catch (err) {
      console.error("Error disconnecting:", err);
      setError("Failed to disconnect profile");
    } finally {
      setIsDisconnecting(false);
      setShowDisconnectConfirm(false);
    }
  };

  // Format last synced date
  const lastSyncedDate = new Date(profile.lastSyncedAt);
  const formattedSyncDate = lastSyncedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="card p-4">
      {/* Header with Kaggle Logo */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Kaggle Logo/Icon */}
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(32, 190, 255, 0.1)' }}
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-6 h-6"
              fill="#20beff"
            >
              <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.281.18.046.149.034.255-.036.315l-6.555 6.344 6.836 8.507c.095.104.117.208.075.285z"/>
            </svg>
          </div>
          <div>
            <h4 
              className="font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Kaggle
            </h4>
            <a
              href={profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline"
              style={{ color: 'var(--accent-color)' }}
            >
              @{profile.username} ↗
            </a>
          </div>
        </div>

        {/* Rank Tier Badge */}
        {profile.rankTier && (
          <span 
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{ 
              background: tierColors.bg,
              color: tierColors.text,
              border: `1px solid ${tierColors.border}`,
            }}
          >
            {profile.rankTier}
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="p-2 rounded text-sm mb-4"
          style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: 'rgb(220, 38, 38)',
          }}
        >
          {error}
        </div>
      )}

      {/* Stats */}
      {hasStats && (
        <div 
          className="grid grid-cols-4 gap-2 mb-4 p-3 rounded-lg"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          {/* Medals */}
          {hasMedals && (
            <>
              <div className="text-center">
                <div className="text-xl">🥇</div>
                <div 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {profile.medalsGold ?? 0}
                </div>
                <div 
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Gold
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl">🥈</div>
                <div 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {profile.medalsSilver ?? 0}
                </div>
                <div 
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Silver
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl">🥉</div>
                <div 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {profile.medalsBronze ?? 0}
                </div>
                <div 
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Bronze
                </div>
              </div>
            </>
          )}

          {/* Competitions */}
          {profile.competitionsCount !== null && (
            <div className="text-center">
              <div className="text-xl">🏆</div>
              <div 
                className="text-lg font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {profile.competitionsCount}
              </div>
              <div 
                className="text-xs"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Competitions
              </div>
            </div>
          )}
        </div>
      )}

      {/* No stats message */}
      {!hasStats && (
        <div 
          className="text-sm mb-4 p-3 rounded-lg text-center"
          style={{ 
            background: 'var(--bg-tertiary)',
            color: 'var(--text-tertiary)',
          }}
        >
          No detailed stats available. Provide your API token when refreshing to get full data.
        </div>
      )}

      {/* Last synced info */}
      <div 
        className="text-xs mb-4"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Last synced: {formattedSyncDate}
      </div>

      {/* Disconnect Confirmation */}
      {showDisconnectConfirm ? (
        <div 
          className="p-3 rounded-lg mb-3"
          style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <p 
            className="text-sm mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Are you sure you want to disconnect your Kaggle profile?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="btn text-sm px-3 py-1"
              style={{ 
                background: 'rgb(220, 38, 38)', 
                color: 'white',
              }}
            >
              {isDisconnecting ? "Disconnecting..." : "Yes, Disconnect"}
            </button>
            <button
              onClick={() => setShowDisconnectConfirm(false)}
              disabled={isDisconnecting}
              className="btn btn-secondary text-sm px-3 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Actions */
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary text-sm flex-1"
          >
            {isRefreshing ? (
              <>
                <span 
                  className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin mr-1 inline-block"
                />
                Refreshing...
              </>
            ) : (
              "↻ Refresh"
            )}
          </button>
          <button
            onClick={() => setShowDisconnectConfirm(true)}
            className="btn text-sm px-3"
            style={{ 
              background: 'transparent',
              color: 'rgb(156, 163, 175)',
              border: '1px solid rgba(156, 163, 175, 0.3)',
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
