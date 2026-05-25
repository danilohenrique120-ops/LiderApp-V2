
import React from 'react';
import { 
  Zap, 
  List, 
  ShieldCheck, 
  Clock, 
  Mic, 
  Sparkles, 
  ChevronRight,
  HardHat,
  ArrowUpCircle,
  FlaskConical,
  Settings,
  Brain,
  Flame,
  Activity,
  ZapOff,
  Trash2
} from 'lucide-react';

export type DDSTopic = 'epi' | 'altura' | 'quimicos' | 'maquinas' | 'ergonomia' | 'incendio' | 'socorros' | 'eletrica' | '5s' | 'custom';

export interface DDSConfig {
  source: 'database_errors' | 'topic';
  selectedTopic: DDSTopic;
  durationMinutes: number;
  tone: 'formal' | 'casual' | 'motivational';
}

interface DDSConfigFormProps {
  config: DDSConfig;
  setConfig: (config: DDSConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const TOPICS = [
  { id: 'epi', label: 'EPI & EPC', icon: HardHat, color: 'text-blue-500' },
  { id: 'altura', label: 'Trabalho em Altura', icon: ArrowUpCircle, color: 'text-indigo-500' },
  { id: 'quimicos', label: 'Produtos Químicos', icon: FlaskConical, color: 'text-emerald-500' },
  { id: 'maquinas', label: 'Segurança em Máquinas', icon: Settings, color: 'text-amber-500' },
  { id: 'ergonomia', label: 'Ergonomia', icon: Brain, color: 'text-purple-500' },
  { id: 'incendio', label: 'Prevenção Incêndio', icon: Flame, color: 'text-rose-500' },
  { id: 'socorros', label: 'Primeiros Socorros', icon: Activity, color: 'text-red-500' },
  { id: 'eletrica', label: 'Risco Elétrico', icon: ZapOff, color: 'text-yellow-500' },
  { id: '5s', label: 'Organização 5S', icon: Trash2, color: 'text-slate-500' },
];

const DDSConfigForm: React.FC<DDSConfigFormProps> = ({ config, setConfig, onGenerate, isGenerating }) => {
  const loadingMessages = [
    "Analisando desvios da semana...",
    "Consultando Normas Regulamentadoras...",
    "Estruturando gatilhos de engajamento...",
    "Otimizando tempo de fala...",
    "Aplicando psicologia comportamental..."
  ];
  
  const [msgIdx, setMsgIdx] = React.useState(0);

  React.useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setMsgIdx(prev => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl p-8 md:p-12 space-y-12 relative overflow-hidden">
      
      {/* 1. SELEÇÃO DE FONTE */}
      <section>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 ml-2">1. Fonte de Inteligência</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => setConfig({...config, source: 'database_errors'})}
            className={`p-6 rounded-[2rem] border-2 transition-all text-left flex items-start gap-4 ${
              config.source === 'database_errors' ? 'border-blue-600 bg-blue-50/50 shadow-lg' : 'border-slate-100 hover:border-blue-200'
            }`}
          >
            <div className={`p-3 rounded-2xl ${config.source === 'database_errors' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <Zap size={24} />
            </div>
            <div>
              <p className="font-black text-slate-800 text-sm uppercase tracking-tight">Análise de Desvios</p>
              <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">IA varre o banco de erros reais da sua unidade.</p>
            </div>
          </button>

          <button 
            onClick={() => setConfig({...config, source: 'topic'})}
            className={`p-6 rounded-[2rem] border-2 transition-all text-left flex items-start gap-4 ${
              config.source === 'topic' ? 'border-indigo-600 bg-indigo-50/50 shadow-lg' : 'border-slate-100 hover:border-indigo-200'
            }`}
          >
            <div className={`p-3 rounded-2xl ${config.source === 'topic' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <List size={24} />
            </div>
            <div>
              <p className="font-black text-slate-800 text-sm uppercase tracking-tight">Temas Sugeridos</p>
              <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">Escolha um tema específico da biblioteca técnica.</p>
            </div>
          </button>
        </div>
      </section>

      {/* 2. TEMAS (Apenas se source for topic) */}
      <section className={`transition-all duration-500 ${config.source === 'topic' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 ml-2">2. Selecionar Tema</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {TOPICS.map(topic => (
            <button 
              key={topic.id}
              onClick={() => setConfig({...config, selectedTopic: topic.id as DDSTopic})}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                config.selectedTopic === topic.id ? 'bg-white border-blue-500 shadow-md scale-105' : 'bg-slate-50 border-slate-100 hover:bg-white'
              }`}
            >
              <topic.icon size={20} className={`${config.selectedTopic === topic.id ? topic.color : 'text-slate-300'}`} />
              <span className={`text-[8px] font-black uppercase mt-2 text-center leading-tight ${config.selectedTopic === topic.id ? 'text-slate-800' : 'text-slate-400'}`}>
                {topic.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. REFINAMENTO */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">3. Duração</h3>
            <span className="text-xs font-black text-blue-600">{config.durationMinutes} Minutos</span>
          </div>
          <input 
            type="range" min="3" max="15" step="1"
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            value={config.durationMinutes}
            onChange={e => setConfig({...config, durationMinutes: parseInt(e.target.value)})}
          />
          <div className="flex justify-between mt-2 px-1 text-[8px] font-black text-slate-300 uppercase">
            <span>Rápido</span>
            <span>Detalhado</span>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">4. Tom de Voz</h3>
          <div className="flex p-1 bg-slate-100 rounded-2xl">
            {['formal', 'casual', 'motivational'].map(tone => (
              <button 
                key={tone}
                onClick={() => setConfig({...config, tone: tone as any})}
                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${
                  config.tone === tone ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'
                }`}
              >
                {tone === 'formal' ? 'Técnico' : tone === 'casual' ? 'Conversa' : 'Motivador'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. AÇÃO PRINCIPAL */}
      <div className="pt-6">
        <button 
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-4 transition-all shadow-2xl ${
            isGenerating ? 'bg-slate-900 text-white cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] shadow-blue-200'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-blue-400 border-t-white rounded-full animate-spin"></div>
              {loadingMessages[msgIdx]}
            </>
          ) : (
            <>
              <Sparkles size={20} /> Gerar Roteiro DDS
            </>
          )}
        </button>
      </div>
      
      {/* Decoração Visual */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>
    </div>
  );
};

export default DDSConfigForm;
