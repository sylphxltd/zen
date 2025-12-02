/**
 * Icon component using unplugin-icons with Iconify
 *
 * Usage:
 * - <Icon icon="lucide:sun" width="20" height="20" />
 * - <Icon icon="mdi:home" class="custom-class" />
 *
 * Icon format: "collection:name" (e.g., "lucide:sun", "mdi:home")
 */

import IconHeroiconsUser from '~icons/heroicons/user';
import IconLucideAtom from '~icons/lucide/atom';
import IconLucideBarChart from '~icons/lucide/bar-chart';
import IconLucideBell from '~icons/lucide/bell';
import IconLucideBookOpen from '~icons/lucide/book-open';
import IconLucideBox from '~icons/lucide/box';
import IconLucideBrain from '~icons/lucide/brain';
import IconLucideCheck from '~icons/lucide/check';
import IconLucideCheckSquare from '~icons/lucide/check-square';
import IconLucideChevronDown from '~icons/lucide/chevron-down';
import IconLucideCircleDot from '~icons/lucide/circle-dot';
import IconLucideCloud from '~icons/lucide/cloud';
import IconLucideCode from '~icons/lucide/code';
import IconLucideCode2 from '~icons/lucide/code-2';
import IconLucideComponent from '~icons/lucide/component';
import IconLucideFeather from '~icons/lucide/feather';
import IconLucideFileText from '~icons/lucide/file-text';
import IconLucideFlame from '~icons/lucide/flame';
import IconLucideFolder from '~icons/lucide/folder';
import IconLucideFolderOpen from '~icons/lucide/folder-open';
import IconLucideGauge from '~icons/lucide/gauge';
import IconLucideGem from '~icons/lucide/gem';
import IconLucideGithub from '~icons/lucide/github';
import IconLucideGlobe from '~icons/lucide/globe';
import IconLucideHash from '~icons/lucide/hash';
import IconLucideInfo from '~icons/lucide/info';
import IconLucideLayers from '~icons/lucide/layers';
import IconLucideLayout from '~icons/lucide/layout';
import IconLucideLeaf from '~icons/lucide/leaf';
import IconLucideLightbulb from '~icons/lucide/lightbulb';
import IconLucideList from '~icons/lucide/list';
import IconLucideLoader from '~icons/lucide/loader';
import IconLucideMenu from '~icons/lucide/menu';
import IconLucideMoon from '~icons/lucide/moon';
import IconLucideMousePointerClick from '~icons/lucide/mouse-pointer-click';
import IconLucidePackage from '~icons/lucide/package';
import IconLucidePalette from '~icons/lucide/palette';
import IconLucidePlay from '~icons/lucide/play';
import IconLucidePlayCircle from '~icons/lucide/play-circle';
import IconLucidePlug from '~icons/lucide/plug';
import IconLucideRepeat from '~icons/lucide/repeat';
import IconLucideRocket from '~icons/lucide/rocket';
import IconLucideRotateCcw from '~icons/lucide/rotate-ccw';
import IconLucideScroll from '~icons/lucide/scroll';
import IconLucideSearch from '~icons/lucide/search';
import IconLucideShare from '~icons/lucide/share';
import IconLucideShare2 from '~icons/lucide/share-2';
import IconLucideSmartphone from '~icons/lucide/smartphone';
import IconLucideSparkles from '~icons/lucide/sparkles';
import IconLucideSquare from '~icons/lucide/square';
import IconLucideSquareCode from '~icons/lucide/square-code';
import IconLucideStar from '~icons/lucide/star';
import IconLucideSun from '~icons/lucide/sun';
import IconLucideTarget from '~icons/lucide/target';
import IconLucideTerminal from '~icons/lucide/terminal';
import IconLucideTextCursor from '~icons/lucide/text-cursor';
import IconLucideTriangle from '~icons/lucide/triangle';
import IconLucideType from '~icons/lucide/type';
import IconLucideWind from '~icons/lucide/wind';
import IconLucideWrench from '~icons/lucide/wrench';
import IconLucideX from '~icons/lucide/x';
import IconLucideXCircle from '~icons/lucide/x-circle';
import IconLucideZap from '~icons/lucide/zap';
import IconMdiHome from '~icons/mdi/home';
import IconPhHeartFill from '~icons/ph/heart-fill';

interface IconProps {
  icon: string;
  class?: string;
  style?: Record<string, string>;
  width?: string | number;
  height?: string | number;
}

// Map icon names to raw SVG strings
const iconMap: Record<string, string> = {
  // Lucide icons
  'lucide:atom': IconLucideAtom,
  'lucide:bar-chart': IconLucideBarChart,
  'lucide:bell': IconLucideBell,
  'lucide:book-open': IconLucideBookOpen,
  'lucide:box': IconLucideBox,
  'lucide:brain': IconLucideBrain,
  'lucide:check': IconLucideCheck,
  'lucide:check-square': IconLucideCheckSquare,
  'lucide:chevron-down': IconLucideChevronDown,
  'lucide:circle-dot': IconLucideCircleDot,
  'lucide:cloud': IconLucideCloud,
  'lucide:code': IconLucideCode,
  'lucide:code-2': IconLucideCode2,
  'lucide:component': IconLucideComponent,
  'lucide:feather': IconLucideFeather,
  'lucide:file-text': IconLucideFileText,
  'lucide:flame': IconLucideFlame,
  'lucide:folder': IconLucideFolder,
  'lucide:folder-open': IconLucideFolderOpen,
  'lucide:gauge': IconLucideGauge,
  'lucide:gem': IconLucideGem,
  'lucide:github': IconLucideGithub,
  'lucide:globe': IconLucideGlobe,
  'lucide:hash': IconLucideHash,
  'lucide:info': IconLucideInfo,
  'lucide:layers': IconLucideLayers,
  'lucide:layout': IconLucideLayout,
  'lucide:leaf': IconLucideLeaf,
  'lucide:lightbulb': IconLucideLightbulb,
  'lucide:list': IconLucideList,
  'lucide:loader': IconLucideLoader,
  'lucide:menu': IconLucideMenu,
  'lucide:moon': IconLucideMoon,
  'lucide:mouse-pointer-click': IconLucideMousePointerClick,
  'lucide:package': IconLucidePackage,
  'lucide:palette': IconLucidePalette,
  'lucide:play': IconLucidePlay,
  'lucide:play-circle': IconLucidePlayCircle,
  'lucide:plug': IconLucidePlug,
  'lucide:repeat': IconLucideRepeat,
  'lucide:rocket': IconLucideRocket,
  'lucide:rotate-ccw': IconLucideRotateCcw,
  'lucide:scroll': IconLucideScroll,
  'lucide:search': IconLucideSearch,
  'lucide:search-x': IconLucideX,
  'lucide:share': IconLucideShare,
  'lucide:share-2': IconLucideShare2,
  'lucide:smartphone': IconLucideSmartphone,
  'lucide:sparkles': IconLucideSparkles,
  'lucide:square': IconLucideSquare,
  'lucide:square-code': IconLucideSquareCode,
  'lucide:star': IconLucideStar,
  'lucide:sun': IconLucideSun,
  'lucide:target': IconLucideTarget,
  'lucide:terminal': IconLucideTerminal,
  'lucide:text-cursor': IconLucideTextCursor,
  'lucide:triangle': IconLucideTriangle,
  'lucide:type': IconLucideType,
  'lucide:wind': IconLucideWind,
  'lucide:wrench': IconLucideWrench,
  'lucide:x': IconLucideX,
  'lucide:x-circle': IconLucideXCircle,
  'lucide:zap': IconLucideZap,
  // Other icon sets
  'mdi:home': IconMdiHome,
  'heroicons:user': IconHeroiconsUser,
  'ph:heart-fill': IconPhHeartFill,
};

export function Icon(props: IconProps) {
  const { icon, class: className, style, width, height } = props;

  // Handle reactive icon prop (may be a function in reactive contexts)
  const iconName = typeof icon === 'function' ? (icon as () => string)() : icon;
  const svgContent = iconMap[iconName];

  if (!svgContent) {
    return <span class={className}>?</span>;
  }

  // Parse SVG and inject custom width/height if provided
  let modifiedSVG = svgContent;

  // Add custom dimensions if provided
  if (width || height) {
    const widthValue = typeof width === 'number' ? `${width}px` : width || '1em';
    const heightValue = typeof height === 'number' ? `${height}px` : height || '1em';

    // Replace or add width/height attributes
    modifiedSVG = modifiedSVG
      .replace(/width="[^"]*"/, `width="${widthValue}"`)
      .replace(/height="[^"]*"/, `height="${heightValue}"`);

    // If width/height don't exist in the SVG, add them after the opening <svg tag
    if (!modifiedSVG.includes('width=')) {
      modifiedSVG = modifiedSVG.replace(
        '<svg',
        `<svg width="${widthValue}" height="${heightValue}"`,
      );
    }
  }

  // Add custom class if provided
  if (className) {
    modifiedSVG = modifiedSVG.replace('<svg', `<svg class="${className}"`);
  }

  // Render raw SVG using dangerouslySetInnerHTML equivalent
  return <span style={style} innerHTML={modifiedSVG} />;
}
