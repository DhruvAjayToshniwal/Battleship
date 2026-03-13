import gsap from "gsap";

export function createHitSequence(target: {
  flash: number;
  shake: number;
  glow: number;
}): gsap.core.Timeline {
  const tl = gsap.timeline();
  tl.to(target, { flash: 1, duration: 0.05, ease: "none" }, 0);
  tl.to(target, { flash: 0, duration: 0.4, ease: "power2.out" }, 0.05);
  tl.to(target, { shake: 1, duration: 0.1, ease: "none" }, 0);
  tl.to(target, { shake: 0, duration: 0.3, ease: "power2.out" }, 0.1);
  return tl;
}

export function createMissSequence(target: {
  ripple: number;
  splash: number;
}): gsap.core.Timeline {
  const tl = gsap.timeline();
  tl.to(target, { ripple: 1, duration: 0.2, ease: "power1.out" });
  tl.to(target, { ripple: 0, duration: 0.8, ease: "power2.out" });
  return tl;
}
