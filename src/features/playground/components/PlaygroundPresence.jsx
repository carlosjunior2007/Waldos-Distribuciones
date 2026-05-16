import { useEffect, useRef, useState } from 'react';
import { UsersRound } from 'lucide-react';

function initials(name = '') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function displayName(member = {}) {
  return member.name || member.email || 'Usuario';
}

export default function PlaygroundPresence({ members = [] }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const otherMembers = members.filter((member) => !member?.isSelf);
  const visibleMembers = otherMembers.slice(0, 4);
  const extra = Math.max(otherMembers.length - visibleMembers.length, 0);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <UsersRound className="h-4 w-4 text-slate-500" />
        <span>{otherMembers.length ? `${otherMembers.length} conectado${otherMembers.length === 1 ? '' : 's'}` : 'Solo tú'}</span>

        {otherMembers.length > 0 ? (
          <div className="ml-1 flex -space-x-2">
            {visibleMembers.map((member, index) => (
              <span
                key={`${member.key || member.name || index}-${index}`}
                title={displayName(member)}
                className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-[10px] font-black text-white shadow-sm"
              >
                {initials(displayName(member))}
                <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
              </span>
            ))}

            {extra > 0 ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-black text-slate-700 shadow-sm">
                +{extra}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">Solo tú</span>
        )}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
            <p className="text-sm font-black text-slate-900">Usuarios en la hoja</p>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
              {otherMembers.length || 1}
            </span>
          </div>

          {otherMembers.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">TÚ</span>
              <div>
                <p className="text-sm font-bold text-slate-900">Solo tú</p>
                <p className="text-xs text-slate-500">No hay más usuarios conectados.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              {otherMembers.map((member, index) => (
                <div key={`${member.key || member.name || index}-row`} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                    {initials(displayName(member))}
                    <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{displayName(member)}</p>
                    <p className="truncate text-xs text-slate-500">{member.pageMode ? `${member.pageMode} · ` : ''}{member.sheet || 'Hoja activa'}</p>
                    <p className="mt-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">
                      {member.activeCell ? `Celda ${member.activeCell}` : 'Sin celda activa'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
