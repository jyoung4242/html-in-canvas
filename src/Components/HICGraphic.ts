/**
 * A general-purpose Excalibur Graphic that hosts arbitrary DOM elements
 * using the HTML-in-Canvas (drawElementImage) API with a 2D canvas fallback.
 */
import { ExcaliburGraphicsContext, Graphic } from "excalibur";

type DrawElementCtx = CanvasRenderingContext2D & {
  drawElementImage?: (el: Element, x: number, y: number) => DOMMatrix | undefined;
};

type PaintCanvas = HTMLCanvasElement & {
  requestPaint?: () => void;
};

export class HtmlInCanvas extends Graphic {
  canvas: PaintCanvas;
  ctx: DrawElementCtx;
  element: HTMLElement;
  supported: boolean;
  paintCount: number = 0;
  fallbackRenderer?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

  constructor(
    width: number,
    height: number,
    element: HTMLElement,
    fallbackRenderer?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  ) {
    super({ width, height });
    this.element = element;
    this.fallbackRenderer = fallbackRenderer;

    // 1. Create backing canvas for the HTML-in-Canvas API
    this.canvas = document.createElement("canvas") as PaintCanvas;
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.className = "html-in-canvas-backing";

    // 2. Set specifications for compatibility
    this.canvas.setAttribute("content", "drawable");
    this.canvas.setAttribute("layoutsubtree", "");

    // Position overlay matching game coordinate space
    Object.assign(this.canvas.style, {
      position: "fixed",
      left: "0px",
      top: "0px",
      transform: "none",
      width: `${width}px`,
      height: `${height}px`,
      pointerEvents: "auto",
      zIndex: "1000",
      opacity: "1.0",
    });

    this.ctx = this.canvas.getContext("2d") as DrawElementCtx;
    this.supported = typeof this.ctx.drawElementImage === "function";

    // Ensure the target element has the drawable attribute
    if (!this.element.hasAttribute("drawable")) {
      this.element.setAttribute("drawable", "");
    }

    this.canvas.appendChild(this.element);
    document.body.appendChild(this.canvas);

    this.initPainting();
    this.initDebugToggle();
  }

  private initDebugToggle(): void {
    const toggle = document.getElementById("toggle-backing-canvas") as HTMLInputElement | null;
    toggle?.addEventListener("change", () => {
      this.canvas.style.opacity = toggle.checked ? "0.85" : "0.001";
      this.canvas.style.outline = toggle.checked ? "2px solid #ff4a4a" : "none";
    });
  }

  initPainting(): void {
    if (this.supported) {
      this.canvas.addEventListener("paint", () => {
        this.paintCount++;
        this.ctx.clearRect(0, 0, this.width, this.height);

        const matrix = this.ctx.drawElementImage?.(this.element, 0, 0);
        if (matrix) {
          this.element.style.transform = matrix.toString();
        }
      });

      requestAnimationFrame(() => {
        this.canvas.requestPaint?.();
      });
    } else {
      this.drawFallback();
    }
  }

  private drawFallback(): void {
    if (this.fallbackRenderer) {
      this.fallbackRenderer(this.ctx, this.width, this.height);
    } else {
      this.ctx.fillStyle = "#cccccc";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    console.warn(
      "drawElementImage is not supported in this browser. " +
        "Enable chrome://flags/#canvas-draw-element in Chrome Canary to test HTML-in-Canvas.",
    );
  }

  updateDomPosition(screenX: number, screenY: number): void {
    this.canvas.style.left = `${screenX}px`;
    this.canvas.style.top = `${screenY}px`;
  }

  dispose(): void {
    this.canvas.remove();
  }

  clone(): Graphic {
    const clonedElement = this.element.cloneNode(true) as HTMLElement;
    return new HtmlInCanvas(this.width, this.height, clonedElement, this.fallbackRenderer);
  }

  _drawImage(ex: ExcaliburGraphicsContext, x: number, y: number): void {
    if (this.supported) {
      this.canvas.requestPaint?.();
    }
    ex.drawImage(this.canvas, x, y);
  }
}
