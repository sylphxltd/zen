/**
 * Icon component using unplugin-icons (build-time compilation)
 * Automatically imports icons as components at build time
 * @see https://github.com/unplugin/unplugin-icons
 */

// Import commonly used icons at build time
import IconLucideZap from '~icons/lucide/zap';
import IconLucideSearch from '~icons/lucide/search';
import IconLucideFileText from '~icons/lucide/file-text';
import IconLucideSearchX from '~icons/lucide/search-x';
import IconLucidePlay from '~icons/lucide/play';
import IconLucideSquare from '~icons/lucide/square';
import IconLucideRotateCcw from '~icons/lucide/rotate-ccw';
import IconLucideInfo from '~icons/lucide/info';
import IconLucideSun from '~icons/lucide/sun';
import IconLucideMoon from '~icons/lucide/moon';
import IconMdiHome from '~icons/mdi/home';
import IconHeroiconsUser from '~icons/heroicons/user';
import IconPhHeartFill from '~icons/ph/heart-fill';

interface IconProps {
  icon: string;
  class?: string;
  style?: Record<string, string>;
  width?: string | number;
  height?: string | number;
}

// Icon registry - maps icon names to components
const iconRegistry: Record<string, any> = {
  'lucide:zap': IconLucideZap,
  'lucide:search': IconLucideSearch,
  'lucide:file-text': IconLucideFileText,
  'lucide:search-x': IconLucideSearchX,
  'lucide:play': IconLucidePlay,
  'lucide:square': IconLucideSquare,
  'lucide:rotate-ccw': IconLucideRotateCcw,
  'lucide:info': IconLucideInfo,
  'lucide:sun': IconLucideSun,
  'lucide:moon': IconLucideMoon,
  'mdi:home': IconMdiHome,
  'heroicons:user': IconHeroiconsUser,
  'ph:heart-fill': IconPhHeartFill,
};

export function Icon(props: IconProps) {
  const { icon, class: className, style, width, height } = props;

  const IconComponent = iconRegistry[icon];

  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found in registry`);
    return <span class={className}>?</span>;
  }

  // Create wrapper span with custom width/height if specified
  const iconElement = <IconComponent class={className} style={style} />;

  if (width || height) {
    const sizeStyle = {
      ...(style || {}),
      ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
      ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
    };
    return (
      <span class={`inline-flex ${className || ''}`} style={sizeStyle}>
        {iconElement}
      </span>
    );
  }

  return iconElement;
}
