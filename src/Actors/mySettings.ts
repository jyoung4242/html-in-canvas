import { Engine, Scene, ScreenElement, vec } from "excalibur";
import { HtmlInCanvas } from "../Components/HICGraphic";

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  fullscreen: boolean;
  vsync: boolean;
}

export class SettingsPanel extends ScreenElement {
  htmlGraphic: HtmlInCanvas;
  panelEl: HTMLDivElement;
  masterVolumeSlider: HTMLInputElement;
  sfxVolumeSlider: HTMLInputElement;
  fullscreenCheckbox: HTMLInputElement;
  vsyncCheckbox: HTMLInputElement;
  onChanged?: (settings: GameSettings) => void;

  constructor(
    x: number,
    y: number,
    width: number = 300,
    height: number = 320,
    initialSettings?: Partial<GameSettings>,
    onChanged?: (settings: GameSettings) => void,
  ) {
    super({
      pos: vec(x, y),
      width,
      height,
    });

    this.onChanged = onChanged;

    const settings: GameSettings = {
      masterVolume: initialSettings?.masterVolume ?? 80,
      sfxVolume: initialSettings?.sfxVolume ?? 100,
      fullscreen: initialSettings?.fullscreen ?? false,
      vsync: initialSettings?.vsync ?? true,
    };

    // 1. Build main container element
    this.panelEl = document.createElement("div");
    this.panelEl.setAttribute("drawable", "");
    this.panelEl.className = "html-canvas-settings";

    Object.assign(this.panelEl.style, {
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
      gap: "16px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    });

    // Title
    const title = document.createElement("h3");
    title.textContent = "Settings";
    Object.assign(title.style, {
      margin: "0",
      fontSize: "18px",
      fontWeight: "700",
      textAlign: "center",
      color: "#ffffff",
    });

    // 2. Build Controls
    const masterGroup = this.createSliderRow("Master Volume", 0, 100, settings.masterVolume, val => {
      settings.masterVolume = val;
      this.triggerChange(settings);
    });
    this.masterVolumeSlider = masterGroup.querySelector("input") as HTMLInputElement;

    const sfxGroup = this.createSliderRow("SFX Volume", 0, 100, settings.sfxVolume, val => {
      settings.sfxVolume = val;
      this.triggerChange(settings);
    });
    this.sfxVolumeSlider = sfxGroup.querySelector("input") as HTMLInputElement;

    const fullscreenGroup = this.createCheckboxRow("Fullscreen", settings.fullscreen, checked => {
      settings.fullscreen = checked;
      this.triggerChange(settings);
    });
    this.fullscreenCheckbox = fullscreenGroup.querySelector("input") as HTMLInputElement;

    const vsyncGroup = this.createCheckboxRow("V-Sync", settings.vsync, checked => {
      settings.vsync = checked;
      this.triggerChange(settings);
    });
    this.vsyncCheckbox = vsyncGroup.querySelector("input") as HTMLInputElement;

    // Append all items
    this.panelEl.appendChild(title);
    this.panelEl.appendChild(masterGroup);
    this.panelEl.appendChild(sfxGroup);
    this.panelEl.appendChild(fullscreenGroup);
    this.panelEl.appendChild(vsyncGroup);

    // 3. Wrap in HtmlInCanvas with 2D Canvas Fallback
    this.htmlGraphic = new HtmlInCanvas(width, height, this.panelEl, (ctx, w, h) => {
      // Panel Background
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
      ctx.fillText("Settings", w / 2, 35);

      // Fallback text placeholders for controls
      ctx.fillStyle = "#a0a0b0";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Master Volume", 20, 65);
      ctx.fillText("SFX Volume", 20, 130);
      ctx.fillText("Fullscreen", 45, 198);
      ctx.fillText("V-Sync", 45, 240);
    });

    this.graphics.use(this.htmlGraphic);
  }

  private createSliderRow(label: string, min: number, max: number, value: number, onChange: (val: number) => void): HTMLDivElement {
    const row = document.createElement("div");
    Object.assign(row.style, {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    });

    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "12px",
      color: "#a0a0b0",
      fontWeight: "500",
    });

    const lbl = document.createElement("span");
    lbl.textContent = label;

    const valSpan = document.createElement("span");
    valSpan.textContent = `${value}%`;
    valSpan.style.color = "#ffffff";

    header.appendChild(lbl);
    header.appendChild(valSpan);

    const input = document.createElement("input");
    input.type = "range";
    input.min = min.toString();
    input.max = max.toString();
    input.value = value.toString();
    Object.assign(input.style, {
      accentColor: "#4f46e5",
      cursor: "pointer",
    });

    input.addEventListener("input", () => {
      const numVal = parseInt(input.value, 10);
      valSpan.textContent = `${numVal}%`;
      onChange(numVal);
      if (this.htmlGraphic.supported) {
        this.htmlGraphic.canvas.requestPaint?.();
      }
    });

    row.appendChild(header);
    row.appendChild(input);
    return row;
  }

  private createCheckboxRow(label: string, checked: boolean, onChange: (checked: boolean) => void): HTMLDivElement {
    const row = document.createElement("label");
    Object.assign(row.style, {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "13px",
      color: "#f0f0f5",
      cursor: "pointer",
      userSelect: "none",
      marginTop: "4px",
    });

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    Object.assign(input.style, {
      width: "16px",
      height: "16px",
      accentColor: "#4f46e5",
      cursor: "pointer",
    });

    input.addEventListener("change", () => {
      onChange(input.checked);
      if (this.htmlGraphic.supported) {
        this.htmlGraphic.canvas.requestPaint?.();
      }
    });

    const span = document.createElement("span");
    span.textContent = label;

    row.appendChild(input);
    row.appendChild(span);
    return row;
  }

  private triggerChange(settings: GameSettings): void {
    this.onChanged?.(settings);
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
