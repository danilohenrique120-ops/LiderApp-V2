
import React, { useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { LogoIcon } from '../constants';
import { db } from '../services/firebase';

interface AuthViewProps {
    auth: any;
    onBack: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ auth, onBack }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await auth.signInWithEmailAndPassword(email, password);
            } else {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                if (userCredential.user) {
                    await db.collection('users').doc(userCredential.user.uid).set({
                        uid: userCredential.user.uid,
                        email: email,
                        plan: 'free',
                        createdAt: new Date()
                    });
                }
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full"></div>

            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 animate-fade relative z-10">
                <button
                    onClick={onBack}
                    className="absolute top-8 left-8 p-2 text-slate-300 hover:text-slate-800 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                    <ArrowLeft size={16} /> Voltar
                </button>

                <div className="flex flex-col items-center mb-8 mt-4">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2rem] p-3 mb-6 shadow-inner">
                        <LogoIcon />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                        {isLogin ? 'Entrar no Sistema' : 'Criar Nova Conta'}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Cockpit Operacional Sistema Líder</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold mb-6 flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            placeholder="exemplo@lider.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all mt-4">
                        {isLogin ? 'Fazer Login' : 'Finalizar Cadastro'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-[0.2em] transition-colors">
                        {isLogin ? 'Não tem conta? Cadastre-se' : 'Já possui conta? Faça Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthView;
