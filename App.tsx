
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
  X
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
import { LogoIcon } from './constants';
import { Operator, SkillConfig, PDI, Meeting, Procedure, TrainingRecord, ProductionEntry } from './types';

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

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(usr => {
            setUser(usr);
            setLoading(false);
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user) return;
        
        const filter = ['uid', '==', user.uid] as [string, string, string];
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
            db.collection('production_log').where(...filter).orderBy('date', 'desc').onSnapshot(s => {
                setProductionData(s.docs.map(d => ({...d.data(), id: d.id}) as ProductionEntry));
            })
        ];
        return () => unsubs.forEach(u => u());
    }, [user]);

    const employeeNames = useMemo(() => matrixData.map(o => o.name).sort(), [matrixData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return <AuthView auth={auth} />;

    const menu = [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'operators', label: 'Colaboradores', icon: UserPlus },
        { id: 'matrix', label: 'Habilidades', icon: Grid },
        { id: 'training', label: 'Treinamento', icon: GraduationCap },
        { id: 'pdi', label: 'PDI', icon: Target },
        { id: 'oneone', label: '1:1 Feedback', icon: MessageSquare },
    ];

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
                    <nav className="space-y-2 flex-1">
                        {menu.map(item => (
                            <button 
                                key={item.id} 
                                onClick={() => setActiveTab(item.id)} 
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800'}`}
                            >
                                <item.icon size={20} />
                                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
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
                </div>
            </main>

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
                                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} 
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                                >
                                    <item.icon size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
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
        </div>
    );
};

export default App;
