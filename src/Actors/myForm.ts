import { Engine, Scene, ScreenElement, vec } from "excalibur";
import { HtmlInCanvas } from "../Components/HICGraphic";

export interface LoginFormData {
  username?: string;
  password?: string;
}

export class LoginForm extends ScreenElement {
  htmlGraphic: HtmlInCanvas;
  formEl: HTMLFormElement;
  usernameInput: HTMLInputElement;
  passwordInput: HTMLInputElement;
  onSubmit?: (data: LoginFormData) => void;

  constructor(x: number, y: number, width: number = 280, height: number = 260, onSubmit?: (data: LoginFormData) => void) {
    super({
      pos: vec(x, y),
      width,
      height,
    });

    this.onSubmit = onSubmit;

    // 1. Build nested HTML structure
    this.formEl = document.createElement("form");
    this.formEl.setAttribute("drawable", "");
    this.formEl.className = "html-canvas-form";

    // Styles for main form container
    Object.assign(this.formEl.style, {
      width: `${width}px`,
      height: `${height}px`,
      boxSizing: "border-box",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: "#1e1e24",
      color: "#f0f0f5",
      border: "1px solid #33333f",
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    });

    // Title
    const title = document.createElement("h3");
    title.textContent = "Sign In";
    Object.assign(title.style, {
      margin: "0 0 4px 0",
      fontSize: "18px",
      fontWeight: "700",
      textAlign: "center",
      color: "#ffffff",
    });

    // Username Field Group
    const userGroup = this.createInputGroup("Username", "text", "Enter username");
    this.usernameInput = userGroup.querySelector("input") as HTMLInputElement;

    // Password Field Group
    const passGroup = this.createInputGroup("Password", "password", "••••••••");
    this.passwordInput = passGroup.querySelector("input") as HTMLInputElement;

    // Submit Button
    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = "Log In";
    Object.assign(submitBtn.style, {
      marginTop: "8px",
      padding: "10px",
      fontSize: "14px",
      fontWeight: "600",
      color: "#ffffff",
      backgroundColor: "#4f46e5",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    });

    // Append nested controls into form container
    this.formEl.appendChild(title);
    this.formEl.appendChild(userGroup);
    this.formEl.appendChild(passGroup);
    this.formEl.appendChild(submitBtn);

    // Form submit listener
    this.formEl.addEventListener("submit", e => {
      e.preventDefault();
      this.onSubmit?.({
        username: this.usernameInput.value,
        password: this.passwordInput.value,
      });
    });

    // 2. Wrap in HtmlInCanvas with 2D Canvas Fallback
    this.htmlGraphic = new HtmlInCanvas(width, height, this.formEl, (ctx, w, h) => {
      // Background Card
      ctx.fillStyle = "#1e1e24";
      ctx.beginPath();
      ctx.roundRect?.(0, 0, w, h, 12) ?? ctx.rect(0, 0, w, h);
      ctx.fill();
      ctx.strokeStyle = "#33333f";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Sign In", w / 2, 35);

      // Input Placeholders
      ctx.fillStyle = "#2a2a35";
      ctx.beginPath();
      ctx.roundRect?.(20, 65, w - 40, 32, 6) ?? ctx.rect(20, 65, w - 40, 32);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect?.(20, 130, w - 40, 32, 6) ?? ctx.rect(20, 130, w - 40, 32);
      ctx.fill();

      // Field Labels
      ctx.fillStyle = "#a0a0b0";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Username", 20, 58);
      ctx.fillText("Password", 20, 123);

      // Submit Button
      ctx.fillStyle = "#4f46e5";
      ctx.beginPath();
      ctx.roundRect?.(20, 185, w - 40, 36, 6) ?? ctx.rect(20, 185, w - 40, 36);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Log In", w / 2, 207);
    });

    this.graphics.use(this.htmlGraphic);
  }

  private createInputGroup(label: string, type: string, placeholder: string): HTMLDivElement {
    const group = document.createElement("div");
    Object.assign(group.style, {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    });

    const lbl = document.createElement("label");
    lbl.textContent = label;
    Object.assign(lbl.style, {
      fontSize: "12px",
      color: "#a0a0b0",
      fontWeight: "500",
    });

    const input = document.createElement("input");
    input.type = type;
    input.placeholder = placeholder;
    Object.assign(input.style, {
      padding: "8px 10px",
      fontSize: "14px",
      borderRadius: "6px",
      border: "1px solid #3a3a4c",
      backgroundColor: "#2a2a35",
      color: "#ffffff",
      outline: "none",
    });

    // Request canvas repaint on input updates when API is supported
    input.addEventListener("input", () => {
      if (this.htmlGraphic.supported) {
        this.htmlGraphic.canvas.requestPaint?.();
      }
    });

    group.appendChild(lbl);
    group.appendChild(input);
    return group;
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
