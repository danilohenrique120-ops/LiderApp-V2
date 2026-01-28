
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Download, ArrowLeft, Target, Info, CheckCircle2, Quote, Zap, BookOpen, ShieldCheck
} from 'lucide-react';
import { AiService } from '../services/AiService';
import { HumanErrorInvestigation, DdsResponse } from '../types';
import DDSConfigForm, { DDSConfig } from './DDSConfigForm';
import LastDDSPreview from './LastDDSPreview';

interface DdsViewProps {
    investigations: HumanErrorInvestigation[];
}

const DdsView: React.FC<DdsViewProps> = ({ investigations }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [ddsData, setDdsData] = useState<DdsResponse | null>(null);
    const [lastDds, setLastDds] = useState<{title: string, createdAt: Date, topic: string} | null>(null);
    
    const [config, setConfig] = useState<DDSConfig>({
      source: 'database_errors',
      selectedTopic: 'epi',
      durationMinutes: 5,
      tone: 'casual'
    });

    const aiService = AiService.getInstance();

    useEffect(() => {
      const saved = localStorage.getItem('last_dds_metadata');
      if (saved) {
        const parsed = JSON.parse(saved);
        setLastDds({ ...parsed, createdAt: new Date(parsed.createdAt) });
      }
    }, []);

    const handleGenerateDds = async () => {
        setIsGenerating(true);
        try {
            let contextPrompt = "";
            if (config.source === 'database_errors' && investigations?.length > 0) {
                const recentErrors = investigations.slice(0, 5).map(inv => inv.occurrence.description).join('; ');
                contextPrompt = `Baseie este DDS nos seguintes desvios reais da fábrica: ${recentErrors}.`;
            } else {
                contextPrompt = `O tema central é: ${config.selectedTopic}.`;
            }

            const prompt = `Gere roteiro DDS. Contexto: ${contextPrompt}. Use [[PLACEHOLDERS]] para dados variáveis.`;
            
            const result = await aiService.generateDds(prompt, { 
                duration: config.durationMinutes, 
                tone: config.tone 
            });

            setDdsData(result);
            
            const metadata = { 
                title: result.titulo_dds, 
                createdAt: new Date(), 
                topic: config.source === 'database_errors' ? 'Análise de Desvios' : config.selectedTopic 
            };
            setLastDds(metadata);
            localStorage.setItem('last_dds_metadata', JSON.stringify(metadata));
            localStorage.setItem('last_dds_full', JSON.stringify(result));

        } catch (error) {
            alert("Erro ao conectar com o especialista de IA.");
        } finally {
            setIsGenerating(false);
        }
    };

    const exportToPDF = () => {
        const element = document.getElementById('dds-printable-content');
        const html2pdf = (window as any).html2pdf;
        if (!html2pdf || !ddsData) return;
        html2pdf().set({
            margin: 10,
            filename: `DDS-${ddsData.titulo_dds.replace(/\s+/g, '-')}.pdf`,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save();
    };

    const renderContent = (text: string) => {
      return text.split(/(\[\[.*?\]\])/g).map((part, i) => (
        part.startsWith('[[') ? <span key={i} className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md border border-amber-200 font-black">{part}</span> : part
      ));
    };

    return (
        <div className="animate-fade max-w-7xl mx-auto pb-32">
            {!ddsData ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 space-y-6">
                  <header className="mb-8">
                    <h2 className="text-4xl font-black text-slate-100 tracking-tighter uppercase leading-none">DDS Intelligence</h2>
                    <p className="text-slate-400 font-medium text-[10px] mt-3 uppercase tracking-widest">Portal de Diálogos Comportamentais</p>
                  </header>
                  <LastDDSPreview lastDds={lastDds} onViewDetails={() => {
                      const saved = localStorage.getItem('last_dds_full');
                      if (saved) setDdsData(JSON.parse(saved));
                  }} />
                </div>
                <div className="lg:col-span-8">
                  <DDSConfigForm config={config} setConfig={setConfig} onGenerate={handleGenerateDds} isGenerating={isGenerating} />
                </div>
              </div>
            ) : (
                <div className="space-y-8 animate-fade max-w-4xl mx-auto">
                    <div className="flex justify-between items-center gap-4">
                        <button onClick={() => setDdsData(null)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 flex items-center gap-2 px-6 py-3 bg-white border rounded-2xl">
                            <ArrowLeft size={14} /> Voltar
                        </button>
                        <div className="flex gap-3">
                            <button onClick={exportToPDF} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Download size={16} /> PDF
                            </button>
                            <button onClick={handleGenerateDds} className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={16} /> Regerar
                            </button>
                        </div>
                    </div>

                    <div id="dds-printable-content" className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl p-10 md:p-20 relative overflow-hidden">
                        <div className="absolute top-10 right-10 opacity-10 flex items-center gap-2">
                           <ShieldCheck size={40} />
                           <span className="text-[10px] font-black uppercase">Sistema Líder</span>
                        </div>
                        <div className="border-b-4 border-slate-900 pb-10 mb-12">
                            <div className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <BookOpen size={16} /> Roteiro Diário de Segurança
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter uppercase leading-[0.9]">
                                {ddsData.titulo_dds}
                            </h1>
                        </div>
                        <div className="space-y-16">
                            <section>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quebra-gelo</h4>
                                <div className="p-8 bg-amber-50/50 rounded-[2rem] border border-amber-100 text-xl font-black text-slate-800 italic leading-tight">
                                    "{renderContent(ddsData.gatilho_inicial)}"
                                </div>
                            </section>
                            <section>
                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">A Perspectiva do Líder</h4>
                                <p className="text-lg font-medium text-slate-600 leading-relaxed">{renderContent(ddsData.historia_curta)}</p>
                            </section>
                            <section className="bg-slate-900 p-10 rounded-[3rem] text-white relative">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Fatos da Nossa Unidade</h4>
                                <p className="text-2xl font-black tracking-tight leading-tight">{renderContent(ddsData.conexao_realidade)}</p>
                                <Quote className="absolute top-6 right-8 text-slate-800" size={80} />
                            </section>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Atitude do Dia</h4>
                                    <p className="text-xl font-black text-slate-800">{renderContent(ddsData.acao_pratica)}</p>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compromisso Final</h4>
                                    <p className="text-xl font-bold text-slate-500 italic">"{renderContent(ddsData.frase_encerramento)}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DdsView;
