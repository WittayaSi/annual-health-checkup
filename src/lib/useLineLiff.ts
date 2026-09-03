'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { loginWithLineAction } from '@/app/actions';

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export function useLineLiff() {
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [isInLineClient, setIsInLineClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
    if (!liffId) {
      console.warn('LINE LIFF ID is not defined in NEXT_PUBLIC_LINE_LIFF_ID');
      setIsLiffReady(true);
      return;
    }

    liff
      .init({ liffId })
      .then(async () => {
        setIsLiffReady(true);
        const inClient = liff.isInClient();
        setIsInLineClient(inClient);

        if (liff.isLoggedIn()) {
          try {
            const profile = await liff.getProfile();
            const userProfile: LineProfile = {
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
              statusMessage: profile.statusMessage,
            };
            setLineProfile(userProfile);

            // Auto-login if user is already linked in MySQL DB
            await loginWithLineAction(profile.userId);
          } catch (e: unknown) {
            console.error('Failed to get LINE profile:', e);
          }
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'LIFF initialization failed';
        console.error('LIFF Init Error:', err);
        setError(msg);
        setIsLiffReady(true);
      });
  }, []);

  return { lineProfile, isLiffReady, isInLineClient, error, liff };
}
