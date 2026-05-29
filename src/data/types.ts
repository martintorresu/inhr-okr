// Shared domain types used by all tenant datasets

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "okr_leader" | "initiative_leader" | "viewer";
  area: string;
  avatar?: string;
}

export interface KeyResult {
  id: string;
  title: string;
  type: "numeric" | "binary" | "scale" | "manual" | "percentage" | "ratio";
  current: number;
  target: number;
  unit?: string;
  progress: number;
  objectiveId: string;
  initiatives: Initiative[];
  initialValue?: number;
  direction?: "higher_is_better" | "lower_is_better";
  weight?: number;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  area: string;
  owner: string;
  level: "company" | "area" | "project";
  parentId?: string;
  progress: number;
  status: "draft" | "on_track" | "at_risk" | "behind" | "completed";
  contributors?: string[];
  keyResults: KeyResult[];
  quarter: string;
}

export interface Initiative {
  id: string;
  title: string;
  responsible: string;
  krId: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: "not_started" | "in_progress" | "blocked" | "completed";
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  responsible?: string;
}

export interface CheckIn {
  id: string;
  objectiveId: string;
  date: string;
  comment: string;
  progress: number;
  blockers?: string;
  author: string;
}

export interface Alert {
  id: string;
  type: "risk" | "overdue" | "blocked" | "checkin";
  message: string;
  objectiveId?: string;
  date: string;
  severity: "high" | "medium" | "low";
}
