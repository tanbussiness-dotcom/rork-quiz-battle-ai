export type MissionType = "daily" | "weekly";
export type MissionCategory = "solo" | "battle" | "general";

export interface Mission {
  id: string;
  type: MissionType;
  category: MissionCategory;
  title: string;
  description: string;
  requirement: number;
  reward: MissionReward;
  expiresAt: number;
  createdAt: number;
}

export interface MissionReward {
  coins: number;
  xp: number;
  badges?: string[];
}

export interface UserMission {
  userId: string;
  missionId: string;
  progress: number;
  completed: boolean;
  claimedAt?: number;
  startedAt: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  requirement: string;
  category: string;
}
