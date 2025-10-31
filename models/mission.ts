export type MissionType = "daily" | "weekly";
export type MissionCategory = "solo" | "battle" | "general";

export interface Mission {
  missionId: string;
  mode: MissionCategory;
  type: MissionType;
  title: Record<string, string>;
  description: Record<string, string>;
  requirement: number;
  reward: MissionReward;
  expiresAt: number;
  createdAt: number;
  isActive: boolean;
}

export interface MissionReward {
  coins: number;
  xp: number;
  badges?: string[];
}

export interface UserMission {
  id: string;
  userId: string;
  missionId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  claimedAt?: number;
  startedAt: number;
  updatedAt: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  requirement: string;
  category: string;
}
