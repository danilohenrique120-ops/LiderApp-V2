
import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  X,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';


import AuthView from './components/AuthView';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import CollaboratorsPage from './components/CollaboratorsPage';
import SkillMatrixView from './components/SkillMatrixView';
import TrainingMatrixView from './components/TrainingMatrixView';
import PdiView from './components/PdiView';
import OneOnOneView from './components/OneOnOneView';
import HumanErrorView from './components/HumanErrorView';
import TodoView from './components/TodoView';
import DdsView from './components/DdsView';
import RoleplayView from './components/RoleplayView';
import CauseAnalysisView from './components/CauseAnalysisView';
import ComplianceView from './components/ComplianceView';
import Sidebar from './components/Sidebar';
import NativeTour from './components/NativeTour';
import StrategicConsultant from './components/StrategicConsultant';
import ProjectsView from './components/ProjectsView';
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
  TodoNote,
  AppSettings,
  KnowledgeDoc,
  User
} from './types';

// Firebase Config
import firebase, { auth, db } from './services/firebase';

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [view, setView] = useState<'landing' | 'auth'>('landing');

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
  const [todoNotes, setTodoNotes] = useState<TodoNote[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);

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

  // Fetch User Profile (Plan)
  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }
    const unsubscribeProfile = db.collection('users').doc(user.uid).onSnapshot(doc => {
      if (doc.exists) {
        setUserData(doc.data() as User);
      } else {
        // Fallback for existing users without profile doc
        setUserData({ uid: user.uid, email: user.email || '', plan: 'free', createdAt: new Date() });
      }
    });
    return () => unsubscribeProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const filter: [string, firebase.firestore.WhereFilterOp, string] = ['uid', '==', user.uid];
    const unsubs = [
      db.collection('operators').where(...filter).onSnapshot(s => setMatrixData(s.docs.map(d => ({ ...d.data(), id: d.id }) as Operator))),
      db.collection('skills_config').where(...filter).onSnapshot(s => setSkills(s.docs.map(d => ({ ...d.data(), id: d.id }) as SkillConfig))),
      db.collection('pdis').where(...filter).onSnapshot(s => setPdis(s.docs.map(d => ({ ...d.data(), id: d.id }) as PDI))),
      db.collection('meetings').where(...filter).onSnapshot(s => setMeetings(s.docs.map(d => ({ ...d.data(), id: d.id }) as Meeting))),
      db.collection('procedures').where(...filter).onSnapshot(s => setProcedures(s.docs.map(d => ({ ...d.data(), id: d.id }) as Procedure))),
      db.collection('training_records').where(...filter).onSnapshot(s => {
        const recs: Record<string, TrainingRecord> = {};
        s.docs.forEach(d => { recs[d.id] = d.data() as TrainingRecord });
        setTrainingRecords(recs);
      }),
      db.collection('production_log').where(...filter).onSnapshot(s => {
        const data = s.docs.map(d => ({ ...d.data(), id: d.id }) as ProductionEntry);
        setProductionData(data.sort((a, b) => b.date.localeCompare(a.date)));
      }),
      db.collection('human_error_investigations').where(...filter).onSnapshot(s => {
        const data = s.docs.map(d => ({ ...d.data(), id: d.id }) as HumanErrorInvestigation);
        setHumanErrorInvestigations(data.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        }));
      }),
      db.collection('todo_folders').where(...filter).onSnapshot(s => setTodoFolders(s.docs.map(d => ({ ...d.data(), id: d.id }) as TodoFolder))),
      db.collection('todo_tasks').where(...filter).onSnapshot(s => setTodoTasks(s.docs.map(d => ({ ...d.data(), id: d.id }) as TodoTask))),
      db.collection('todo_notes').where(...filter).onSnapshot(s => {
        const notes = s.docs.map(d => ({ ...d.data(), id: d.id }) as TodoNote);
        const sorted = notes.sort((a, b) => {
          const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
          const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
          return timeB - timeA;
        });
        setTodoNotes(sorted);
      }),
      db.collection('knowledge_docs').where(...filter).onSnapshot(s => setKnowledgeDocs(s.docs.map(d => ({ ...d.data(), id: d.id }) as KnowledgeDoc))),
      db.collection('app_settings').doc(user.uid).onSnapshot(doc => {
        if (doc.exists) {
          setAppSettings(doc.data() as AppSettings);
        }
      })
    ];
    return () => unsubs.forEach(u => u());
  }, [user]);

  const employeeNames = useMemo(() => matrixData.map(o => o.name).sort(), [matrixData]);

  const handleTabClick = (itemOrId: string | any) => {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const pass = inputPassword.trim();
    if (!targetTab || !user || !pass || isProcessingPassword) return;

    setIsProcessingPassword(true);

    try {
      const docRef = db.collection('app_settings').doc(user.uid);
      const docSnap = await docRef.get();
      const currentData = docSnap.exists ? docSnap.data() : { passwords: {} };
      const passwords = currentData?.passwords || {};

      const existingPassword = passwords[targetTab.id];

      if (!existingPassword) {
        const updatedPasswords = { ...passwords, [targetTab.id]: pass };

        await docRef.set({
          passwords: updatedPasswords,
          uid: user.uid,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        setUnlockedTabs(prev => new Set(prev).add(targetTab.id));
        setActiveTab(targetTab.id);
        setShowPasswordModal(false);
        setIsMobileMenuOpen(false);
        setInputPassword('');
      }
      else {
        if (pass === existingPassword) {
          setUnlockedTabs(prev => new Set(prev).add(targetTab.id));
          setActiveTab(targetTab.id);
          setShowPasswordModal(false);
          setIsMobileMenuOpen(false);
          setInputPassword('');
        } else {
          setPasswordError(true);
          setTimeout(() => setPasswordError(false), 500);
        }
      }
    } catch (err: any) {
      console.error("Firebase Auth/Gate Error:", err);
      alert("Falha de comunicação com o servidor.");
    } finally {
      setIsProcessingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    if (view === 'landing') return <LandingPage onEnter={() => setView('auth')} />;
    return <AuthView auth={auth} onBack={() => setView('landing')} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0F172A]">
      {/* Native Onboarding Tour (Pure React) */}
      <NativeTour
        devMode={true}
        onFinish={(tab) => setActiveTab(tab)}
      />

      {/* Sidebar Desktop */}
      <aside className="hidden md:block w-80 sticky top-0 h-screen z-50">
        <Sidebar
          activeTab={activeTab}
          onNavigate={handleTabClick}
          onLogout={() => auth.signOut()}
        />
      </aside>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto min-h-screen custom-scrollbar">
        <header className="sticky top-0 z-40 px-6 md:px-10 py-6 bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-800 flex justify-end items-center">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-400">
            <Menu size={24} />
          </button>
        </header>

        <div className="p-6 md:p-12 w-full pb-32">
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
              onNavigate={handleTabClick}
              user={userData}
            />
          )}
          {activeTab === 'projects' && (
            <ProjectsView userPlan={userData?.plan} />
          )}
          {activeTab === 'compliance' && (
            <ComplianceView
              user={user}
              db={db}
              documents={knowledgeDocs}
            />
          )}
          {activeTab === 'dds' && (
            <DdsView
              investigations={humanErrorInvestigations}
            />
          )}
          {activeTab === 'cause-analysis' && (
            <CauseAnalysisView
              investigations={humanErrorInvestigations}
            />
          )}
          {activeTab === 'roleplay' && (
            <RoleplayView />
          )}
          {activeTab === 'todo' && (
            <TodoView
              folders={todoFolders}
              tasks={todoTasks}
              notes={todoNotes}
              user={user}
              db={db}
            />
          )}
          {activeTab === 'operators' && (
            <CollaboratorsPage />
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

      {/* Strategic Consultant FAB Overlay */}
      <StrategicConsultant
        matrixData={matrixData}
        pdis={pdis}
        productionData={productionData}
        investigations={humanErrorInvestigations}
      />

      {/* Password Gate Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade">
          <div className={`bg-white w-full max-sm rounded-[2.5rem] shadow-2xl p-10 transition-transform ${passwordError ? 'animate-shake' : ''}`}>
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
                    'Confirmar'
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
          <aside className="w-80 bg-slate-900 h-full animate-fade shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 text-white p-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
            <Sidebar
              activeTab={activeTab}
              onNavigate={handleTabClick}
              onLogout={() => auth.signOut()}
              isMobile={true}
            />
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
