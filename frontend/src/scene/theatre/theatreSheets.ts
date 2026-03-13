const SHEET_NAMES = {
  intro: 'Intro Flyover',
  deployment: 'Deployment',
  battle: 'Battle',
  playerFire: 'Player Fire',
  enemyFire: 'Enemy Fire',
  victory: 'Victory',
  defeat: 'Defeat',
} as const

type SheetName = (typeof SHEET_NAMES)[keyof typeof SHEET_NAMES]

const SHEET_LENGTHS: Record<SheetName, number> = {
  [SHEET_NAMES.intro]: 3.5,
  [SHEET_NAMES.deployment]: 2.0,
  [SHEET_NAMES.battle]: 1.5,
  [SHEET_NAMES.playerFire]: 2.5,
  [SHEET_NAMES.enemyFire]: 2.0,
  [SHEET_NAMES.victory]: 8.0,
  [SHEET_NAMES.defeat]: 4.0,
}

export { SHEET_NAMES, SHEET_LENGTHS }
export type { SheetName }
