"use client";

import { useState } from "react";

/**
 * KaggleConnectForm Component
 * 
 * A form that allows users to connect their Kaggle account.
 * 
 * FLOW:
 * 1. User enters Kaggle username (required)
 * 2. User optionally provides API token for full data
 * 3. On submit, we fetch and store public Kaggle data
 * 
 * SECURITY & PRIVACY:
 * - API token is used ONLY during the fetch, never stored
 * - Only public Kaggle data is retrieved and displayed
 * - User is informed about what data is accessed
 */

interface KaggleConnectFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function KaggleConnectForm({ 
  userId, 
  onSuccess,
  onCancel,
}: KaggleConnectFormProps) {
  const [kaggleUsername, setKaggleUsername] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!kaggleUsername.trim()) {
      setError("Please enter your Kaggle username");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/integrations/kaggle/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          kaggleUsername: kaggleUsername.trim(),
          // Only send API token if provided (it won't be stored)
          ...(apiToken.trim() && { apiToken: apiToken.trim() }),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to connect Kaggle profile");
        return;
      }

      // Success - clear form and notify parent
      setKaggleUsername("");
      setApiToken("");
      onSuccess();
    } catch (err) {
      console.error("Error connecting Kaggle:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Connect Kaggle Account
        </h3>
        <p 
          className="text-sm mb-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          Link your Kaggle profile to display your competition stats and achievements.
          Only public data will be shown.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="p-3 rounded-lg text-sm"
          style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'rgb(220, 38, 38)',
          }}
        >
          {error}
        </div>
      )}

      {/* Kaggle Username */}
      <div>
        <label 
          htmlFor="kaggleUsername"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Kaggle Username <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="kaggleUsername"
          value={kaggleUsername}
          onChange={(e) => setKaggleUsername(e.target.value)}
          placeholder="e.g., johndoe"
          className="input w-full"
          disabled={isSubmitting}
          required
        />
        <p 
          className="text-xs mt-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Your username from kaggle.com/username
        </p>
      </div>

      {/* API Token (Optional) */}
      <div>
        <label 
          htmlFor="apiToken"
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          API Token <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
        </label>
        <input
          type="password"
          id="apiToken"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          placeholder="Your Kaggle API key"
          className="input w-full"
          disabled={isSubmitting}
        />
        <p 
          className="text-xs mt-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Provides full stats. Get it from kaggle.com/settings → API → Create New Token.
          <br />
          <strong>Note:</strong> Token is used only once and NOT stored.
        </p>
      </div>

      {/* Privacy Notice */}
      <div 
        className="p-3 rounded-lg text-xs"
        style={{ 
          background: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: 'var(--text-secondary)',
        }}
      >
        <strong>📋 What we access:</strong>
        <ul className="mt-1 list-disc list-inside">
          <li>Username and profile link</li>
          <li>Rank/tier (if available)</li>
          <li>Medal counts (gold, silver, bronze)</li>
          <li>Competition count</li>
        </ul>
        <p className="mt-2">
          We never access private data, submissions, or notebooks.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary flex-1"
        >
          {isSubmitting ? (
            <>
              <span 
                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin mr-2 inline-block"
                style={{ borderColor: 'white', borderTopColor: 'transparent' }}
              />
              Connecting...
            </>
          ) : (
            "Connect Kaggle"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
