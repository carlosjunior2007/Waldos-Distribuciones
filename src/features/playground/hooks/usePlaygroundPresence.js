import { useEffect, useMemo, useRef, useState } from 'react';
import supabase from '../../../utils/supabase.js';
import { PRESENCE_ANIMALS, PRESENCE_NAMES } from '../playground.constants';
import { getCurrentPlaygroundUser } from '../services/playground.service';

function getOrCreateGuestName() {
  if (typeof window === 'undefined') return 'Oso Juan';

  const key = 'waldo_playground_guest_name';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const animal = PRESENCE_ANIMALS[Math.floor(Math.random() * PRESENCE_ANIMALS.length)] || 'Oso';
  const name = PRESENCE_NAMES[Math.floor(Math.random() * PRESENCE_NAMES.length)] || 'Juan';
  const value = `${animal} ${name}`;
  window.localStorage.setItem(key, value);
  return value;
}

function getOrCreateTabId() {
  if (typeof window === 'undefined') return `tab-${Date.now()}`;

  const key = 'waldo_playground_tab_id';
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;

  const value =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? `tab-${crypto.randomUUID()}`
      : `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.sessionStorage.setItem(key, value);
  return value;
}

function getUserName(user) {
  const metadataName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name;

  if (metadataName) return metadataName;
  if (user?.email) return user.email.split('@')[0];
  return getOrCreateGuestName();
}

export function usePlaygroundPresence(workbookId, activeSheetName, pageMode = 'editando', activeCellLabel = '') {
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const channelRef = useRef(null);
  const trackTimerRef = useRef(null);
  const identityRef = useRef({ tabId: getOrCreateTabId(), presenceKey: '' });

  useEffect(() => {
    let mounted = true;
    let channel = null;

    async function connect() {
      if (!workbookId) return;

      const user = await getCurrentPlaygroundUser().catch(() => null);
      if (!mounted) return;

      setCurrentUser(user);

      const name = getUserName(user);
      const baseUserId = user?.id || `guest-${getOrCreateGuestName().replace(/\s+/g, '-').toLowerCase()}`;
      const tabId = identityRef.current.tabId;
      const presenceKey = `${baseUserId}:${tabId}`;
      identityRef.current.presenceKey = presenceKey;

      channel = supabase.channel(`playground-presence-${workbookId}`, {
        config: {
          presence: {
            key: presenceKey,
          },
        },
      });

      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const nextMembers = Object.entries(state).flatMap(([key, presences]) =>
            presences.map((presence) => ({
              key,
              isSelf: key === identityRef.current.presenceKey || presence.tabId === identityRef.current.tabId,
              name: presence.name || 'Usuario',
              email: presence.email || '',
              isGuest: Boolean(presence.isGuest),
              sheet: presence.sheet || '',
              pageMode: presence.pageMode || '',
              activeCell: presence.activeCell || '',
              onlineAt: presence.onlineAt,
            })),
          );

          setMembers(nextMembers);
        })
        .subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') return;

          await channel.track({
            name,
            email: user?.email || '',
            isGuest: !user,
            tabId: identityRef.current.tabId,
            sheet: activeSheetName || 'Hoja',
            pageMode,
            activeCell: activeCellLabel || '',
            onlineAt: new Date().toISOString(),
          });
        });
    }

    connect();

    return () => {
      mounted = false;
      if (trackTimerRef.current) {
        window.clearTimeout(trackTimerRef.current);
        trackTimerRef.current = null;
      }
      if (channel) supabase.removeChannel(channel);
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, [workbookId]);

  useEffect(() => {
    if (!workbookId) return undefined;

    const channel = channelRef.current;
    if (!channel) return undefined;

    if (trackTimerRef.current) {
      window.clearTimeout(trackTimerRef.current);
    }

    trackTimerRef.current = window.setTimeout(() => {
      const name = getUserName(currentUser);
      channel.track({
        name,
        email: currentUser?.email || '',
        isGuest: !currentUser,
        tabId: identityRef.current.tabId,
        sheet: activeSheetName || 'Hoja',
        pageMode,
        activeCell: activeCellLabel || '',
        onlineAt: new Date().toISOString(),
      });
    }, 250);

    return () => {
      if (trackTimerRef.current) {
        window.clearTimeout(trackTimerRef.current);
        trackTimerRef.current = null;
      }
    };
  }, [workbookId, activeSheetName, activeCellLabel, currentUser, pageMode]);

  return useMemo(() => members, [members]);
}
