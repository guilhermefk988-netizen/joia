// TextLoop — versão JS puro (sem React)
// Se usar npm, troque a linha abaixo por: import { gsap } from 'gsap';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm';

const NS = 'http://www.w3.org/2000/svg';
const VIEW_W = 1200;
const VIEW_H = 520;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const EDGE_PAD = 6;
const FADE_STEPS = 8;
const MAX_FLING = 2600;
const MAX_BOOST = 1600;

const DEFAULTS = {
  text: 'React ✦ Bits',
  shape: 'wave', // 'wave' | 'circle' | 'infinity' | 'arch' | 'line'
  path: undefined, // path SVG customizado (opcional)
  speed: 90,
  direction: 'forward', // 'forward' | 'reverse'
  separator: '✦',
  curviness: 90,
  tilt: 0,
  fontSize: 46,
  fontWeight: 800,
  letterSpacing: 2,
  uppercase: true,
  color: undefined,
  ribbon: true,
  ribbonColor: '#5227FF',
  ribbonWidth: 86,
  edgeFade: 0,
  pauseOnHover: true,
  cross: false,
  crossColor: undefined,
  crossAngle: 16,
  draggable: false,
  scrollBoost: 0,
  outline: false,
  outlineWidth: 1.5
};

const smootherstep = t => t * t * t * (t * (t * 6 - 15) + 10);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const wrap = (v, length) => ((v % length) + length) % length;

const circleRadius = (curviness, ribbonWidth) =>
  Math.min(90 + Math.max(0, curviness) * 0.95, Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD));

const buildPath = (shape, curviness, ribbonWidth, mirrored = false) => {
  const c = Math.max(0, curviness);
  const room = Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);
  const flip = mirrored ? -1 : 1;

  switch (shape) {
    case 'circle': {
      const r = circleRadius(curviness, ribbonWidth);
      if (mirrored) {
        const rx = r * 1.22;
        const ry = r * 0.42;
        return `M ${CX - rx} ${CY} A ${rx} ${ry} 0 1 1 ${CX + rx} ${CY} A ${rx} ${ry} 0 1 1 ${CX - rx} ${CY} Z`;
      }
      return `M ${CX - r} ${CY} A ${r} ${r} 0 1 1 ${CX + r} ${CY} A ${r} ${r} 0 1 1 ${CX - r} ${CY} Z`;
    }
    case 'infinity': {
      const r = 150 + c * 1.4;
      const h = Math.min(60 + c * 0.95, room);
      return [
        `M ${CX} ${CY}`,
        `C ${CX + r * 0.55} ${CY - h} ${CX + r} ${CY - h} ${CX + r} ${CY}`,
        `C ${CX + r} ${CY + h} ${CX + r * 0.55} ${CY + h} ${CX} ${CY}`,
        `C ${CX - r * 0.55} ${CY - h} ${CX - r} ${CY - h} ${CX - r} ${CY}`,
        `C ${CX - r} ${CY + h} ${CX - r * 0.55} ${CY + h} ${CX} ${CY}`,
        'Z'
      ].join(' ');
    }
    case 'arch': {
      const rise = Math.min(120 + c * 1.1, room * 2) * flip;
      return `M 120 ${CY + rise / 2} Q ${CX} ${CY - rise * 1.5} ${VIEW_W - 120} ${CY + rise / 2}`;
    }
    case 'line':
      return `M -320 ${CY} L ${VIEW_W + 320} ${CY}`;
    case 'wave':
    default: {
      const a = Math.min(c * 2.2, room * 2) * flip;
      return `M -320 ${CY} Q -160 ${CY - a} 0 ${CY} T 320 ${CY} T 640 ${CY} T 960 ${CY} T 1280 ${CY} T ${VIEW_W + 320} ${CY}`;
    }
  }
};

const buildFade = edgeFade => {
  const width = Math.min(1, Math.max(0, edgeFade)) * 0.3;
  if (width <= 0) return [];
  const stops = [];
  for (let i = 0; i <= FADE_STEPS; i++) {
    const t = i / FADE_STEPS;
    stops.push({ offset: t * width, opacity: smootherstep(t) });
  }
  for (let i = FADE_STEPS; i >= 0; i--) {
    const t = i / FADE_STEPS;
    stops.push({ offset: 1 - t * width, opacity: smootherstep(t) });
  }
  return stops;
};

const parseHex = value => {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(String(value || '').trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].replace(/./g, ch => ch + ch) : match[1];
  return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
};

const tint = (color, amount) => {
  const rgb = parseHex(color);
  if (!rgb) return color;
  return `#${rgb
    .map(v =>
      Math.round(v + (255 - v) * amount)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
};

const inkOn = color => {
  const rgb = parseHex(color);
  if (!rgb) return '#ffffff';
  const [r, g, b] = rgb.map(v => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.2 ? '#120f17' : '#ffffff';
};

// Cria um elemento SVG com atributos (ignora undefined/null)
const el = (tag, attrs = {}, parent) => {
  const node = document.createElementNS(NS, tag);
  for (const key in attrs) {
    const value = attrs[key];
    if (value !== undefined && value !== null) node.setAttribute(key, value);
  }
  if (parent) parent.appendChild(node);
  return node;
};

// CSS mínimo, injetado uma única vez (substitui o TextLoop.css)
const injectStyles = () => {
  if (document.getElementById('text-loop-styles')) return;
  const style = document.createElement('style');
  style.id = 'text-loop-styles';
  style.textContent = `
.text-loop { position: relative; width: 100%; height: 100%; overflow: hidden; }
.text-loop-svg { display: block; width: 100%; height: 100%; overflow: visible; }
.text-loop-text { user-select: none; -webkit-user-select: none; }
.text-loop-measure { visibility: hidden; pointer-events: none; }
.text-loop--draggable { cursor: grab; touch-action: pan-y; }
`;
  document.head.appendChild(style);
};

let uid = 0;

/**
 * Cria o TextLoop dentro de um elemento (o elemento precisa ter altura!).
 * @param {HTMLElement|string} target  elemento ou seletor CSS
 * @param {object} options             mesmas props do componente React
 * @returns {{ update(opts: object): void, destroy(): void }}
 */
export function createTextLoop(target, options = {}) {
  const container = typeof target === 'string' ? document.querySelector(target) : target;
  if (!container) throw new Error('TextLoop: container não encontrado');

  injectStyles();
  container.classList.add('text-loop');

  let s = { ...DEFAULTS, ...options };
  let progress = 0;
  let metrics = { length: 0, reps: 1, crossLength: 0, crossReps: 1 };
  let nodes = null;
  let stopAnim = () => {};

  // ---------- Montagem do SVG ----------
  const render = () => {
    const base = `text-loop-${++uid}`;
    const pathId = base;
    const crossId = `${base}-cross`;
    const fadeId = `${base}-fade`;
    const maskId = `${base}-mask`;
    const shadowId = `${base}-shadow`;
    const underId = `${base}-under`;

    const custom = Boolean(s.path);
    const d = s.path || buildPath(s.shape, s.curviness, s.ribbonWidth);
    const crossD = !s.cross
      ? ''
      : s.path ||
        buildPath(s.shape, s.curviness, s.ribbonWidth, s.shape === 'wave' || s.shape === 'arch' || s.shape === 'circle');
    const fade = buildFade(s.edgeFade);
    const fill = s.color || (s.ribbon ? '#ffffff' : 'currentColor');

    const half = s.cross ? s.crossAngle / 2 : 0;
    const mainAngle = s.tilt + half;
    const crossAngleDeg = s.tilt - half;
    const mainTransform = mainAngle ? `rotate(${mainAngle} ${CX} ${CY})` : undefined;
    const crossTransform = crossAngleDeg ? `rotate(${crossAngleDeg} ${CX} ${CY})` : undefined;
    const crossTape = s.crossColor || tint(s.ribbonColor, 0.62);
    const crossFill = s.ribbon ? inkOn(crossTape) : s.crossColor || 'currentColor';
    const crossDim = !s.ribbon && !s.crossColor ? 0.45 : 1;

    const baseText = s.uppercase ? String(s.text).toUpperCase() : String(s.text);
    const gap = s.separator ? `\u00A0${s.separator}\u00A0` : '\u00A0\u00A0\u00A0';
    const unit = `${baseText}${gap}`;

    const textStyle = `font-size:${s.fontSize}px;font-weight:${s.fontWeight};letter-spacing:${s.letterSpacing}px`;

    const paint = (ink, opacity) =>
      s.outline
        ? {
            fill: 'none',
            stroke: ink,
            'stroke-opacity': opacity,
            'stroke-width': s.outlineWidth,
            'stroke-linejoin': 'round'
          }
        : { fill: ink, 'fill-opacity': opacity };

    container.replaceChildren();
    container.classList.toggle('text-loop--draggable', Boolean(s.draggable));

    const svg = el(
      'svg',
      {
        class: 'text-loop-svg',
        viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
        preserveAspectRatio: 'xMidYMid meet',
        role: 'img',
        'aria-label': s.text
      },
      container
    );
    const defs = el('defs', {}, svg);

    if (fade.length > 0) {
      const gradient = el('linearGradient', { id: fadeId, x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
      fade.forEach(stop =>
        el('stop', { offset: stop.offset, 'stop-color': '#ffffff', 'stop-opacity': stop.opacity }, gradient)
      );
      const mask = el(
        'mask',
        { id: maskId, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: VIEW_W, height: VIEW_H },
        defs
      );
      el('rect', { width: VIEW_W, height: VIEW_H, fill: `url(#${fadeId})` }, mask);
    }

    if (s.cross && s.ribbon) {
      const filter = el(
        'filter',
        {
          id: shadowId,
          filterUnits: 'userSpaceOnUse',
          x: -VIEW_W,
          y: -VIEW_H,
          width: VIEW_W * 3,
          height: VIEW_H * 3
        },
        defs
      );
      el('feGaussianBlur', { stdDeviation: Math.max(4, s.ribbonWidth * 0.11) }, filter);

      const under = el(
        'mask',
        {
          id: underId,
          maskUnits: 'userSpaceOnUse',
          x: -VIEW_W,
          y: -VIEW_H,
          width: VIEW_W * 3,
          height: VIEW_H * 3
        },
        defs
      );
      const underGroup = el('g', { transform: crossTransform }, under);
      el(
        'path',
        {
          d: crossD,
          fill: 'none',
          stroke: '#ffffff',
          'stroke-width': s.ribbonWidth,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round'
        },
        underGroup
      );
    }

    // Texto escondido só para medir a largura de uma unidade
    const measureEl = el('text', { class: 'text-loop-measure', style: textStyle, 'aria-hidden': 'true' }, svg);
    measureEl.textContent = unit;

    const root = el('g', { mask: fade.length > 0 ? `url(#${maskId})` : undefined }, svg);

    // Cria um <text><textPath/></text>
    const makeText = (parent, paintAttrs, href) => {
      const text = el(
        'text',
        {
          class: 'text-loop-text',
          style: textStyle,
          ...paintAttrs,
          'dominant-baseline': 'central',
          'aria-hidden': 'true'
        },
        parent
      );
      const textPath = el('textPath', { href: `#${href}`, startOffset: 0 }, text);
      textPath.textContent = unit;
      return { text, textPath };
    };

    let crossPath = null;
    let crossHead = null;
    let crossTail = null;
    const crossTexts = [];

    if (s.cross) {
      const crossGroup = el('g', { transform: crossTransform }, root);
      crossPath = el(
        'path',
        {
          id: crossId,
          d: crossD,
          fill: 'none',
          stroke: s.ribbon ? crossTape : 'none',
          'stroke-width': s.ribbon ? s.ribbonWidth : 0,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round'
        },
        crossGroup
      );
      const crossPaint = paint(crossFill, crossDim);
      const a = makeText(crossGroup, crossPaint, crossId);
      const b = makeText(crossGroup, crossPaint, crossId);
      crossHead = a.textPath;
      crossTail = b.textPath;
      crossTexts.push(a.text, b.text);
    }

    if (s.cross && s.ribbon) {
      const underWrap = el('g', { mask: `url(#${underId})` }, root);
      const shadow = el(
        'g',
        { filter: `url(#${shadowId})`, transform: `translate(0 ${Math.max(4, s.ribbonWidth * 0.08)})` },
        underWrap
      );
      const shadowRot = el('g', { transform: mainTransform }, shadow);
      el(
        'path',
        {
          d,
          fill: 'none',
          stroke: '#000000',
          'stroke-opacity': 0.42,
          'stroke-width': s.ribbonWidth,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round'
        },
        shadowRot
      );
    }

    const mainGroup = el('g', { transform: mainTransform }, root);
    const path = el(
      'path',
      {
        id: pathId,
        d,
        fill: 'none',
        stroke: s.ribbon ? s.ribbonColor : 'none',
        'stroke-width': s.ribbon ? s.ribbonWidth : 0,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      },
      mainGroup
    );
    const mainPaint = paint(fill, 1);
    const m1 = makeText(mainGroup, mainPaint, pathId);
    const m2 = makeText(mainGroup, mainPaint, pathId);

    nodes = {
      svg,
      path,
      crossPath,
      measureEl,
      head: m1.textPath,
      tail: m2.textPath,
      mainTexts: [m1.text, m2.text],
      crossHead,
      crossTail,
      crossTexts,
      unit,
      custom,
      mainAngle
    };
  };

  // ---------- Medidas ----------
  const applyMetrics = n => {
    const loopText = n.unit.repeat(metrics.reps);
    const crossText = n.unit.repeat(metrics.crossReps);
    n.head.textContent = loopText;
    n.tail.textContent = loopText;
    n.mainTexts.forEach(t => {
      t.setAttribute('textLength', String(metrics.length));
      t.setAttribute('lengthAdjust', 'spacing');
    });
    if (n.crossHead && n.crossTail) {
      n.crossHead.textContent = crossText;
      n.crossTail.textContent = crossText;
      n.crossTexts.forEach(t => {
        if (metrics.crossLength) t.setAttribute('textLength', String(metrics.crossLength));
        t.setAttribute('lengthAdjust', 'spacing');
      });
    }
  };

  const measure = n => {
    if (n !== nodes) return; // render antigo, ignora
    let length = 0;
    let unitWidth = 0;
    let crossLength = 0;
    try {
      length = n.path.getTotalLength();
      unitWidth = n.measureEl.getComputedTextLength();
      crossLength = n.crossPath ? n.crossPath.getTotalLength() : 0;
    } catch {
      return;
    }
    if (!length) return;

    const repsFor = total => (unitWidth > 0 ? Math.max(1, Math.round(total / unitWidth)) : 1);
    const next = { length, reps: repsFor(length), crossLength, crossReps: repsFor(crossLength) };
    const same =
      next.length === metrics.length &&
      next.reps === metrics.reps &&
      next.crossLength === metrics.crossLength &&
      next.crossReps === metrics.crossReps;
    metrics = next;
    applyMetrics(n);
    if (!same || !n.bound) {
      n.bound = true;
      bindAnimation(n);
    }
  };

  // ---------- Animação / interação ----------
  const bindAnimation = n => {
    stopAnim();
    const { length, crossLength } = metrics;
    const root = container;
    const svg = n.svg;
    if (!length) return;

    const crossPaths = s.cross && n.crossHead && n.crossTail && crossLength > 0 ? [n.crossHead, n.crossTail] : null;

    let travel = progress * length;
    const apply = () => {
      const offset = wrap(travel, length);
      progress = offset / length;
      n.head.setAttribute('startOffset', String(offset));
      n.tail.setAttribute('startOffset', String(offset - length));
      if (crossPaths) {
        const crossOffset = wrap(-travel, crossLength);
        crossPaths[0].setAttribute('startOffset', String(crossOffset));
        crossPaths[1].setAttribute('startOffset', String(crossOffset - crossLength));
      }
    };
    apply();

    const reduced = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    const sign = s.direction === 'reverse' ? -1 : 1;
    const base = reduced ? 0 : Math.max(0, s.speed) * sign;
    const hover = { scale: 1 };
    const angle = (n.mainAngle * Math.PI) / 180;
    const circular = !n.custom && s.shape === 'circle';
    const radius = circleRadius(s.curviness, s.ribbonWidth);
    const boosting = s.scrollBoost > 0 && !reduced;

    let fling = 0;
    let boost = 0;
    let scrollVelocity = 0;
    let scrollAt = 0;
    let scrollPos = 0;
    let scrollSource = null;
    let dragging = false;
    let pointerId = null;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;
    let center = { x: 0, y: 0 };
    let running = false;

    const tick = (_, deltaMs) => {
      if (dragging) return;
      const dt = Math.min(0.05, deltaMs / 1000);
      fling *= Math.exp(-dt / 0.55);
      if (boosting) {
        if (performance.now() - scrollAt > 90) scrollVelocity *= Math.exp(-dt / 0.12);
        const target = clamp(scrollVelocity * s.scrollBoost * 0.35 * sign, -MAX_BOOST, MAX_BOOST);
        boost += (target - boost) * (1 - Math.exp(-dt / 0.18));
      }
      const v = base * hover.scale + fling + boost;
      if (Math.abs(v) < 0.01) return;
      travel += v * dt;
      apply();
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      gsap.ticker.add(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
    };

    const glide = hovered =>
      gsap.to(hover, {
        scale: hovered ? 0 : 1,
        duration: hovered ? 0.6 : 0.9,
        ease: hovered ? 'power2.out' : 'power2.inOut',
        overwrite: true
      });
    const onEnter = event => {
      if (event.pointerType !== 'touch') glide(true);
    };
    const onLeave = () => glide(false);

    const onDown = event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      pointerId = event.pointerId;
      root.setPointerCapture?.(event.pointerId);
      lastX = event.clientX;
      lastY = event.clientY;
      lastT = performance.now();
      velocity = base * hover.scale + fling + boost;
      const rect = svg.getBoundingClientRect();
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      root.style.cursor = 'grabbing';
    };
    const onMove = event => {
      if (!dragging || event.pointerId !== pointerId) return;
      const now = performance.now();
      let delta;
      if (circular) {
        let turn =
          Math.atan2(event.clientY - center.y, event.clientX - center.x) -
          Math.atan2(lastY - center.y, lastX - center.x);
        if (turn > Math.PI) turn -= Math.PI * 2;
        if (turn < -Math.PI) turn += Math.PI * 2;
        delta = turn * radius;
      } else {
        const scale = VIEW_W / (svg.getBoundingClientRect().width || VIEW_W);
        delta = ((event.clientX - lastX) * Math.cos(angle) + (event.clientY - lastY) * Math.sin(angle)) * scale;
      }
      travel += delta;
      apply();
      const dt = Math.max(1, now - lastT) / 1000;
      velocity = velocity * 0.6 + (delta / dt) * 0.4;
      lastX = event.clientX;
      lastY = event.clientY;
      lastT = now;
    };
    const onUp = event => {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      root.style.cursor = '';
      if (reduced) return;
      const release = performance.now() - lastT > 90 ? 0 : clamp(velocity, -MAX_FLING, MAX_FLING);
      fling = release - (base * hover.scale + boost);
    };

    const onScroll = event => {
      const source = event.target;
      const isPage = source === document || source === document.documentElement || source === document.body;
      if (!isPage && !(source instanceof Node && source.contains(root))) return;
      const pos = isPage ? window.scrollY : source.scrollTop;
      const now = performance.now();
      if (source !== scrollSource || now - scrollAt > 200) {
        scrollSource = source;
        scrollPos = pos;
        scrollAt = now;
        return;
      }
      const instant = (pos - scrollPos) / (Math.max(8, now - scrollAt) / 1000);
      scrollVelocity = scrollVelocity * 0.5 + instant * 0.5;
      scrollPos = pos;
      scrollAt = now;
    };

    if (s.pauseOnHover) {
      root.addEventListener('pointerenter', onEnter);
      root.addEventListener('pointerleave', onLeave);
    }
    if (s.draggable) {
      root.addEventListener('pointerdown', onDown);
      root.addEventListener('pointermove', onMove);
      root.addEventListener('pointerup', onUp);
      root.addEventListener('pointercancel', onUp);
    }
    if (boosting) window.addEventListener('scroll', onScroll, { capture: true, passive: true });

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) start();
            else stop();
          })
        : null;
    if (observer) observer.observe(root);
    else start();

    stopAnim = () => {
      observer?.disconnect();
      stop();
      gsap.killTweensOf(hover);
      root.style.cursor = '';
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      window.removeEventListener('scroll', onScroll, { capture: true });
      stopAnim = () => {};
    };
  };

  // ---------- Ciclo de vida ----------
  const build = () => {
    stopAnim();
    render();
    const n = nodes;
    measure(n);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => measure(n)).catch(() => {});
    }
  };

  build();

  return {
    /** Atualiza opções (reconstrói o SVG mantendo a posição do texto). */
    update(next = {}) {
      s = { ...s, ...next };
      build();
    },
    /** Remove tudo e para a animação. */
    destroy() {
      stopAnim();
      nodes = null;
      container.replaceChildren();
      container.classList.remove('text-loop', 'text-loop--draggable');
    }
  };
}

export default createTextLoop;