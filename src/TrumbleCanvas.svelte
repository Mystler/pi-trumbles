<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import seedrandom from "seedrandom";
  import "./trumbles.css";
  import { on } from "svelte/events";

  let { seed, trumbles }: { seed: number; trumbles: number } = $props();

  interface Trumble {
    x: number; // 0-1 Percentage of screen
    y: number; // 0-1 Percentage of screen
    scale: number; // On top of the baseScale that scales with screen dimensions
    flip: boolean; // Mirror?
    src: string;
  }
  interface LoadedTrumble extends Trumble {
    image: HTMLImageElement;
  }

  // Actually used bounds of the image source
  const TrumbleBounds = {
    x: 0,
    y: 103,
    width: 512,
    height: 337,
  };
  const TrumbleImages = [
    "/images/Trumble01.png",
    "/images/Trumble02.png",
    "/images/Trumble03.png",
    "/images/Trumble04.png",
    "/images/Trumble05.png",
    "/images/Trumble06.png",
    "/images/Trumble07.png",
    "/images/Trumble08.png",
    "/images/Trumble09.png",
  ];
  const TrumbleCap = 50;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let baseScale = 0.2;
  let images: Trumble[] = [];
  let loadedImages: LoadedTrumble[] = [];
  let draggingImage: LoadedTrumble | undefined;
  let offsetX: number, offsetY: number;

  onMount(() => {
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    resizeCanvas();
    initTrumbles();
    loadImages();
  });

  function initTrumbles() {
    let rng = seedrandom(seed.toString());
    for (let ti = 0; ti < Math.min(trumbles, TrumbleCap); ti++) {
      images.push({
        x: rng(),
        y: rng(),
        scale: 1 + (rng() * 0.5 - 0.25),
        flip: rng() >= 0.5,
        src: TrumbleImages[Math.floor(rng() * TrumbleImages.length)],
      });
    }
    // Fetch from localStorage after randomization to not mess up the seed
    const savedTrumbles: ([number, number] | undefined)[] = JSON.parse(
      localStorage.getItem("Trumbles_" + seed) ?? "[]",
    );
    for (let i = 0; i < savedTrumbles.length; i++) {
      if (savedTrumbles[i] && images[i]) {
        images[i].x = savedTrumbles[i]![0];
        images[i].y = savedTrumbles[i]![1];
      }
    }
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    baseScale = Math.min(0.25, (Math.min(canvas.width, canvas.height) * 0.2) / 512);
    drawImages();
  }

  function loadImages() {
    images.forEach((img, index) => {
      const image = new Image();
      image.onload = () => {
        loadedImages[index] = { ...img, image };
        drawImages();
      };
      image.src = img.src;
    });
  }

  function drawImages() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const img of loadedImages) {
      if (!img) continue;
      ctx.save();
      ctx.translate(img.x * canvas.width, img.y * canvas.height);
      ctx.scale(img.flip ? -1 : 1, 1);
      ctx.drawImage(
        img.image,
        TrumbleBounds.x,
        TrumbleBounds.y,
        TrumbleBounds.width,
        TrumbleBounds.height,
        (-img.scale * baseScale * TrumbleBounds.width) / 2,
        (-img.scale * baseScale * TrumbleBounds.height) / 2,
        img.scale * baseScale * TrumbleBounds.width,
        img.scale * baseScale * TrumbleBounds.height,
      );
      ctx.restore();
    }
  }

  function isPixelTransparent(x: number, y: number) {
    const pixelData = ctx?.getImageData(x, y, 1, 1).data;
    return pixelData && pixelData[3] === 0;
  }

  function imageAtCursor(x: number, y: number) {
    return loadedImages.findLast(
      (img) =>
        img &&
        x > img.x * canvas.width - (img.scale * baseScale * TrumbleBounds.width) / 2 &&
        x < img.x * canvas.width + (img.scale * baseScale * TrumbleBounds.width) / 2 &&
        y > img.y * canvas.height - (img.scale * baseScale * TrumbleBounds.height) / 2 &&
        y < img.y * canvas.height + (img.scale * baseScale * TrumbleBounds.height) / 2 &&
        !isPixelTransparent(x, y),
    );
  }

  function onPointerDown(event: PointerEvent) {
    const { clientX, clientY } = event;
    draggingImage = imageAtCursor(clientX, clientY);
    if (draggingImage) {
      offsetX = clientX - draggingImage.x * canvas.width;
      offsetY = clientY - draggingImage.y * canvas.height;
      canvas.style.cursor = "grabbing";
    }
  }

  function onPointerUp() {
    if (draggingImage) {
      // Update localstorage after moving a trumble
      localStorage.setItem(
        "Trumbles_" + seed,
        JSON.stringify(loadedImages.map((img) => (img ? [img.x, img.y] : undefined))),
      );
    }
    draggingImage = undefined;
    canvas.style.cursor = "default";
  }

  function onPointerMove(event: MouseEvent) {
    if (!ctx) return;
    const { clientX, clientY } = event;
    if (draggingImage) {
      draggingImage.x = Math.min(1, Math.max(0, (clientX - offsetX) / canvas.width));
      draggingImage.y = Math.min(1, Math.max(0, (clientY - offsetY) / canvas.height));
      drawImages();
    }
  }

  function onMouseMove(event: MouseEvent) {
    if (draggingImage) return;
    const image = imageAtCursor(event.clientX, event.clientY);
    canvas.style.cursor = image ? "grab" : "default";
    canvas.style.pointerEvents = image ? "auto" : "none";
  }

  // Need to register as not-passive to prevent scrolling on touch screens
  function onTouchStart(event: TouchEvent) {
    const { clientX, clientY } = event.touches[0];
    const image = imageAtCursor(clientX, clientY);
    if (image) {
      canvas.style.pointerEvents = "auto";
      event.preventDefault();
    }
  }
  const touchHandler = on(window, "touchstart", onTouchStart, { passive: false });
  onDestroy(() => touchHandler());
</script>

<svelte:window onresize={resizeCanvas} onmousemove={onMouseMove} />

<canvas
  bind:this={canvas}
  onpointerdown={onPointerDown}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
  onpointermove={onPointerMove}
></canvas>

<style>
</style>
