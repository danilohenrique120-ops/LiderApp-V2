
export interface SkillValue {
  p: number;
  r: number;
}

export interface Operator {
  id: string;
  name: string;
  role: string;
  skills: Record<string, SkillValue>;
  uid: string;
  createdAt: any;
}

export interface SkillConfig {
  id: string;
  name: string;
  topic: string;
  uid: string;
  rolePrereqs?: Record<string, number>;
}

export interface Goal {
  id: string;
  text: string;
  deadline: string;
  completed: boolean;
}

export interface PDI {
  id: string;
  employee: string;
  careerObjective: string;
  goals: Goal[];
  generalComments: string;
  status: string;
  uid: string;
  createdAt: any;
}

export interface Meeting {
  id: string;
  employee: string;
  date: string;
  summary: string;
  uid: string;
  createdAt: any;
}

export interface Procedure {
  id: string;
  code: string;
  title: string;
  homologationDate: string;
  validityMonths: number;
  roles: string[];
  uid: string;
}

export interface TrainingRecord {
  status: 'Pendente' | 'Concluído' | 'Atrasado';
  empName: string;
  popCode: string;
  uid: string;
  date: string;
}

export interface ProductionEntry {
  id: string;
  date: string;
  shift: string;
  totalTime: number; // minutes
  downTime: number; // minutes
  targetQty: number;
  actualQty: number;
  defects: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  uid: string;
}
