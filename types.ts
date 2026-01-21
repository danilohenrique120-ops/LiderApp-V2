
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

export interface HumanErrorInvestigation {
  id: string;
  occurrence: {
    description: string;
    unit: string;
    area: string;
    station: string;
    failureLocation: string;
    date: string;
    time: string;
    employee: { name: string; area: string; function: string; };
    interviewee: { name: string; area: string; function: string; };
  };
  twttp: Record<string, 'possui conhecimento' | 'falta conhecimento'>;
  twttpAdvanced?: Record<string, 'sim' | 'não'>;
  herca?: {
    process: Record<string, 'sim' | 'não'>;
    procedure: Record<string, 'sim' | 'não'>;
    tools: Record<string, 'sim' | 'não'>;
    workplace: Record<string, 'sim' | 'não'>;
    attitude: Record<string, 'sim' | 'não'>;
    inattention: Record<string, 'sim' | 'não'>;
  };
  actionPlan: {
    action: string;
    responsible: string;
    deadline: string;
    rootCauses: string;
    countermeasure: string;
  };
  uid: string;
  createdAt: any;
}

export interface TodoFolder {
  id: string;
  name: string;
  color: string;
  uid: string;
  createdAt: any;
}

export interface TodoTask {
  id: string;
  folderId: string;
  text: string;
  deadline: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  completed: boolean;
  uid: string;
  createdAt: any;
}

export interface TodoNote {
  id: string;
  text: string;
  uid: string;
  createdAt: any;
}

export interface AppSettings {
  passwords: Record<string, string>;
}
