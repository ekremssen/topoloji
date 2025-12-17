export type Role = "DIRECTOR" | "HYBRID_LEAD" | "PM" | "ANALYST";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  team_id: string | null;
};

export type Team = { id: string; name: string; };

export type Task = {
  id: string;
  title: string;
  description: string | null;
  team_id: string | null;
  assignee_id: string | null;
  owner_id: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  progress: number;
  sla_days: number;
  blocked_reason: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};
