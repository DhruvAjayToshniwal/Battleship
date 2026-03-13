interface SequenceConfig {
  length: number;
  rate: number;
}

export const SEQUENCE_CONFIG: Record<string, SequenceConfig> = {
  intro: { length: 3, rate: 1 },
  battle: { length: 2, rate: 1 },
  victory: { length: 10, rate: 1 },
};

export function getSequenceLength(name: string): number {
  const config = SEQUENCE_CONFIG[name];
  if (!config) {
    return 0;
  }
  return config.length;
}
