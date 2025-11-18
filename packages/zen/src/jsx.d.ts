/**
 * JSX Type Definitions for ZenJS
 */

import type { Signal, ComputedZen } from '@zen/signal';

export namespace JSX {
  export type Element = Node;

  export interface ElementChildrenAttribute {
    children: {};
  }

  export interface IntrinsicElements {
    // HTML
    a: HTMLAttributes<HTMLAnchorElement>;
    abbr: HTMLAttributes<HTMLElement>;
    address: HTMLAttributes<HTMLElement>;
    area: HTMLAttributes<HTMLAreaElement>;
    article: HTMLAttributes<HTMLElement>;
    aside: HTMLAttributes<HTMLElement>;
    audio: HTMLAttributes<HTMLAudioElement>;
    b: HTMLAttributes<HTMLElement>;
    base: HTMLAttributes<HTMLBaseElement>;
    bdi: HTMLAttributes<HTMLElement>;
    bdo: HTMLAttributes<HTMLElement>;
    blockquote: HTMLAttributes<HTMLQuoteElement>;
    body: HTMLAttributes<HTMLBodyElement>;
    br: HTMLAttributes<HTMLBRElement>;
    button: HTMLAttributes<HTMLButtonElement>;
    canvas: HTMLAttributes<HTMLCanvasElement>;
    caption: HTMLAttributes<HTMLTableCaptionElement>;
    cite: HTMLAttributes<HTMLElement>;
    code: HTMLAttributes<HTMLElement>;
    col: HTMLAttributes<HTMLTableColElement>;
    colgroup: HTMLAttributes<HTMLTableColElement>;
    data: HTMLAttributes<HTMLDataElement>;
    datalist: HTMLAttributes<HTMLDataListElement>;
    dd: HTMLAttributes<HTMLElement>;
    del: HTMLAttributes<HTMLModElement>;
    details: HTMLAttributes<HTMLDetailsElement>;
    dfn: HTMLAttributes<HTMLElement>;
    dialog: HTMLAttributes<HTMLDialogElement>;
    div: HTMLAttributes<HTMLDivElement>;
    dl: HTMLAttributes<HTMLDListElement>;
    dt: HTMLAttributes<HTMLElement>;
    em: HTMLAttributes<HTMLElement>;
    embed: HTMLAttributes<HTMLEmbedElement>;
    fieldset: HTMLAttributes<HTMLFieldSetElement>;
    figcaption: HTMLAttributes<HTMLElement>;
    figure: HTMLAttributes<HTMLElement>;
    footer: HTMLAttributes<HTMLElement>;
    form: HTMLAttributes<HTMLFormElement>;
    h1: HTMLAttributes<HTMLHeadingElement>;
    h2: HTMLAttributes<HTMLHeadingElement>;
    h3: HTMLAttributes<HTMLHeadingElement>;
    h4: HTMLAttributes<HTMLHeadingElement>;
    h5: HTMLAttributes<HTMLHeadingElement>;
    h6: HTMLAttributes<HTMLHeadingElement>;
    head: HTMLAttributes<HTMLHeadElement>;
    header: HTMLAttributes<HTMLElement>;
    hgroup: HTMLAttributes<HTMLElement>;
    hr: HTMLAttributes<HTMLHRElement>;
    html: HTMLAttributes<HTMLHtmlElement>;
    i: HTMLAttributes<HTMLElement>;
    iframe: HTMLAttributes<HTMLIFrameElement>;
    img: HTMLAttributes<HTMLImageElement>;
    input: HTMLAttributes<HTMLInputElement>;
    ins: HTMLAttributes<HTMLModElement>;
    kbd: HTMLAttributes<HTMLElement>;
    label: HTMLAttributes<HTMLLabelElement>;
    legend: HTMLAttributes<HTMLLegendElement>;
    li: HTMLAttributes<HTMLLIElement>;
    link: HTMLAttributes<HTMLLinkElement>;
    main: HTMLAttributes<HTMLElement>;
    map: HTMLAttributes<HTMLMapElement>;
    mark: HTMLAttributes<HTMLElement>;
    menu: HTMLAttributes<HTMLMenuElement>;
    meta: HTMLAttributes<HTMLMetaElement>;
    meter: HTMLAttributes<HTMLMeterElement>;
    nav: HTMLAttributes<HTMLElement>;
    noscript: HTMLAttributes<HTMLElement>;
    object: HTMLAttributes<HTMLObjectElement>;
    ol: HTMLAttributes<HTMLOListElement>;
    optgroup: HTMLAttributes<HTMLOptGroupElement>;
    option: HTMLAttributes<HTMLOptionElement>;
    output: HTMLAttributes<HTMLOutputElement>;
    p: HTMLAttributes<HTMLParagraphElement>;
    picture: HTMLAttributes<HTMLPictureElement>;
    pre: HTMLAttributes<HTMLPreElement>;
    progress: HTMLAttributes<HTMLProgressElement>;
    q: HTMLAttributes<HTMLQuoteElement>;
    rp: HTMLAttributes<HTMLElement>;
    rt: HTMLAttributes<HTMLElement>;
    ruby: HTMLAttributes<HTMLElement>;
    s: HTMLAttributes<HTMLElement>;
    samp: HTMLAttributes<HTMLElement>;
    script: HTMLAttributes<HTMLScriptElement>;
    section: HTMLAttributes<HTMLElement>;
    select: HTMLAttributes<HTMLSelectElement>;
    slot: HTMLAttributes<HTMLSlotElement>;
    small: HTMLAttributes<HTMLElement>;
    source: HTMLAttributes<HTMLSourceElement>;
    span: HTMLAttributes<HTMLSpanElement>;
    strong: HTMLAttributes<HTMLElement>;
    style: HTMLAttributes<HTMLStyleElement>;
    sub: HTMLAttributes<HTMLElement>;
    summary: HTMLAttributes<HTMLElement>;
    sup: HTMLAttributes<HTMLElement>;
    table: HTMLAttributes<HTMLTableElement>;
    tbody: HTMLAttributes<HTMLTableSectionElement>;
    td: HTMLAttributes<HTMLTableCellElement>;
    template: HTMLAttributes<HTMLTemplateElement>;
    textarea: HTMLAttributes<HTMLTextAreaElement>;
    tfoot: HTMLAttributes<HTMLTableSectionElement>;
    th: HTMLAttributes<HTMLTableCellElement>;
    thead: HTMLAttributes<HTMLTableSectionElement>;
    time: HTMLAttributes<HTMLTimeElement>;
    title: HTMLAttributes<HTMLTitleElement>;
    tr: HTMLAttributes<HTMLTableRowElement>;
    track: HTMLAttributes<HTMLTrackElement>;
    u: HTMLAttributes<HTMLElement>;
    ul: HTMLAttributes<HTMLUListElement>;
    var: HTMLAttributes<HTMLElement>;
    video: HTMLAttributes<HTMLVideoElement>;
    wbr: HTMLAttributes<HTMLElement>;

    // SVG
    svg: SVGAttributes<SVGSVGElement>;
    animate: SVGAttributes<SVGAnimateElement>;
    circle: SVGAttributes<SVGCircleElement>;
    clipPath: SVGAttributes<SVGClipPathElement>;
    defs: SVGAttributes<SVGDefsElement>;
    desc: SVGAttributes<SVGDescElement>;
    ellipse: SVGAttributes<SVGEllipseElement>;
    feBlend: SVGAttributes<SVGFEBlendElement>;
    feColorMatrix: SVGAttributes<SVGFEColorMatrixElement>;
    feComponentTransfer: SVGAttributes<SVGFEComponentTransferElement>;
    feComposite: SVGAttributes<SVGFECompositeElement>;
    feConvolveMatrix: SVGAttributes<SVGFEConvolveMatrixElement>;
    feDiffuseLighting: SVGAttributes<SVGFEDiffuseLightingElement>;
    feDisplacementMap: SVGAttributes<SVGFEDisplacementMapElement>;
    feDistantLight: SVGAttributes<SVGFEDistantLightElement>;
    feDropShadow: SVGAttributes<SVGFEDropShadowElement>;
    feFlood: SVGAttributes<SVGFEFloodElement>;
    feFuncA: SVGAttributes<SVGFEFuncAElement>;
    feFuncB: SVGAttributes<SVGFEFuncBElement>;
    feFuncG: SVGAttributes<SVGFEFuncGElement>;
    feFuncR: SVGAttributes<SVGFEFuncRElement>;
    feGaussianBlur: SVGAttributes<SVGFEGaussianBlurElement>;
    feImage: SVGAttributes<SVGFEImageElement>;
    feMerge: SVGAttributes<SVGFEMergeElement>;
    feMergeNode: SVGAttributes<SVGFEMergeNodeElement>;
    feMorphology: SVGAttributes<SVGFEMorphologyElement>;
    feOffset: SVGAttributes<SVGFEOffsetElement>;
    fePointLight: SVGAttributes<SVGFEPointLightElement>;
    feSpecularLighting: SVGAttributes<SVGFESpecularLightingElement>;
    feSpotLight: SVGAttributes<SVGFESpotLightElement>;
    feTile: SVGAttributes<SVGFETileElement>;
    feTurbulence: SVGAttributes<SVGFETurbulenceElement>;
    filter: SVGAttributes<SVGFilterElement>;
    foreignObject: SVGAttributes<SVGForeignObjectElement>;
    g: SVGAttributes<SVGGElement>;
    image: SVGAttributes<SVGImageElement>;
    line: SVGAttributes<SVGLineElement>;
    linearGradient: SVGAttributes<SVGLinearGradientElement>;
    marker: SVGAttributes<SVGMarkerElement>;
    mask: SVGAttributes<SVGMaskElement>;
    metadata: SVGAttributes<SVGMetadataElement>;
    path: SVGAttributes<SVGPathElement>;
    pattern: SVGAttributes<SVGPatternElement>;
    polygon: SVGAttributes<SVGPolygonElement>;
    polyline: SVGAttributes<SVGPolylineElement>;
    radialGradient: SVGAttributes<SVGRadialGradientElement>;
    rect: SVGAttributes<SVGRectElement>;
    stop: SVGAttributes<SVGStopElement>;
    switch: SVGAttributes<SVGSwitchElement>;
    symbol: SVGAttributes<SVGSymbolElement>;
    text: SVGAttributes<SVGTextElement>;
    textPath: SVGAttributes<SVGTextPathElement>;
    tspan: SVGAttributes<SVGTSpanElement>;
    use: SVGAttributes<SVGUseElement>;
    view: SVGAttributes<SVGViewElement>;
  }
}

type EventHandler<E extends Event = Event> = (event: E) => void;
type ReactiveValue<T> = T | Signal<T> | ComputedZen<T>;

interface DOMAttributes<T extends EventTarget> {
  children?: any;
  ref?: (el: T) => void;

  // Clipboard Events
  onCopy?: EventHandler<ClipboardEvent>;
  onCut?: EventHandler<ClipboardEvent>;
  onPaste?: EventHandler<ClipboardEvent>;

  // Composition Events
  onCompositionEnd?: EventHandler<CompositionEvent>;
  onCompositionStart?: EventHandler<CompositionEvent>;
  onCompositionUpdate?: EventHandler<CompositionEvent>;

  // Focus Events
  onFocus?: EventHandler<FocusEvent>;
  onBlur?: EventHandler<FocusEvent>;

  // Form Events
  onChange?: EventHandler<Event>;
  onInput?: EventHandler<Event>;
  onReset?: EventHandler<Event>;
  onSubmit?: EventHandler<Event>;

  // Image Events
  onLoad?: EventHandler<Event>;
  onError?: EventHandler<Event>;

  // Keyboard Events
  onKeyDown?: EventHandler<KeyboardEvent>;
  onKeyPress?: EventHandler<KeyboardEvent>;
  onKeyUp?: EventHandler<KeyboardEvent>;

  // Mouse Events
  onClick?: EventHandler<MouseEvent>;
  onContextMenu?: EventHandler<MouseEvent>;
  onDoubleClick?: EventHandler<MouseEvent>;
  onDrag?: EventHandler<DragEvent>;
  onDragEnd?: EventHandler<DragEvent>;
  onDragEnter?: EventHandler<DragEvent>;
  onDragExit?: EventHandler<DragEvent>;
  onDragLeave?: EventHandler<DragEvent>;
  onDragOver?: EventHandler<DragEvent>;
  onDragStart?: EventHandler<DragEvent>;
  onDrop?: EventHandler<DragEvent>;
  onMouseDown?: EventHandler<MouseEvent>;
  onMouseEnter?: EventHandler<MouseEvent>;
  onMouseLeave?: EventHandler<MouseEvent>;
  onMouseMove?: EventHandler<MouseEvent>;
  onMouseOut?: EventHandler<MouseEvent>;
  onMouseOver?: EventHandler<MouseEvent>;
  onMouseUp?: EventHandler<MouseEvent>;

  // Selection Events
  onSelect?: EventHandler<Event>;

  // Touch Events
  onTouchCancel?: EventHandler<TouchEvent>;
  onTouchEnd?: EventHandler<TouchEvent>;
  onTouchMove?: EventHandler<TouchEvent>;
  onTouchStart?: EventHandler<TouchEvent>;

  // Pointer Events
  onPointerDown?: EventHandler<PointerEvent>;
  onPointerMove?: EventHandler<PointerEvent>;
  onPointerUp?: EventHandler<PointerEvent>;
  onPointerCancel?: EventHandler<PointerEvent>;
  onPointerEnter?: EventHandler<PointerEvent>;
  onPointerLeave?: EventHandler<PointerEvent>;
  onPointerOver?: EventHandler<PointerEvent>;
  onPointerOut?: EventHandler<PointerEvent>;

  // UI Events
  onScroll?: EventHandler<UIEvent>;

  // Wheel Events
  onWheel?: EventHandler<WheelEvent>;

  // Animation Events
  onAnimationStart?: EventHandler<AnimationEvent>;
  onAnimationEnd?: EventHandler<AnimationEvent>;
  onAnimationIteration?: EventHandler<AnimationEvent>;

  // Transition Events
  onTransitionEnd?: EventHandler<TransitionEvent>;
}

interface HTMLAttributes<T extends HTMLElement> extends DOMAttributes<T> {
  // Standard HTML Attributes
  accessKey?: ReactiveValue<string>;
  class?: ReactiveValue<string>;
  className?: ReactiveValue<string>;
  contentEditable?: ReactiveValue<boolean | 'true' | 'false'>;
  contextMenu?: ReactiveValue<string>;
  dir?: ReactiveValue<string>;
  draggable?: ReactiveValue<boolean>;
  hidden?: ReactiveValue<boolean>;
  id?: ReactiveValue<string>;
  lang?: ReactiveValue<string>;
  placeholder?: ReactiveValue<string>;
  slot?: ReactiveValue<string>;
  spellCheck?: ReactiveValue<boolean>;
  spellcheck?: ReactiveValue<boolean>;
  style?: ReactiveValue<string | Partial<CSSStyleDeclaration>>;
  tabIndex?: ReactiveValue<number>;
  tabindex?: ReactiveValue<number>;
  title?: ReactiveValue<string>;
  translate?: ReactiveValue<'yes' | 'no'>;

  // WAI-ARIA
  role?: ReactiveValue<string>;

  // RDFa Attributes
  about?: ReactiveValue<string>;
  datatype?: ReactiveValue<string>;
  inlist?: ReactiveValue<any>;
  prefix?: ReactiveValue<string>;
  property?: ReactiveValue<string>;
  resource?: ReactiveValue<string>;
  typeof?: ReactiveValue<string>;
  vocab?: ReactiveValue<string>;

  // Non-standard Attributes
  autoCapitalize?: ReactiveValue<string>;
  autoCorrect?: ReactiveValue<string>;
  autoSave?: ReactiveValue<string>;
  color?: ReactiveValue<string>;
  itemProp?: ReactiveValue<string>;
  itemScope?: ReactiveValue<boolean>;
  itemType?: ReactiveValue<string>;
  itemID?: ReactiveValue<string>;
  itemRef?: ReactiveValue<string>;
  results?: ReactiveValue<number>;
  security?: ReactiveValue<string>;
  unselectable?: ReactiveValue<'on' | 'off'>;

  // Form-specific attributes
  accept?: ReactiveValue<string>;
  acceptCharset?: ReactiveValue<string>;
  action?: ReactiveValue<string>;
  autocomplete?: ReactiveValue<string>;
  autofocus?: ReactiveValue<boolean>;
  capture?: ReactiveValue<boolean | string>;
  checked?: ReactiveValue<boolean>;
  disabled?: ReactiveValue<boolean>;
  form?: ReactiveValue<string>;
  formAction?: ReactiveValue<string>;
  formEncType?: ReactiveValue<string>;
  formMethod?: ReactiveValue<string>;
  formNoValidate?: ReactiveValue<boolean>;
  formTarget?: ReactiveValue<string>;
  max?: ReactiveValue<number | string>;
  maxLength?: ReactiveValue<number>;
  min?: ReactiveValue<number | string>;
  minLength?: ReactiveValue<number>;
  multiple?: ReactiveValue<boolean>;
  name?: ReactiveValue<string>;
  pattern?: ReactiveValue<string>;
  readonly?: ReactiveValue<boolean>;
  required?: ReactiveValue<boolean>;
  size?: ReactiveValue<number>;
  step?: ReactiveValue<number | string>;
  type?: ReactiveValue<string>;
  value?: ReactiveValue<string | string[] | number>;

  // Media-specific attributes
  autoplay?: ReactiveValue<boolean>;
  controls?: ReactiveValue<boolean>;
  loop?: ReactiveValue<boolean>;
  muted?: ReactiveValue<boolean>;
  preload?: ReactiveValue<string>;
  src?: ReactiveValue<string>;
  poster?: ReactiveValue<string>;

  // Link-specific attributes
  download?: ReactiveValue<any>;
  href?: ReactiveValue<string>;
  hreflang?: ReactiveValue<string>;
  media?: ReactiveValue<string>;
  ping?: ReactiveValue<string>;
  rel?: ReactiveValue<string>;
  target?: ReactiveValue<string>;

  // Image-specific attributes
  alt?: ReactiveValue<string>;
  crossOrigin?: ReactiveValue<string>;
  height?: ReactiveValue<number | string>;
  loading?: ReactiveValue<'lazy' | 'eager'>;
  referrerPolicy?: ReactiveValue<string>;
  sizes?: ReactiveValue<string>;
  srcSet?: ReactiveValue<string>;
  useMap?: ReactiveValue<string>;
  width?: ReactiveValue<number | string>;

  // Table-specific attributes
  colspan?: ReactiveValue<number>;
  colSpan?: ReactiveValue<number>;
  headers?: ReactiveValue<string>;
  rowspan?: ReactiveValue<number>;
  rowSpan?: ReactiveValue<number>;
  scope?: ReactiveValue<string>;

  // Other
  open?: ReactiveValue<boolean>;
  selected?: ReactiveValue<boolean>;
  label?: ReactiveValue<string>;
}

interface SVGAttributes<T extends SVGElement> extends DOMAttributes<T> {
  // Attributes which also defined in HTMLAttributes
  class?: ReactiveValue<string>;
  className?: ReactiveValue<string>;
  color?: ReactiveValue<string>;
  height?: ReactiveValue<number | string>;
  id?: ReactiveValue<string>;
  lang?: ReactiveValue<string>;
  max?: ReactiveValue<number | string>;
  media?: ReactiveValue<string>;
  min?: ReactiveValue<number | string>;
  style?: ReactiveValue<string | Partial<CSSStyleDeclaration>>;
  tabIndex?: ReactiveValue<number>;
  target?: ReactiveValue<string>;
  type?: ReactiveValue<string>;
  width?: ReactiveValue<number | string>;

  // SVG Specific attributes
  accentHeight?: ReactiveValue<number | string>;
  accumulate?: ReactiveValue<'none' | 'sum'>;
  additive?: ReactiveValue<'replace' | 'sum'>;
  alignmentBaseline?: ReactiveValue<
    | 'auto'
    | 'baseline'
    | 'before-edge'
    | 'text-before-edge'
    | 'middle'
    | 'central'
    | 'after-edge'
    | 'text-after-edge'
    | 'ideographic'
    | 'alphabetic'
    | 'hanging'
    | 'mathematical'
    | 'inherit'
  >;
  allowReorder?: ReactiveValue<'no' | 'yes'>;
  alphabetic?: ReactiveValue<number | string>;
  amplitude?: ReactiveValue<number | string>;
  arabicForm?: ReactiveValue<'initial' | 'medial' | 'terminal' | 'isolated'>;
  ascent?: ReactiveValue<number | string>;
  attributeName?: ReactiveValue<string>;
  attributeType?: ReactiveValue<string>;
  autoReverse?: ReactiveValue<number | string>;
  azimuth?: ReactiveValue<number | string>;
  baseFrequency?: ReactiveValue<number | string>;
  baselineShift?: ReactiveValue<number | string>;
  baseProfile?: ReactiveValue<number | string>;
  bbox?: ReactiveValue<number | string>;
  begin?: ReactiveValue<number | string>;
  bias?: ReactiveValue<number | string>;
  by?: ReactiveValue<number | string>;
  calcMode?: ReactiveValue<number | string>;
  capHeight?: ReactiveValue<number | string>;
  clip?: ReactiveValue<number | string>;
  clipPath?: ReactiveValue<string>;
  clipPathUnits?: ReactiveValue<number | string>;
  clipRule?: ReactiveValue<number | string>;
  colorInterpolation?: ReactiveValue<number | string>;
  colorInterpolationFilters?: ReactiveValue<'auto' | 'sRGB' | 'linearRGB' | 'inherit'>;
  colorProfile?: ReactiveValue<number | string>;
  colorRendering?: ReactiveValue<number | string>;
  contentScriptType?: ReactiveValue<number | string>;
  contentStyleType?: ReactiveValue<number | string>;
  cursor?: ReactiveValue<number | string>;
  cx?: ReactiveValue<number | string>;
  cy?: ReactiveValue<number | string>;
  d?: ReactiveValue<string>;
  decelerate?: ReactiveValue<number | string>;
  descent?: ReactiveValue<number | string>;
  diffuseConstant?: ReactiveValue<number | string>;
  direction?: ReactiveValue<number | string>;
  display?: ReactiveValue<number | string>;
  divisor?: ReactiveValue<number | string>;
  dominantBaseline?: ReactiveValue<number | string>;
  dur?: ReactiveValue<number | string>;
  dx?: ReactiveValue<number | string>;
  dy?: ReactiveValue<number | string>;
  edgeMode?: ReactiveValue<number | string>;
  elevation?: ReactiveValue<number | string>;
  enableBackground?: ReactiveValue<number | string>;
  end?: ReactiveValue<number | string>;
  exponent?: ReactiveValue<number | string>;
  externalResourcesRequired?: ReactiveValue<number | string>;
  fill?: ReactiveValue<string>;
  fillOpacity?: ReactiveValue<number | string>;
  fillRule?: ReactiveValue<'nonzero' | 'evenodd' | 'inherit'>;
  filter?: ReactiveValue<string>;
  filterRes?: ReactiveValue<number | string>;
  filterUnits?: ReactiveValue<number | string>;
  floodColor?: ReactiveValue<number | string>;
  floodOpacity?: ReactiveValue<number | string>;
  focusable?: ReactiveValue<number | string>;
  fontFamily?: ReactiveValue<string>;
  fontSize?: ReactiveValue<number | string>;
  fontSizeAdjust?: ReactiveValue<number | string>;
  fontStretch?: ReactiveValue<number | string>;
  fontStyle?: ReactiveValue<number | string>;
  fontVariant?: ReactiveValue<number | string>;
  fontWeight?: ReactiveValue<number | string>;
  format?: ReactiveValue<number | string>;
  from?: ReactiveValue<number | string>;
  fx?: ReactiveValue<number | string>;
  fy?: ReactiveValue<number | string>;
  g1?: ReactiveValue<number | string>;
  g2?: ReactiveValue<number | string>;
  glyphName?: ReactiveValue<number | string>;
  glyphOrientationHorizontal?: ReactiveValue<number | string>;
  glyphOrientationVertical?: ReactiveValue<number | string>;
  glyphRef?: ReactiveValue<number | string>;
  gradientTransform?: ReactiveValue<string>;
  gradientUnits?: ReactiveValue<string>;
  hanging?: ReactiveValue<number | string>;
  horizAdvX?: ReactiveValue<number | string>;
  horizOriginX?: ReactiveValue<number | string>;
  ideographic?: ReactiveValue<number | string>;
  imageRendering?: ReactiveValue<number | string>;
  in2?: ReactiveValue<number | string>;
  in?: ReactiveValue<string>;
  intercept?: ReactiveValue<number | string>;
  k1?: ReactiveValue<number | string>;
  k2?: ReactiveValue<number | string>;
  k3?: ReactiveValue<number | string>;
  k4?: ReactiveValue<number | string>;
  k?: ReactiveValue<number | string>;
  kernelMatrix?: ReactiveValue<number | string>;
  kernelUnitLength?: ReactiveValue<number | string>;
  kerning?: ReactiveValue<number | string>;
  keyPoints?: ReactiveValue<number | string>;
  keySplines?: ReactiveValue<number | string>;
  keyTimes?: ReactiveValue<number | string>;
  lengthAdjust?: ReactiveValue<number | string>;
  letterSpacing?: ReactiveValue<number | string>;
  lightingColor?: ReactiveValue<number | string>;
  limitingConeAngle?: ReactiveValue<number | string>;
  local?: ReactiveValue<number | string>;
  markerEnd?: ReactiveValue<string>;
  markerHeight?: ReactiveValue<number | string>;
  markerMid?: ReactiveValue<string>;
  markerStart?: ReactiveValue<string>;
  markerUnits?: ReactiveValue<number | string>;
  markerWidth?: ReactiveValue<number | string>;
  mask?: ReactiveValue<string>;
  maskContentUnits?: ReactiveValue<number | string>;
  maskUnits?: ReactiveValue<number | string>;
  mathematical?: ReactiveValue<number | string>;
  mode?: ReactiveValue<number | string>;
  numOctaves?: ReactiveValue<number | string>;
  offset?: ReactiveValue<number | string>;
  opacity?: ReactiveValue<number | string>;
  operator?: ReactiveValue<number | string>;
  order?: ReactiveValue<number | string>;
  orient?: ReactiveValue<number | string>;
  orientation?: ReactiveValue<number | string>;
  origin?: ReactiveValue<number | string>;
  overflow?: ReactiveValue<number | string>;
  overlinePosition?: ReactiveValue<number | string>;
  overlineThickness?: ReactiveValue<number | string>;
  paintOrder?: ReactiveValue<number | string>;
  panose1?: ReactiveValue<number | string>;
  pathLength?: ReactiveValue<number | string>;
  patternContentUnits?: ReactiveValue<string>;
  patternTransform?: ReactiveValue<number | string>;
  patternUnits?: ReactiveValue<string>;
  pointerEvents?: ReactiveValue<number | string>;
  points?: ReactiveValue<string>;
  pointsAtX?: ReactiveValue<number | string>;
  pointsAtY?: ReactiveValue<number | string>;
  pointsAtZ?: ReactiveValue<number | string>;
  preserveAlpha?: ReactiveValue<number | string>;
  preserveAspectRatio?: ReactiveValue<string>;
  primitiveUnits?: ReactiveValue<number | string>;
  r?: ReactiveValue<number | string>;
  radius?: ReactiveValue<number | string>;
  refX?: ReactiveValue<number | string>;
  refY?: ReactiveValue<number | string>;
  renderingIntent?: ReactiveValue<number | string>;
  repeatCount?: ReactiveValue<number | string>;
  repeatDur?: ReactiveValue<number | string>;
  requiredExtensions?: ReactiveValue<number | string>;
  requiredFeatures?: ReactiveValue<number | string>;
  restart?: ReactiveValue<number | string>;
  result?: ReactiveValue<string>;
  rotate?: ReactiveValue<number | string>;
  rx?: ReactiveValue<number | string>;
  ry?: ReactiveValue<number | string>;
  scale?: ReactiveValue<number | string>;
  seed?: ReactiveValue<number | string>;
  shapeRendering?: ReactiveValue<number | string>;
  slope?: ReactiveValue<number | string>;
  spacing?: ReactiveValue<number | string>;
  specularConstant?: ReactiveValue<number | string>;
  specularExponent?: ReactiveValue<number | string>;
  speed?: ReactiveValue<number | string>;
  spreadMethod?: ReactiveValue<string>;
  startOffset?: ReactiveValue<number | string>;
  stdDeviation?: ReactiveValue<number | string>;
  stemh?: ReactiveValue<number | string>;
  stemv?: ReactiveValue<number | string>;
  stitchTiles?: ReactiveValue<number | string>;
  stopColor?: ReactiveValue<string>;
  stopOpacity?: ReactiveValue<number | string>;
  strikethroughPosition?: ReactiveValue<number | string>;
  strikethroughThickness?: ReactiveValue<number | string>;
  string?: ReactiveValue<number | string>;
  stroke?: ReactiveValue<string>;
  strokeDasharray?: ReactiveValue<string | number>;
  strokeDashoffset?: ReactiveValue<string | number>;
  strokeLinecap?: ReactiveValue<'butt' | 'round' | 'square' | 'inherit'>;
  strokeLinejoin?: ReactiveValue<'miter' | 'round' | 'bevel' | 'inherit'>;
  strokeMiterlimit?: ReactiveValue<string | number>;
  strokeOpacity?: ReactiveValue<number | string>;
  strokeWidth?: ReactiveValue<number | string>;
  surfaceScale?: ReactiveValue<number | string>;
  systemLanguage?: ReactiveValue<number | string>;
  tableValues?: ReactiveValue<number | string>;
  targetX?: ReactiveValue<number | string>;
  targetY?: ReactiveValue<number | string>;
  textAnchor?: ReactiveValue<string>;
  textDecoration?: ReactiveValue<number | string>;
  textLength?: ReactiveValue<number | string>;
  textRendering?: ReactiveValue<number | string>;
  to?: ReactiveValue<number | string>;
  transform?: ReactiveValue<string>;
  u1?: ReactiveValue<number | string>;
  u2?: ReactiveValue<number | string>;
  underlinePosition?: ReactiveValue<number | string>;
  underlineThickness?: ReactiveValue<number | string>;
  unicode?: ReactiveValue<number | string>;
  unicodeBidi?: ReactiveValue<number | string>;
  unicodeRange?: ReactiveValue<number | string>;
  unitsPerEm?: ReactiveValue<number | string>;
  vAlphabetic?: ReactiveValue<number | string>;
  values?: ReactiveValue<string>;
  vectorEffect?: ReactiveValue<number | string>;
  version?: ReactiveValue<string>;
  vertAdvY?: ReactiveValue<number | string>;
  vertOriginX?: ReactiveValue<number | string>;
  vertOriginY?: ReactiveValue<number | string>;
  vHanging?: ReactiveValue<number | string>;
  vIdeographic?: ReactiveValue<number | string>;
  viewBox?: ReactiveValue<string>;
  viewTarget?: ReactiveValue<number | string>;
  visibility?: ReactiveValue<number | string>;
  vMathematical?: ReactiveValue<number | string>;
  widths?: ReactiveValue<number | string>;
  wordSpacing?: ReactiveValue<number | string>;
  writingMode?: ReactiveValue<number | string>;
  x1?: ReactiveValue<number | string>;
  x2?: ReactiveValue<number | string>;
  x?: ReactiveValue<number | string>;
  xChannelSelector?: ReactiveValue<string>;
  xHeight?: ReactiveValue<number | string>;
  xlinkActuate?: ReactiveValue<string>;
  xlinkArcrole?: ReactiveValue<string>;
  xlinkHref?: ReactiveValue<string>;
  xlinkRole?: ReactiveValue<string>;
  xlinkShow?: ReactiveValue<string>;
  xlinkTitle?: ReactiveValue<string>;
  xlinkType?: ReactiveValue<string>;
  xmlBase?: ReactiveValue<string>;
  xmlLang?: ReactiveValue<string>;
  xmlns?: ReactiveValue<string>;
  xmlnsXlink?: ReactiveValue<string>;
  xmlSpace?: ReactiveValue<string>;
  y1?: ReactiveValue<number | string>;
  y2?: ReactiveValue<number | string>;
  y?: ReactiveValue<number | string>;
  yChannelSelector?: ReactiveValue<string>;
  z?: ReactiveValue<number | string>;
  zoomAndPan?: ReactiveValue<string>;
}
