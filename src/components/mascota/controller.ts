/**
 * Bladimir controller: expression + loop animation per state (anime.js v4).
 * - Only transform / opacity are animated.
 * - prefers-reduced-motion: expression and accessory swap instantly, no movement.
 * - Loops pause when the character is off-screen or the tab is hidden.
 */
import { animate, createTimeline, stagger, utils, type JSAnimation, type Timeline } from "animejs";
import { STATE_LABEL, type MascotState } from "./states";

type Eyes = "happy" | "open" | "closed" | "up";
type Mouth = "smile" | "grin" | "o" | "soft" | "flat" | "sleep";

/** Extra states used only on the login / password screens. */
export type AuthState = "watch" | "cover" | "peek";
export type AnyState = MascotState | AuthState;

interface Look {
  eyes: Eyes;
  mouth: Mouth;
  acc?: string[]; // accessory class suffixes
  brows?: number; // px up (+) / down (-)
  hands?: "both" | "one"; // login: cover both eyes, or cover one and peek
}

const LOOKS: Record<AnyState, Look> = {
  watch: { eyes: "open", mouth: "smile", brows: 4 },
  cover: { eyes: "closed", mouth: "grin", hands: "both", brows: 6 },
  peek: { eyes: "open", mouth: "o", hands: "one", brows: 10 },
  idle: { eyes: "happy", mouth: "smile" },
  wave: { eyes: "happy", mouth: "grin", acc: ["hand"], brows: 6 },
  flex: { eyes: "happy", mouth: "grin", acc: ["dumbbell", "sparkle"], brows: 8 },
  selfie: { eyes: "open", mouth: "grin", acc: ["phone"] },
  point: { eyes: "open", mouth: "smile", acc: ["point"], brows: 4 },
  celebrate: { eyes: "happy", mouth: "grin", acc: ["confetti"], brows: 10 },
  think: { eyes: "up", mouth: "flat", acc: ["dots"], brows: 6 },
  water: { eyes: "closed", mouth: "o", acc: ["bottle"] },
  cook: { eyes: "open", mouth: "smile", acc: ["pot"] },
  cheer: { eyes: "happy", mouth: "grin", acc: ["clap"], brows: 6 },
  "sad-soft": { eyes: "open", mouth: "soft", brows: -3 },
  sleep: { eyes: "closed", mouth: "sleep", acc: ["zzz"] },
  lift: { eyes: "open", mouth: "smile", acc: ["dumbbell"], brows: 3 },
};

const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface BladimirHandle {
  setState(s: AnyState): void;
  /** Watch mode: -1 (left) … 1 (right). */
  lookAt(x: number): void;
  readonly state: AnyState;
  destroy(): void;
}

export function mount(root: HTMLElement): BladimirHandle {
  const q = <T extends Element = SVGElement>(sel: string) => root.querySelector<T & SVGElement>(sel);
  const qa = (sel: string) => root.querySelectorAll<SVGElement>(sel);
  const svg = q<SVGSVGElement>("svg");
  let running: (JSAnimation | Timeline)[] = [];
  let blinkTimer: number | undefined;
  let current: AnyState = (root.dataset.state as AnyState) ?? "idle";
  let visible = true;

  const stop = () => {
    running.forEach((a) => a.revert());
    running = [];
    clearTimeout(blinkTimer);
  };
  const keep = <T extends JSAnimation | Timeline>(a: T) => (running.push(a), a);

  function applyLook(look: Look) {
    const instant = reduce();
    const show = (sel: string, on: boolean) =>
      qa(sel).forEach((el) => (instant ? utils.set(el, { opacity: on ? 1 : 0 }) : animate(el, { opacity: on ? 1 : 0, duration: 220, ease: "outQuad" })));
    (["happy", "open", "closed", "up"] as Eyes[]).forEach((e) => show(`.bl-eyes-${e}`, e === look.eyes));
    (["smile", "grin", "o", "soft", "flat", "sleep"] as Mouth[]).forEach((m) => show(`.bl-m-${m}`, m === look.mouth));
    qa(".bl-acc").forEach((el) => {
      const on = (look.acc ?? []).some((a) => el.classList.contains(`bl-acc-${a}`));
      show(`.bl-acc-${[...el.classList].find((c) => c.startsWith("bl-acc-"))?.slice(7)}`, on);
    });
    // hands: rise from below the chin to cover one or both eyes
    const hl = q(".bl-hand-l");
    const hr = q(".bl-hand-r");
    if (hl && hr) {
      const pos = (on: boolean, half = false) => ({ y: on ? (half ? 70 : 0) : 190, opacity: on ? 1 : 0 });
      const left = pos(look.hands === "both" || look.hands === "one");
      const right = pos(look.hands === "both" || look.hands === "one", look.hands === "one");
      if (instant) {
        utils.set(hl, left);
        utils.set(hr, right);
      } else {
        animate(hl, { ...left, duration: 420, ease: look.hands ? "outBack(1.6)" : "inQuad" });
        animate(hr, { ...right, duration: 420, delay: 60, ease: look.hands ? "outBack(1.6)" : "inQuad" });
      }
    }
    const brows = qa(".bl-brow");
    instant ? utils.set(brows, { y: -(look.brows ?? 0) }) : animate(brows, { y: -(look.brows ?? 0), duration: 300, ease: "outBack(2)" });
  }

  function scheduleBlink() {
    if (reduce()) return;
    blinkTimer = window.setTimeout(() => {
      if (visible && ["idle", "point", "cook", "lift", "selfie", "sad-soft"].includes(current)) {
        animate(q(".bl-eyes")!, { scaleY: [1, 0.1, 1], duration: 220, ease: "inOutQuad" });
      }
      scheduleBlink();
    }, utils.random(2400, 5200));
  }

  function loops(s: AnyState) {
    if (reduce()) return;
    const body = q(".bl-body")!;
    const head = q(".bl-head")!;
    const loop = { loop: true, alternate: true, ease: "inOutSine" } as const;
    // breathing + subtle curl life, always
    keep(animate(body, { y: [0, -4], scaleY: [1, 1.012], duration: 1800, ...loop }));
    keep(animate(qa(".bl-curl"), { rotate: [-6, 6], duration: 2200, delay: stagger(300), ...loop }));

    switch (s) {
      case "idle":
        keep(animate(head, { rotate: [-1.5, 1.5], duration: 3200, ...loop }));
        break;
      case "wave":
        keep(animate(q(".bl-acc-hand")!, { rotate: [-14, 16], duration: 380, ...loop }));
        keep(animate(head, { rotate: [-3, 3], duration: 760, ...loop }));
        break;
      case "flex":
      case "lift":
        keep(animate(q(".bl-acc-dumbbell")!, { y: [24, -26], duration: s === "flex" ? 520 : 900, ...loop }));
        if (s === "flex") keep(animate(q(".bl-acc-sparkle")!, { scale: [0.7, 1.15], opacity: [0.4, 1], duration: 420, ...loop }));
        break;
      case "selfie": {
        const tl = keep(createTimeline({ loop: true, loopDelay: 1400 }));
        tl.add(q(".bl-acc-phone")!, { rotate: [0, -8], y: [10, -6], duration: 500, ease: "outBack(2)" })
          .add(q(".bl-flash")!, { opacity: [0, 0.9, 0], scale: [0.6, 1.4], duration: 420, ease: "outQuad" })
          .add(q(".bl-eyes")!, { scaleY: [1, 0.15, 1], duration: 260 }, "-=420")
          .add(q(".bl-acc-phone")!, { rotate: 0, y: 10, duration: 500, ease: "inOutQuad" }, "+=500");
        break;
      }
      case "point": {
        const sign = root.dataset.dir === "left" ? -1 : 1;
        keep(animate(q(".bl-acc-point")!, { x: [0, 14 * sign], duration: 520, ...loop }));
        keep(animate(head, { rotate: 4 * sign, duration: 400, ease: "outQuad" }));
        break;
      }
      case "celebrate":
        keep(animate(body, { y: [0, -34, 0], duration: 620, loop: true, loopDelay: 260, ease: "outQuad" }));
        keep(animate(qa(".bl-acc-confetti path, .bl-acc-confetti circle"), { rotate: [-20, 20], scale: [0.8, 1.2], duration: 500, delay: stagger(60), ...loop }));
        break;
      case "think":
        keep(animate(head, { rotate: [0, -6], duration: 1400, ...loop }));
        keep(animate(qa(".bl-acc-dots circle"), { opacity: [0.2, 1], duration: 500, delay: stagger(220), ...loop }));
        break;
      case "water":
        keep(animate(q(".bl-acc-bottle")!, { rotate: [0, -38], x: [0, -24], y: [0, -16], duration: 1100, ...loop }));
        keep(animate(head, { rotate: [0, -5], duration: 1100, ...loop }));
        break;
      case "cook":
        keep(animate(qa(".bl-steam"), { y: [4, -8], opacity: [0.2, 1], duration: 900, ...loop }));
        keep(animate(q(".bl-acc-pot")!, { rotate: [-3, 3], duration: 1300, ...loop }));
        break;
      case "cheer":
        keep(animate(q(".bl-acc-clap")!, { scale: [0.7, 1.15], opacity: [0.3, 1], duration: 260, ...loop }));
        keep(animate(head, { y: [0, -6], duration: 260, ...loop }));
        break;
      case "sad-soft":
        keep(animate(head, { rotate: 5, y: 6, duration: 900, ease: "outQuad" }));
        keep(animate(body, { y: [6, 2], duration: 2600, ...loop }));
        break;
      case "watch":
        keep(animate(head, { rotate: [-1, 1], duration: 2600, ...loop }));
        break;
      case "cover":
        keep(animate(qa(".bl-hand"), { rotate: [-2, 2], duration: 900, ...loop }));
        break;
      case "peek":
        keep(animate(q(".bl-hand-r")!, { y: [64, 76], duration: 700, ...loop }));
        break;
      case "sleep":
        keep(animate(head, { rotate: [8, 10], duration: 2400, ...loop }));
        keep(animate(qa(".bl-acc-zzz path"), { y: [6, -10], opacity: [0.2, 1], duration: 1600, ...loop }));
        break;
    }
  }

  function lookAt(x: number) {
    if (current !== "watch") return;
    const dx = Math.max(-1, Math.min(1, x)) * 9;
    const eyes = qa(".bl-eyes-open circle");
    reduce() ? utils.set(eyes, { x: dx, y: 5 }) : animate(eyes, { x: dx, y: 5, duration: 160, ease: "outQuad" });
  }

  function setState(s: AnyState) {
    if (!(s in LOOKS)) return;
    if (s !== "watch") utils.set(qa(".bl-eyes-open circle"), { x: 0, y: 0 });
    current = s;
    root.dataset.state = s;
    svg?.setAttribute("aria-label", root.dataset.label ?? (s in STATE_LABEL ? STATE_LABEL[s as MascotState] : "Bladimir"));
    stop();
    applyLook(LOOKS[s]);
    if (visible) loops(s);
    scheduleBlink();
  }

  // Pause when off-screen.
  const io = new IntersectionObserver(([e]) => {
    const was = visible;
    visible = Boolean(e?.isIntersecting);
    if (visible && !was) setState(current);
    if (!visible && was) running.forEach((a) => a.pause());
  });
  io.observe(root);
  const onVis = () => (document.hidden ? running.forEach((a) => a.pause()) : visible && running.forEach((a) => a.play()));
  document.addEventListener("visibilitychange", onVis);
  const onEvent = (e: Event) => setState((e as CustomEvent<AnyState>).detail);
  const onLook = (e: Event) => lookAt((e as CustomEvent<number>).detail);
  root.addEventListener("bladimir:state", onEvent);
  root.addEventListener("bladimir:look", onLook);

  setState(current);

  return {
    setState,
    lookAt,
    get state() {
      return current;
    },
    destroy() {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      root.removeEventListener("bladimir:state", onEvent);
      root.removeEventListener("bladimir:look", onLook);
    },
  };
}

const mounted = new WeakMap<HTMLElement, BladimirHandle>();
export function mountAll(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>("[data-bladimir]").forEach((el) => {
    if (!mounted.has(el)) mounted.set(el, mount(el));
  });
}
export const getHandle = (el: HTMLElement) => mounted.get(el);
