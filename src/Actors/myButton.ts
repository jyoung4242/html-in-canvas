import { Engine, ExcaliburGraphicsContext, Graphic, Scene, ScreenElement, vec } from "excalibur";
import { HtmlInCanvas } from "../Components/HICGraphic";

/**
 * A concrete ScreenElement component configured as a button using HtmlInCanvas.
 */
export class MyButton extends ScreenElement {
  onClick?: () => void;
  text: string;
  htmlGraphic: HtmlInCanvas;
  buttonEl: HTMLButtonElement;

  constructor(
    public x: number,
    public y: number,
    width: number,
    height: number,
    textOrOnClick?: string | (() => void),
    onClick?: () => void,
  ) {
    super({
      pos: vec(x, y),
      width,
      height,
    });

    let resolvedText = "Click Me!";
    let resolvedOnClick: (() => void) | undefined;

    if (typeof textOrOnClick === "function") {
      resolvedOnClick = textOrOnClick;
    } else if (typeof textOrOnClick === "string") {
      resolvedText = textOrOnClick;
      resolvedOnClick = onClick;
    } else {
      resolvedOnClick = onClick;
    }

    this.text = resolvedText;
    this.onClick = resolvedOnClick;

    // 1. Create and configure the button DOM element directly inside ScreenElement/MyButton
    this.buttonEl = document.createElement("button");
    this.buttonEl.setAttribute("drawable", "");
    this.buttonEl.className = "html-canvas-btn";
    this.buttonEl.textContent = this.text;

    Object.assign(this.buttonEl.style, {
      width: `${width}px`,
      height: `${height}px`,
      boxSizing: "border-box",
      margin: "0px",
      padding: "0px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      background: "#222222",
      color: "#ffffff",
      border: "none",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: "1",
    });

    if (this.onClick) {
      this.buttonEl.addEventListener("click", () => this.onClick?.());
    }

    // 2. Instantiate the general-purpose HtmlInCanvas graphic, passing the button element and a fallback renderer
    this.htmlGraphic = new HtmlInCanvas(width, height, this.buttonEl, (ctx, w, h) => {
      ctx.fillStyle = "#4a90e2";
      ctx.beginPath();
      ctx.roundRect?.(0, 0, w, h, 8) ?? ctx.rect(0, 0, w, h);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.text, w / 2, h / 2);
    });

    this.graphics.use(this.htmlGraphic);
  }

  get button(): HTMLButtonElement {
    return this.buttonEl;
  }

  setText(text: string): void {
    this.text = text;
    this.buttonEl.textContent = text;
    if (this.htmlGraphic.supported) {
      this.htmlGraphic.canvas.requestPaint?.();
    }
  }

  setHtml(html: string): void {
    this.text = html;
    this.buttonEl.innerHTML = html;
    if (this.htmlGraphic.supported) {
      this.htmlGraphic.canvas.requestPaint?.();
    }
  }

  private syncPosition(engine: Engine): void {
    const canvasRect = engine.canvas.getBoundingClientRect();
    const screenX = canvasRect.left + this.pos.x;
    const screenY = canvasRect.top + this.pos.y;
    this.htmlGraphic.updateDomPosition(screenX, screenY);
  }

  override onInitialize(engine: Engine): void {
    super.onInitialize(engine);
    this.syncPosition(engine);
  }

  override onPostUpdate(engine: Engine, delta: number): void {
    super.onPostUpdate(engine, delta);
    this.syncPosition(engine);
  }

  override onPreKill(scene: Scene): void {
    super.onPreKill(scene);
    this.htmlGraphic.dispose();
  }
}
