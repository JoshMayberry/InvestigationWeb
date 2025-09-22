export interface Bonus {
  id: string;
  label: string;
  description?: string;
  category?: string;
  icon?: string;
}

export interface BonusUnlock {
  id: string;
  unlockedAt: string; // ISO timestamp
}

export interface BonusComputed extends Bonus {
  unlocked: boolean;
  unlockedAt?: string;
}