import { mount } from "svelte";
import TrumbleCanvas from "./TrumbleCanvas.svelte";

declare global {
  interface Window {
    trumbleSeed: number;
    trumbles: number;
  }
}

if (window.trumbleSeed && window.trumbles) {
  mount(TrumbleCanvas, {
    target: document.getElementById("t-overlay") as Element,
    props: { seed: window.trumbleSeed, trumbles: window.trumbles },
  });
}
