const VOICE_LINES = {
  playerHit: [
    'AH YES! DIRECT HIT!',
    'BOOM! GOT THEM!',
    'THAT\'S WHAT I\'M TALKING ABOUT!',
    'EXCELLENT SHOT!',
    'HA! THEY FELT THAT ONE!',
  ],
  playerMiss: [
    'DAMN! JUST MISSED!',
    'NEGATIVE IMPACT!',
    'ADJUST COORDINATES!',
    'MISSED! RECALIBRATE!',
  ],
  playerSunk: [
    'HAHAHA! SHIP DESTROYED!',
    'SHE\'S GOING DOWN!',
    'HAHA YES! I WILL WIN!',
    'ANOTHER ONE DOWN!',
    'OBLITERATED!',
  ],
  enemyHit: [
    'OH NO! WE\'RE HIT!',
    'DAMAGE REPORT!',
    'ARGH! THEY GOT US!',
    'BRACE FOR IMPACT!',
    'WE\'RE HIT! HOLD THE LINE!',
  ],
  enemyMiss: [
    'HA! THEY MISSED!',
    'NOT EVEN CLOSE!',
    'IS THAT ALL YOU\'VE GOT?',
    'PATHETIC SHOT!',
    'HAHAHA! CAN\'T TOUCH THIS!',
  ],
  enemySunk: [
    'NO! WE LOST A SHIP!',
    'SHIP DOWN!',
    'DAMN IT! THEY SUNK US!',
    'FIGHT ON!',
  ],
  firing: [
    'FIRE!',
    'LAUNCHING TORPEDO!',
    'LET THEM HAVE IT!',
    'FIRE AT WILL!',
    'SENDING IT!',
  ],
  victory: [
    'TOTAL VICTORY!',
    'WE ARE UNSTOPPABLE!',
    'NONE CAN DEFEAT US!',
  ],
  defeat: [
    'THIS CANNOT BE!',
    'WE\'LL BE BACK!',
    'RETREAT!',
  ],
  turnStart: [
    'YOUR MOVE, COMMANDER!',
    'CHOOSE YOUR TARGET!',
    'READY TO FIRE!',
  ],
  gameStart: [
    'BATTLE STATIONS!',
    'THE SEA IS OURS!',
    'PREPARE FOR WAR!',
  ],
} as const

type VoiceEvent = keyof typeof VOICE_LINES

type CalloutListener = (text: string, event: VoiceEvent) => void

const listeners: Set<CalloutListener> = new Set()

function subscribe(listener: CalloutListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function pickRandom(lines: readonly string[]): string {
  return lines[Math.floor(Math.random() * lines.length)]
}

let lastSpoke = 0

function speak(event: VoiceEvent) {
  const now = Date.now()
  if (now - lastSpoke < 600) return
  lastSpoke = now

  const line = pickRandom(VOICE_LINES[event])
  listeners.forEach((fn) => fn(line, event))
}

export { speak, subscribe, VOICE_LINES }
export type { VoiceEvent }
