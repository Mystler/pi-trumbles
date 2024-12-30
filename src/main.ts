import { mount } from "svelte";
import TrumbleCanvas from "./TrumbleCanvas.svelte";

declare global {
  interface Window {
    trumbleSeed: number;
    trumbles: number;
  }
}

if (window.trumbleSeed && window.trumbles && window.trumbles >= 3) {
  mount(TrumbleCanvas, {
    target: document.getElementById("t-overlay") as Element,
    props: { seed: window.trumbleSeed, trumbles: window.trumbles },
  });
} else if (window.trumbleSeed) {
  localStorage.removeItem("Trumbles_" + window.trumbleSeed);
}
