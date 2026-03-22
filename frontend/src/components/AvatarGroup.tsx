import { useState } from 'react';

interface User {
  id: number;
  full_name: string;
  avatar: string;
}

interface AvatarGroupProps {
  users: User[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizePx = { sm: 24, md: 32, lg: 40 } as const;
const textSize = { sm: 'text-[8px]', md: 'text-[10px]', lg: 'text-xs' } as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function Avatar({ user, px, isFirst }: { user: User; px: number; isFirst: boolean }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="rounded-full border-2 border-surface bg-surface-container-high flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: px,
        height: px,
        marginLeft: isFirst ? 0 : -8,
      }}
      title={user.full_name}
    >
      {!failed && user.avatar ? (
        <img
          src={user.avatar}
          alt={user.full_name}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className={`font-[Space_Grotesk] font-semibold text-muted select-none ${textSize[Object.entries(sizePx).find(([, v]) => v === px)?.[0] as keyof typeof textSize ?? 'md']}`}
        >
          {getInitials(user.full_name)}
        </span>
      )}
    </div>
  );
}

export default function AvatarGroup({ users, maxVisible = 5, size = 'md' }: AvatarGroupProps) {
  const px = sizePx[size];
  const visible = users.slice(0, maxVisible);
  const overflow = users.length - maxVisible;

  return (
    <div className="flex items-center">
      {visible.map((user, i) => (
        <Avatar key={user.id} user={user} px={px} isFirst={i === 0} />
      ))}
      {overflow > 0 && (
        <div
          className={`rounded-full border-2 border-surface bg-surface-container-highest flex items-center justify-center shrink-0 font-[Space_Grotesk] font-semibold text-muted ${textSize[size]}`}
          style={{ width: px, height: px, marginLeft: -8 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
