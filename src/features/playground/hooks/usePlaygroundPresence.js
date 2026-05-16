import { useEffect, useMemo, useRef, useState } from 'react';
import supabase from '../../../utils/supabase.js';
import { PRESENCE_ANIMALS, PRESENCE_NAMES } from '../playground.constants';

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

  useEffect(() => {
    let mounted = true;
    let channel = null;

    async function connect() {
      if (!workbookId) return;

      const { data } = await supabase.auth.getUser();
      const user = data?.user || null;
      if (!mounted) return;

      setCurrentUser(user);

      const name = getUserName(user);
      const userId = user?.id || `guest-${getOrCreateGuestName().replace(/\s+/g, '-').toLowerCase()}`;

      channel = supabase.channel(`playground-presence-${workbookId}`, {
        config: {
          presence: {
            key: userId,
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
              isSelf: key === userId,
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
      if (channel) supabase.removeChannel(channel);
    };
  }, [workbookId, pageMode]);

  useEffect(() => {
    if (!workbookId) return;

    const channel = channelRef.current;
    if (!channel) return;

    const name = getUserName(currentUser);
    channel.track({
      name,
      email: currentUser?.email || '',
      isGuest: !currentUser,
      sheet: activeSheetName || 'Hoja',
      pageMode,
      activeCell: activeCellLabel || '',
      onlineAt: new Date().toISOString(),
    });
  }, [workbookId, activeSheetName, activeCellLabel, currentUser, pageMode]);

  return useMemo(() => members, [members]);
}
