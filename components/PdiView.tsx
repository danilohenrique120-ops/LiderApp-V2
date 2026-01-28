
import React, { useState } from 'react';
import { Target, Plus, Search } from 'lucide-react';
import { PDI, Goal } from '../types';
import PDIListCompact from './PDIListCompact';
import PortalDrawer from './PortalDrawer';
import PDIDetailView from './PDIDetailView';
import PDIFormModal from './PDIFormModal';

interface PdiViewProps {
    pdis: PDI[];
    employees: string[];
    user: any;
    db: any;
}

const PdiView: React.FC<PdiViewProps> = ({ pdis, employees, user, db }) => {
    const [showForm, setShowForm] = useState(false);
    const [selectedPdi, setSelectedPdi] = useState<PDI | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [formData, setFormData] = useState({ 
        employee: '', careerObjective: '', goals: [] as Goal[], generalComments: '', fixedResponsibilities: ''
    });
    const [newGoal, setNewGoal] = useState({ text: '', deadline: '' });

    const exportToPDF = (elementId: string, filename: string) => {
        const element = document.getElementById(elementId);
        const html2pdf = (window as any).html2pdf;
        if (!html2pdf) return;
        const opt = {
            margin: 5,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.goals.length === 0) { alert('Adicione ao menos uma meta.'); return; }
        
        const data = { ...formData, uid: user.uid, status: 'Em Curso' };
        if (editingId) {
            await db.collection('pdis').doc(editingId).update(data);
        } else {
            await db.collection('pdis').add({ ...data, createdAt: new Date() });
        }
        
        setFormData({ employee: '', careerObjective: '', goals: [], generalComments: '', fixedResponsibilities: '' });
        setEditingId(null);
        setShowForm(false);
    };

    const addGoal = () => {
        if (!newGoal.text || !newGoal.deadline) return;
        setFormData({ ...formData, goals: [...formData.goals, { ...newGoal, completed: false, id: Date.now().toString() }] });
        setNewGoal({ text: '', deadline: '' });
    };

    const toggleGoalStatus = async (pdiId: string, goalId: string) => {
        const pdi = pdis.find(p => p.id === pdiId);
        if (!pdi) return;
        const updatedGoals = pdi.goals.map(g => g.id === goalId ? { ...g, completed: !g.completed } : g);
        await db.collection('pdis').doc(pdiId).update({ goals: updatedGoals });
        
        if (selectedPdi && selectedPdi.id === pdiId) {
            setSelectedPdi({...selectedPdi, goals: updatedGoals});
        }
    };

    const handleEdit = (pdi: PDI) => {
        setFormData({
            employee: pdi.employee,
            careerObjective: pdi.careerObjective,
            goals: pdi.goals || [],
            generalComments: pdi.generalComments || '',
            fixedResponsibilities: pdi.fixedResponsibilities || ''
        });
        setEditingId(pdi.id);
        setShowForm(true);
        setSelectedPdi(null);
    };

    const filteredPdis = pdis.filter(p => 
        p.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.careerObjective.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-100 tracking-tighter uppercase leading-none">Gestão de PDIs</h2>
                    <p className="text-slate-400 font-medium text-sm mt-2 uppercase tracking-widest text-[10px]">Portal de Alto Desempenho e Carreira</p>
                </div>
                <button 
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ employee: '', careerObjective: '', goals: [], generalComments: '', fixedResponsibilities: '' }); }} 
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 transition-all hover:scale-105 flex items-center gap-2"
                >
                    <Plus size={18} /> Novo Plano
                </button>
            </header>

            <div className="mb-8 relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text"
                    placeholder="Filtrar colaboradores..."
                    className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <PDIListCompact 
                pdis={filteredPdis} 
                onSelect={(pdi) => setSelectedPdi(pdi)}
                selectedId={selectedPdi?.id || null}
            />

            {pdis.length === 0 && (
                <div className="text-center py-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[4rem] animate-fade">
                    <Target size={48} className="mx-auto text-slate-200 mb-6" />
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Nenhum PDI Ativo</h3>
                    <button onClick={() => setShowForm(true)} className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest">Começar Agora</button>
                </div>
            )}

            {/* --- DRAWER USANDO PORTAL --- */}
            <PortalDrawer 
                isOpen={!!selectedPdi} 
                onClose={() => setSelectedPdi(null)}
                title="Painel de Carreira"
            >
                {selectedPdi && (
                    <PDIDetailView 
                        pdi={selectedPdi}
                        onEdit={handleEdit}
                        onDelete={async (id) => { if(confirm('Excluir PDI?')){ await db.collection('pdis').doc(id).delete(); setSelectedPdi(null); } }}
                        onToggleGoal={toggleGoalStatus}
                        exportPdf={exportToPDF}
                    />
                )}
            </PortalDrawer>

            {/* --- MODAL USANDO PORTAL --- */}
            <PDIFormModal 
                isOpen={showForm}
                editingId={editingId}
                employees={employees}
                formData={formData}
                setFormData={setFormData}
                newGoal={newGoal}
                setNewGoal={setNewGoal}
                onAddGoal={addGoal}
                onSave={handleSave}
                onClose={() => setShowForm(false)}
            />
        </div>
    );
};

export default PdiView;
