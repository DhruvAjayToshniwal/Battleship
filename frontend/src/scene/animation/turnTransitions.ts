import gsap from "gsap";

export function createPlayerTurnTransition(): gsap.core.Timeline {
  const target = { opacity: 1, scale: 1 };
  const tl = gsap.timeline();
  tl.to(target, { opacity: 0, scale: 0.95, duration: 0.25, ease: "power2.out" });
  tl.to(target, { opacity: 0, duration: 0.15 });
  tl.to(target, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.in" });
  return tl;
}

export function createEnemyTurnTransition(): gsap.core.Timeline {
  const target = { opacity: 1, scale: 1 };
  const tl = gsap.timeline();
  tl.to(target, { opacity: 0, scale: 0.9, duration: 0.35, ease: "power2.out" });
  tl.to(target, { opacity: 0, duration: 0.2 });
  tl.to(target, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.in" });
  return tl;
}
