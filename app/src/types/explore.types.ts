export interface User {
  id: string;
  fullName: string;
  role: string;
}

export interface VillageGap {
  name: string;
  block: string;
  population: number;
  gap: number;
  road: number;
  water: number;
  electricity: number;
  health: number;
  education: number;
}
