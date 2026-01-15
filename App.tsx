
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  Grid, 
  GraduationCap, 
  Target, 
  MessageSquare, 
  Activity, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  ShieldAlert,
  ListTodo,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
// @ts-ignore
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import AuthView from './components/AuthView';
import Dashboard from './components/Dashboard';
import OperatorRegistrationView from './components/OperatorRegistrationView';
import SkillMatrixView from './components/SkillMatrixView';
import TrainingMatrixView from './components/TrainingMatrixView';
import PdiView from './components/PdiView';
import OneOnOneView from './components/OneOnOneView';
import HumanErrorView from './components/HumanErrorView';
import TodoView from './components/TodoView';
import { LogoIcon } from './constants';
import { 
  Operator, 
  SkillConfig, 
  PDI, 
  Meeting, 
  Procedure, 
  TrainingRecord, 
  ProductionEntry, 
  HumanErrorInvestigation,
  TodoFolder,
  TodoTask,
  AppSettings
} from './types';

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyC8vZ1jZrE9wpo_YM3rk2BhMiRSfYsqss8",
    authDomain: "projeto-sistema-lider.firebaseapp.com",
    projectId: "projeto-sistema-lider",
    storageBucket: "projeto-sistema-lider.firebasestorage.app",
    messagingSenderId: "831955890134",
    appId: "1:831955890134:web:b399188528357f7540be77",
    measurementId: "G-0QEGX479FK"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

const App: React.FC = () => {
    const [user, setUser] = useState<firebase.User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const [matrixData, setMatrixData] = useState<Operator[]>([]);
    const [skills, setSkills] = useState<SkillConfig[]>([]);
    const [pdis, setPdis] = useState<PDI[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [trainingRecords, setTrainingRecords] = useState<Record<string, TrainingRecord>>({});
    const [productionData, setProductionData] = useState<ProductionEntry[]>([]);
    const [humanErrorInvestigations, setHumanErrorInvestigations] = useState<HumanErrorInvestigation[]>([]);
    const [todoFolders, setTodoFolders] = useState<TodoFolder[]>([]);
    const [todoTasks, setTodoTasks] = useState<TodoTask[]>([]);
    
    // Senhas e Proteção
    const [unlockedTabs, setUnlockedTabs] = useState<Set<string>>(new Set());
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [targetTab, setTargetTab] = useState<any>(null);
    const [inputPassword, setInputPassword] = useState('');
    const [appSettings, setAppSettings] = useState<AppSettings>({ passwords: {} });
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [isProcessingPassword, setIsProcessingPassword] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(usr => {
            setUser(usr);
            setLoading(false);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user) return;
        
        const filter: [string, firebase.firestore.WhereFilterOp, string] = ['uid', '==', user.uid];
        const unsubs = [
            db.collection('operators').where(...filter).onSnapshot(s => setMatrixData(s.docs.map(d => ({...d.data(), id: d.id}) as Operator))),
            db.collection('skills_config').where(...filter).onSnapshot(s => setSkills(s.docs.map(d => ({...d.data(), id: d.id}) as SkillConfig))),
            db.collection('pdis').where(...filter).onSnapshot(s => setPdis(s.docs.map(d => ({...d.data(), id: d.id}) as PDI))),
            db.collection('meetings').where(...filter).onSnapshot(s => setMeetings(s.docs.map(d => ({...d.data(), id: d.id}) as Meeting))),
            db.collection('procedures').where(...filter).onSnapshot(s => setProcedures(s.docs.map(d => ({...d.data(), id: d.id}) as Procedure))),
            db.collection('training_records').where(...filter).onSnapshot(s => {
                const recs: Record<string, TrainingRecord> = {};
                s.docs.forEach(d => { recs[d.id] = d.data() as TrainingRecord });
                setTrainingRecords(recs);
            }),
            db.collection('production_log').where(...filter).onSnapshot(s => {
                const data = s.docs.map(d => ({...d.data(), id: d.id}) as ProductionEntry);
                setProductionData(data.sort((a, b) => b.date.localeCompare(a.date)));
            }),
            db.collection('human_error_investigations').where(...filter).onSnapshot(s => {
                const data = s.docs.map(d => ({...d.data(), id: d.id}) as HumanErrorInvestigation);
                setHumanErrorInvestigations(data.sort((a, b) => {
                    const dateA = a.createdAt?.seconds || 0;
                    const dateB = b.createdAt?.seconds || 0;
                    return dateB - dateA;
                }));
            }),
            db.collection('todo_folders').where(...filter).onSnapshot(s => setTodoFolders(s.docs.map(d => ({...d.data(), id: d.id}) as TodoFolder))),
            db.collection('todo_tasks').where(...filter).onSnapshot(s => setTodoTasks(s.docs.map(d => ({...d.data(), id: d.id}) as TodoTask))),
            db.collection('app_settings').doc(user.uid).onSnapshot(doc => {
              if (doc.exists) {
                setAppSettings(doc.data() as AppSettings);
              }
            })
        ];
        return () => unsubs.forEach(u => u());
    }, [user]);

    const employeeNames = useMemo(() => matrixData.map(o => o.name).sort(), [matrixData]);

    const menu = [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard, protected: false },
        { id: 'todo', label: 'To Do', icon: ListTodo, protected: true },
        { id: 'operators', label: 'Colaboradores', icon: UserPlus, protected: false },
        { id: 'matrix', label: 'Habilidades', icon: Grid, protected: true },
        { id: 'training', label: 'Treinamento', icon: GraduationCap, protected: false },
        { id: 'pdi', label: 'PDI', icon: Target, protected: true },
        { id: 'oneone', label: '1:1 Feedback', icon: MessageSquare, protected: true },
        { id: 'human-error', label: 'Erro Humano', icon: ShieldAlert, protected: false },
    ];

    const handleTabClick = (item: any) => {
      if (item.protected && !unlockedTabs.has(item.id)) {
        setTargetTab(item);
        setShowPasswordModal(true);
        setInputPassword('');
        setPasswordError(false);
      } else {
        setActiveTab(item.id);
        setIsMobileMenuOpen(false);
      }
    };

    const handleUnlock = async (e: React.FormEvent) => {
      e.preventDefault();
      const pass = inputPassword.trim();
      if (!targetTab || !user || !pass || isProcessingPassword) return;

      setIsProcessingPassword(true);
      
      try {
        // Busca direta no Firestore para evitar delay de sincronização do estado local
        const docRef = db.collection('app_settings').doc(user.uid);
        const docSnap = await docRef.get();
        const currentData = docSnap.exists ? docSnap.data() : { passwords: {} };
        const passwords = currentData?.passwords || {};
        
        const existingPassword = passwords[targetTab.id];

        // Fluxo: DEFINIR SENHA (Primeiro Acesso)
        if (!existingPassword) {
          const updatedPasswords = { ...passwords, [targetTab.id]: pass };
          
          // Gravação no Firestore com campos de auditoria/segurança
          await docRef.set({
            passwords: updatedPasswords,
            uid: user.uid, // Necessário para muitas regras de segurança do Firebase
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          // Sucesso na gravação -> Navega imediatamente
          setUnlockedTabs(prev => new Set(prev).add(targetTab.id));
          setActiveTab(targetTab.id);
          setShowPasswordModal(false);
          setIsMobileMenuOpen(false);
          setInputPassword('');
        } 
        // Fluxo: VALIDAR SENHA EXISTENTE
        else {
          if (pass === existingPassword) {
            setUnlockedTabs(prev => new Set(prev).add(targetTab.id));
            setActiveTab(targetTab.id);
            setShowPasswordModal(false);
            setIsMobileMenuOpen(false);
            setInputPassword('');
          } else {
            // Senha incorreta
            setPasswordError(true);
            setTimeout(() => setPasswordError(false), 500);
          }
        }
      } catch (err: any) {
        console.error("Firebase Auth/Gate Error:", err);
        
        // Mensagem de erro amigável com diagnóstico técnico
        let errorMsg = "Falha de comunicação com o servidor.";
        if (err.code === 'permission-denied') {
          errorMsg = "Acesso Negado: Verifique se o Firestore está habilitado e com regras de escrita ativas no Console do Firebase.";
        } else if (err.message) {
          errorMsg = `Erro: ${err.message}`;
        }
        
        alert(errorMsg);
      } finally {
        setIsProcessingPassword(false);
      }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return <AuthView auth={auth} />;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex w-72 bg-slate-900 flex-col sticky top-0 h-screen z-50">
                <div className="p-10 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-16">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl p-1">
                            <LogoIcon />
                        </div>
                        <h1 className="text-white text-xs font-black uppercase tracking-widest leading-none">
                            Líder App<br/>
                            <span className="text-[8px] text-blue-500 opacity-60 italic tracking-tighter">Método Sistema Líder</span>
                        </h1>
                    </div>
                    <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                        {menu.map(item => (
                            <button 
                                key={item.id} 
                                onClick={() => handleTabClick(item)} 
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800'}`}
                            >
                                <item.icon size={20} />
                                <span className="text-[11px] font-black uppercase tracking-widest flex-1">{item.label}</span>
                                {item.protected && !unlockedTabs.has(item.id) && <Lock size={12} className="text-slate-600" />}
                                {item.protected && unlockedTabs.has(item.id) && <ShieldCheck size={12} className="text-blue-300" />}
                            </button>
                        ))}
                    </nav>
                    <button 
                        onClick={() => auth.signOut()} 
                        className="mt-auto flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400 hover:bg-red-950/20 transition-all font-black text-[11px] uppercase tracking-widest"
                    >
                        <LogOut size={20} /> Sair
                    </button>
                </div>
            </aside>

            {/* Content area */}
            <main className="flex-1 overflow-y-auto min-h-screen">
                <header className="sticky top-0 z-40 px-6 md:px-10 py-6 bg-white/80 backdrop-blur-xl border-b flex justify-end items-center shadow-sm">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600">
                        <Menu size={24} />
                    </button>
                </header>
                
                <div className="p-6 md:p-12 max-w-7xl mx-auto pb-32">
                    {activeTab === 'dashboard' && (
                        <Dashboard 
                            matrixData={matrixData} 
                            pdis={pdis} 
                            meetings={meetings} 
                            skills={skills} 
                            procedures={procedures} 
                            trainingRecords={trainingRecords} 
                            productionData={productionData}
                            investigations={humanErrorInvestigations}
                        />
                    )}
                    {activeTab === 'todo' && (
                        <TodoView 
                            folders={todoFolders}
                            tasks={todoTasks}
                            user={user}
                            db={db}
                        />
                    )}
                    {activeTab === 'operators' && (
                        <OperatorRegistrationView 
                            matrixData={matrixData} 
                            skills={skills} 
                            user={user} 
                            db={db} 
                        />
                    )}
                    {activeTab === 'matrix' && (
                        <SkillMatrixView 
                            data={matrixData} 
                            skills={skills} 
                            user={user} 
                            db={db} 
                        />
                    )}
                    {activeTab === 'training' && (
                        <TrainingMatrixView 
                            matrixData={matrixData} 
                            procedures={procedures} 
                            trainingRecords={trainingRecords} 
                            user={user} 
                            db={db} 
                        />
                    )}
                    {activeTab === 'pdi' && (
                        <PdiView 
                            pdis={pdis} 
                            employees={employeeNames} 
                            user={user} 
                            db={db} 
                        />
                    )}
                    {activeTab === 'oneone' && (
                        <OneOnOneView 
                            meetings={meetings} 
                            employees={employeeNames} 
                            user={user} 
                            db={db} 
                        />
                    )}
                    {activeTab === 'human-error' && (
                        <HumanErrorView 
                            investigations={humanErrorInvestigations}
                            user={user}
                            db={db}
                        />
                    )}
                </div>
            </main>

            {/* Password Gate Modal */}
            {showPasswordModal && (
              <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade">
                <div className={`bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-10 transition-transform ${passwordError ? 'animate-shake' : ''}`}>
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                      {targetTab?.id && appSettings.passwords?.[targetTab.id] ? <Lock size={32} /> : <ShieldCheck size={32} />}
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                      {targetTab?.id && appSettings.passwords?.[targetTab.id] ? 'Acesso Restrito' : 'Definir Senha'}
                    </h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
                      Menu: {targetTab?.label}
                    </p>
                    {targetTab?.id && !appSettings.passwords?.[targetTab.id] && (
                      <p className="text-blue-600 text-[10px] font-black uppercase mt-4 bg-blue-50 px-4 py-2 rounded-full">
                        Primeiro acesso: Crie uma senha
                      </p>
                    )}
                  </div>

                  <form onSubmit={handleUnlock} className="space-y-6">
                    <div className="relative">
                      <input 
                        autoFocus
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="Digite a senha..."
                        required
                        className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all ${passwordError ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-100'}`}
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        disabled={isProcessingPassword}
                      />
                      <button 
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                      >
                        {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        type="submit" 
                        disabled={isProcessingPassword || !inputPassword.trim()}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessingPassword ? (
                          <>
                            <Loader2 size={18} className="animate-spin" /> Processando...
                          </>
                        ) : (
                          targetTab?.id && appSettings.passwords?.[targetTab.id] ? 'Desbloquear' : 'Salvar e Acessar'
                        )}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowPasswordModal(false);
                          setInputPassword('');
                        }}
                        disabled={isProcessingPassword}
                        className="w-full py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <aside className="w-64 bg-slate-900 h-full p-6 animate-fade shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-10">
                            <div className="w-8 h-8 bg-white rounded-lg p-1"><LogoIcon /></div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-white"><X size={20}/></button>
                        </div>
                        <nav className="space-y-4">
                            {menu.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => handleTabClick(item)} 
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                                >
                                    <item.icon size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest flex-1">{item.label}</span>
                                    {item.protected && !unlockedTabs.has(item.id) && <Lock size={12} className="text-slate-600" />}
                                </button>
                            ))}
                        </nav>
                        <button 
                            onClick={() => auth.signOut()} 
                            className="mt-10 flex items-center gap-4 px-4 py-3 text-red-400 font-black text-[10px] uppercase tracking-widest"
                        >
                            <LogOut size={18} /> Sair
                        </button>
                    </aside>
                </div>
            )}

            <style>{`
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-8px); }
                75% { transform: translateX(8px); }
              }
              .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
            `}</style>
        </div>
    );
};

export default App;
