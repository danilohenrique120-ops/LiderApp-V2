
export interface KnowledgeDoc {
  id: string;
  name: string;
  type: string;
  content?: string; // Conteúdo extraído ou base64
  size: string;
  uploadedAt: any;
  uid: string;
}

export interface SkillValue {
  p: number;
  r: number;
}

export interface Operator {
  id: string;
  name: string;
  role: string;
  email: string;
  shift: string;
  schedule: string;
  status: 'ativo' | 'ferias' | 'desligado';
  // Fix: Adding departamento property to Operator interface to match Firestore data and fix TS errors
  departamento?: string;
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
  fixedResponsibilities?: string;
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
  comments?: string;
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

export interface DdsResponse {
  titulo_dds: string;
  gatilho_inicial: string;
  historia_curta: string;
  conexao_realidade: string;
  acao_pratica: string;
  frase_encerramento: string;
}

export interface RoleplayResponse {
  pensamento_interno: string;
  fala_visivel: string;
  estado_emocional: string;
  sinal_corporal: string;
}

export interface RoleplayReport {
  pontos_fortes: string[];
  pontos_melhoria: string[];
  nota_comunicacao: number;
  insight_mentor: string;
}

export interface CauseAnalysisReport {
  resumo_incidente: string;
  causa_raiz: string;
  categoria_causa: string;
  alerta_recorrencia: {
    detectado: boolean;
    mensagem: string | null;
  };
  plano_acao_sugerido: string[];
  status_investigacao: "CONCLUIDA";
}
