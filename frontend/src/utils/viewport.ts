interface ViewportInfo {
  width: number
  height: number
  aspect: number
  dpr: number
  isPortrait: boolean
  isNarrow: boolean
  isMobile: boolean
}

function getViewportInfo(): ViewportInfo {
  const width = window.innerWidth
  const height = window.innerHeight
  const aspect = width / height
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  return {
    width,
    height,
    aspect,
    dpr,
    isPortrait: aspect < 1,
    isNarrow: aspect < 1.2,
    isMobile: width < 768,
  }
}

function clampDPR(dpr: number, max: number = 2): number {
  return Math.min(dpr, max)
}

function getCanvasSize(container: HTMLElement): { width: number; height: number } {
  const rect = container.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
}

export { getViewportInfo, clampDPR, getCanvasSize }
export type { ViewportInfo }
