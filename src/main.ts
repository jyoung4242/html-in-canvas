// main.ts
import "./style.css";

import { Engine, DisplayMode } from "excalibur";
import { MyButton } from "./Actors/myButton";
import { LoginForm } from "./Actors/myForm";
import { SettingsPanel } from "./Actors/mySettings";

const game = new Engine({
  width: 800, // the width of the canvas
  height: 600, // the height of the canvas
  displayMode: DisplayMode.FitScreenAndFill, // the display mode
  pixelArt: true,
});

await game.start();

// let clicks = 0;
// let myButton = new MyButton(100, 100, 200, 50, () => {
//   clicks++;
//   console.log(`Button clicked! Count: ${clicks}`);
//   myButton.setText(`Clicked: ${clicks}`);
// });
// game.add(myButton);

// let myForm = new LoginForm(100, 100, 280, 260, data => {
//   console.log("Form submitted:", data);
// });
// game.add(myForm);

let mySettings = new SettingsPanel(100, 100, 300, 320, undefined, settings => {
  console.log("Settings changed:", settings);
});
game.add(mySettings);
