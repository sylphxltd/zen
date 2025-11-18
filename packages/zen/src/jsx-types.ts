/**
 * JSX Type Definitions for ZenJS
 * This file provides global JSX namespace declarations
 */

type ReactiveValue<T> = T | { value: T };
type EventHandler<E extends Event = Event> = (event: E) => void;

declare global {
  namespace JSX {
    type Element = Node;

    interface ElementChildrenAttribute {
      children: {};
    }

    interface IntrinsicElements {
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
      circle: SVGAttributes<SVGCircleElement>;
      clipPath: SVGAttributes<SVGClipPathElement>;
      defs: SVGAttributes<SVGDefsElement>;
      ellipse: SVGAttributes<SVGEllipseElement>;
      g: SVGAttributes<SVGGElement>;
      line: SVGAttributes<SVGLineElement>;
      path: SVGAttributes<SVGPathElement>;
      polygon: SVGAttributes<SVGPolygonElement>;
      polyline: SVGAttributes<SVGPolylineElement>;
      rect: SVGAttributes<SVGRectElement>;
      text: SVGAttributes<SVGTextElement>;
    }
  }

  interface DOMAttributes<T extends EventTarget> {
    children?: any;
    ref?: (el: T) => void;

    // Clipboard Events
    onCopy?: EventHandler<ClipboardEvent>;
    onCut?: EventHandler<ClipboardEvent>;
    onPaste?: EventHandler<ClipboardEvent>;

    // Focus Events
    onFocus?: EventHandler<FocusEvent>;
    onBlur?: EventHandler<FocusEvent>;

    // Form Events
    onChange?: EventHandler<Event>;
    onInput?: EventHandler<Event>;
    onReset?: EventHandler<Event>;
    onSubmit?: EventHandler<Event>;

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
    dir?: ReactiveValue<string>;
    draggable?: ReactiveValue<boolean>;
    hidden?: ReactiveValue<boolean>;
    id?: ReactiveValue<string>;
    lang?: ReactiveValue<string>;
    placeholder?: ReactiveValue<string>;
    spellCheck?: ReactiveValue<boolean>;
    spellcheck?: ReactiveValue<boolean>;
    style?: ReactiveValue<string | Partial<CSSStyleDeclaration>>;
    tabIndex?: ReactiveValue<number>;
    tabindex?: ReactiveValue<number>;
    title?: ReactiveValue<string>;

    // Form-specific attributes
    accept?: ReactiveValue<string>;
    autocomplete?: ReactiveValue<string>;
    autofocus?: ReactiveValue<boolean>;
    checked?: ReactiveValue<boolean>;
    disabled?: ReactiveValue<boolean>;
    form?: ReactiveValue<string>;
    max?: ReactiveValue<number | string>;
    maxLength?: ReactiveValue<number>;
    min?: ReactiveValue<number | string>;
    minLength?: ReactiveValue<number>;
    multiple?: ReactiveValue<boolean>;
    name?: ReactiveValue<string>;
    pattern?: ReactiveValue<string>;
    readonly?: ReactiveValue<boolean>;
    required?: ReactiveValue<boolean>;
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
    rel?: ReactiveValue<string>;
    target?: ReactiveValue<string>;

    // Image-specific attributes
    alt?: ReactiveValue<string>;
    crossOrigin?: ReactiveValue<string>;
    height?: ReactiveValue<number | string>;
    loading?: ReactiveValue<'lazy' | 'eager'>;
    sizes?: ReactiveValue<string>;
    srcSet?: ReactiveValue<string>;
    width?: ReactiveValue<number | string>;

    // Table-specific attributes
    colspan?: ReactiveValue<number>;
    colSpan?: ReactiveValue<number>;
    rowspan?: ReactiveValue<number>;
    rowSpan?: ReactiveValue<number>;

    // Other
    open?: ReactiveValue<boolean>;
    selected?: ReactiveValue<boolean>;
    label?: ReactiveValue<string>;
  }

  interface SVGAttributes<T extends SVGElement> extends DOMAttributes<T> {
    class?: ReactiveValue<string>;
    className?: ReactiveValue<string>;
    color?: ReactiveValue<string>;
    height?: ReactiveValue<number | string>;
    id?: ReactiveValue<string>;
    style?: ReactiveValue<string | Partial<CSSStyleDeclaration>>;
    width?: ReactiveValue<number | string>;

    // SVG Specific
    d?: ReactiveValue<string>;
    fill?: ReactiveValue<string>;
    fillOpacity?: ReactiveValue<number | string>;
    fillRule?: ReactiveValue<'nonzero' | 'evenodd' | 'inherit'>;
    stroke?: ReactiveValue<string>;
    strokeDasharray?: ReactiveValue<string | number>;
    strokeDashoffset?: ReactiveValue<string | number>;
    strokeLinecap?: ReactiveValue<'butt' | 'round' | 'square' | 'inherit'>;
    strokeLinejoin?: ReactiveValue<'miter' | 'round' | 'bevel' | 'inherit'>;
    strokeMiterlimit?: ReactiveValue<string | number>;
    strokeOpacity?: ReactiveValue<number | string>;
    strokeWidth?: ReactiveValue<number | string>;
    transform?: ReactiveValue<string>;
    viewBox?: ReactiveValue<string>;
    cx?: ReactiveValue<number | string>;
    cy?: ReactiveValue<number | string>;
    r?: ReactiveValue<number | string>;
    rx?: ReactiveValue<number | string>;
    ry?: ReactiveValue<number | string>;
    x?: ReactiveValue<number | string>;
    y?: ReactiveValue<number | string>;
    x1?: ReactiveValue<number | string>;
    x2?: ReactiveValue<number | string>;
    y1?: ReactiveValue<number | string>;
    y2?: ReactiveValue<number | string>;
    points?: ReactiveValue<string>;
  }
}

export {};
