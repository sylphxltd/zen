/**
 * Icon component - Placeholder (unplugin-icons disabled)
 * TODO: Re-enable unplugin-icons or use alternative icon solution
 */

interface IconProps {
  icon: string;
  class?: string;
  style?: Record<string, string>;
  width?: string | number;
  height?: string | number;
}

// Simple icon emoji mapping for common icons
const iconEmojis: Record<string, string> = {
  'lucide:zap': '⚡',
  'lucide:search': '🔍',
  'lucide:file-text': '📄',
  'lucide:search-x': '✖️',
  'lucide:play': '▶️',
  'lucide:square': '⬜',
  'lucide:rotate-ccw': '↺',
  'lucide:info': 'ℹ️',
  'lucide:sun': '☀️',
  'lucide:moon': '🌙',
  'mdi:home': '🏠',
  'heroicons:user': '👤',
  'ph:heart-fill': '❤️',
};

export function Icon(props: IconProps) {
  const { icon, class: className, style, width, height } = props;

  const emoji = iconEmojis[icon] || '❓';

  const sizeStyle = {
    ...(style || {}),
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <span class={className} style={sizeStyle}>
      {emoji}
    </span>
  );
}
