import gsap from "gsap";

export function createMissileTimeline(target: {
  y: number;
  opacity: number;
  scale: number;
}): gsap.core.Timeline {
  const tl = gsap.timeline();
  tl.to(target, { y: 0, duration: 0.6, ease: "power2.in" }, 0);
  tl.to(target, { scale: 0.5, duration: 0.6, ease: "power2.in" }, 0);
  target.y = 12;
  return tl;
}

export function createImpactTimeline(target: {
  intensity: number;
  shake: number;
}): gsap.core.Timeline {
  const tl = gsap.timeline();
  tl.to(target, { intensity: 1, duration: 0.05, ease: "none" });
  tl.to(target, { intensity: 0, duration: 0.3, ease: "power2.out" });
  return tl;
}

export function createTurnTransitionTimeline(target: {
  opacity: number;
}): gsap.core.Timeline {
  const tl = gsap.timeline();
  tl.to(target, { opacity: 0, duration: 0.3, ease: "power2.out" });
  tl.to(target, { opacity: 0, duration: 0.2 });
  tl.to(target, { opacity: 1, duration: 0.3, ease: "power2.in" });
  return tl;
}
