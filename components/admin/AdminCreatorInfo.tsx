
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { themeColors } from '@/lib/theme-colors';

interface AdminCreatorInfoProps {
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreatorInfo {
  name: string;
  username: string;
  image: string;
}

export default function AdminCreatorInfo({ createdById, createdAt: createdAtStr, updatedAt: updatedAtStr }: AdminCreatorInfoProps) {
  const { data: session } = useSession();
  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const createdAt = new Date(createdAtStr);
  const updatedAt = new Date(updatedAtStr);

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    const fetchCreatorInfo = async () => {
      try {
        const response = await fetch(`/api/users/${createdById}`);
        if (response.ok) {
          const data = await response.json();
          setCreatorInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch creator info', error);
      }
      setLoading(false);
    };

    fetchCreatorInfo();
  }, [createdById, session]);

  if (session?.user?.role !== 'admin') {
    return null;
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className={`absolute top-4 -right-4 transform translate-x-full p-4`}>
        <div className={`${themeColors.adminBubble.background} ${themeColors.blur} ${themeColors.shadow.panel} ${themeColors.util.roundedXl} p-4 w-64 space-y-4`}>
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className={`${themeColors.text.tertiary} ${themeColors.transition}`}>Chargement...</div>
                </div>
            ) : creatorInfo ? (
                <div className="space-y-4">
                    <div>
                        <div className={`text-xs font-medium ${themeColors.text.secondary} mb-2`}>Créé par</div>
                        <div className={`${themeColors.adminBubble.profileCard} ${themeColors.blurSm} border ${themeColors.border.secondary} ${themeColors.util.roundedLg} p-3 ${themeColors.transition}`}>
                            <div className="flex items-center gap-2">
                                {creatorInfo.image && (
                                    <img src={creatorInfo.image} alt="Avatar" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2 min-w-0">
                                        <span className={`text-sm font-medium ${themeColors.text.primary} truncate`}>
                                            {creatorInfo.name || 'Utilisateur'}
                                        </span>
                                        {creatorInfo.username && (
                                            <span className={`text-xs ${themeColors.text.tertiary} truncate`}>@{creatorInfo.username}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <span className={`text-xs font-medium ${themeColors.text.secondary}`}>Créé le</span>
                            <p className={`${themeColors.adminBubble.text}`}>{formatDate(createdAt)}</p>
                        </div>
                        {createdAt.getTime() !== updatedAt.getTime() && (
                            <div>
                                <span className={`text-xs font-medium ${themeColors.text.secondary}`}>Mis à jour le</span>
                                <p className={`${themeColors.adminBubble.text}`}>{formatDate(updatedAt)}</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    </div>
  );
}
