import * as ex from 'excalibur';

/**
 * Excalibur + HTML-in-Canvas test harness.
 *
 * A DOM panel (#panel) lives inside a canvas marked as drawable (#ui-canvas).
 * On every `paint` event we draw the panel into that canvas with drawElementImage().
 *
 * Two display modes (press M to toggle):
 *  - overlay: #ui-canvas is visible on top of the Excalibur canvas.
 *  - engine : #ui-canvas is invisible (opacity 0) but still laid out and hit-testable,
 *             and its pixels are re-drawn by Excalibur through an ex.Canvas graphic
 *             on a ScreenElement. Input still goes to the real DOM; pixels come from the engine.
 *
 * The API is experimental. Everything API-specific is isolated below.
 */

// ---- API shims (not in lib.dom yet) ----------------------------------------
type DrawElementCtx = CanvasRenderingContext2D & {
  drawElementImage?: (el: Element, x: number, y: number) => DOMMatrix | undefined;
};
type PaintCanvas = HTMLCanvasElement & { requestPaint?: () => void };

const uiCanvas = document.getElementById('ui-canvas') as PaintCanvas;
const panel = document.getElementById('panel') as HTMLDivElement;
const statusEl = document.getElementById('status') as HTMLPreElement;
const uiCtx = uiCanvas.getContext('2d') as DrawElementCtx;

const supported = typeof uiCtx.drawElementImage === 'function';

// Some builds sync the live element's transform automatically for 2D contexts;
// older ones expect you to apply the returned matrix. Add ?nosync to disable manual sync.
const MANUAL_SYNC = !new URLSearchParams(location.search).has('nosync');

// Opt-in attribute: `content="drawable"` (Chrome 155+) or legacy `layoutsubtree`.
if (supported) {
  if ('content' in HTMLCanvasElement.prototype) {
    uiCanvas.setAttribute('content', 'drawable');
  } else {
    uiCanvas.setAttribute('layoutsubtree', '');
  }
}

// ---- Excalibur --------------------------------------------------------------
const W = 800;
const H = 600;
const game = new ex.Engine({
  canvasElementId: 'game',
  width: W,
  height: H,
  // Fixed so game pixels == CSS pixels, which keeps DOM hit-testing aligned with what you see.
  displayMode: ex.DisplayMode.Fixed,
  backgroundColor: ex.Color.fromHex('#1b2030'),
  suppressPlayButton: true
});

// ex.Canvas graphic that mirrors the UI canvas into the engine's render pipeline.
const uiGraphic = new ex.Canvas({
  width: 320,
  height: 180,
  cache: false, // redraw every frame
  draw: (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, 320, 180);
    ctx.drawImage(uiCanvas, 0, 0);
  }
});

class UiMirror extends ex.ScreenElement {
  constructor() {
    super({ x: 16, y: 16, anchor: ex.vec(0, 0), z: 100 });
  }
  onInitialize() {
    this.graphics.use(uiGraphic);
  }
}
const mirror = new UiMirror();
game.add(mirror);

// ---- Game content to prove input flows through ------------------------------
let balls = 0;
function spawnBall() {
  balls++;
  const ball = new ex.Actor({
    x: 100 + Math.random() * 600,
    y: 260 + Math.random() * 100,
    radius: 14,
    color: ex.Color.fromHSL(Math.random(), 0.7, 0.6),
    vel: ex.vec((Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300)
  });
  ball.on('postupdate', () => {
    if (ball.pos.x < 14 || ball.pos.x > W - 14) ball.vel.x *= -1;
    if (ball.pos.y < 14 || ball.pos.y > H - 14) ball.vel.y *= -1;
  });
  game.add(ball);
}

// ---- Panel wiring (plain DOM events) ----------------------------------------
let clicks = 0;
const countBtn = document.getElementById('btn-count') as HTMLButtonElement;
document.getElementById('btn-spawn')!.addEventListener('click', spawnBall);
countBtn.addEventListener('click', () => {
  clicks++;
  countBtn.textContent = `Clicked: ${clicks}`; // DOM change -> browser fires `paint`
});

// ---- Mode toggle -------------------------------------------------------------
let mode: 'overlay' | 'engine' = 'overlay';
function applyMode() {
  uiCanvas.style.opacity = mode === 'overlay' ? '1' : '0';
  mirror.graphics.isVisible = mode === 'engine';
}
window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return; // don't hijack typing
  if (e.key.toLowerCase() === 'm') {
    mode = mode === 'overlay' ? 'engine' : 'overlay';
    applyMode();
  }
});
applyMode();

// ---- The paint event ---------------------------------------------------------
let paints = 0;
if (supported) {
  uiCanvas.addEventListener('paint', () => {
    paints++;
    uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
    const m = uiCtx.drawElementImage!(panel, 0, 0);
    if (MANUAL_SYNC && m) {
      // Keep the live DOM element aligned with the pixels so clicks land correctly.
      panel.style.transform = m.toString();
    }
  });

  // Drive a paint every frame (hover/focus/DOM changes already trigger one on their own).
  game.on('postupdate', () => uiCanvas.requestPaint?.());
  uiCanvas.requestPaint?.();
}

// ---- Status readout ----------------------------------------------------------
setInterval(() => {
  statusEl.textContent =
    `drawElementImage supported: ${supported}` +
    (supported ? '' : '  (enable chrome://flags/#canvas-draw-element in Chrome Canary; panel shows as plain DOM fallback)') +
    `\nattribute: ${uiCanvas.getAttribute('content') ?? uiCanvas.getAttribute('layoutsubtree') ?? '(none)'}` +
    `\nmode: ${mode}   (press M to toggle)   manual transform sync: ${MANUAL_SYNC}` +
    `\npaint events: ${paints}   balls: ${balls}   button clicks: ${clicks}`;
}, 250);

game.start();
