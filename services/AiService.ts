
import { GoogleGenAI, Type } from "@google/genai";
import { DdsResponse, RoleplayResponse, RoleplayReport } from '../types';

/**
 * AiService - Camada de Abstração para Inteligência Artificial
 */
export class AiService {
  private static instance: AiService;
  private ai: GoogleGenAI | null = null;
  private isEnabled: boolean = false;

  private constructor() {
    // In Vite, we should use import.meta.env, but gracefully fallback just in case
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined);
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.isEnabled = true;
    } else {
      console.warn("AiService: API Key is missing. AI features will be disabled.");
    }
  }

  public static getInstance(): AiService {
    if (!AiService.instance) {
      AiService.instance = new AiService();
    }
    return AiService.instance;
  }

  /**
   * IA CONSULTOR ESTRATÉGICO (SALA DE GUERRA)
   * Realiza cruzamento de dados de toda a unidade para suporte à decisão.
   */
  public async queryStrategicConsultant(prompt: string, contextData: any): Promise<string> {
    const currentApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined);

    if (!currentApiKey || currentApiKey.trim() === '') {
      return "ERRO: Chave de API do Gemini não configurada no arquivo .env";
    }

    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey: currentApiKey });
      this.isEnabled = true;
    }
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          CONTEXTO OPERACIONAL DA UNIDADE:
          ${JSON.stringify(contextData)}

          PERGUNTA DO USUÁRIO:
          "${prompt}"

          SUA MISSÃO TÁTICA:
          1. Responda a dúvidas sobre como usar a aplicação LiderApp.
          2. Sugira boas práticas de liderança e gestão.
          3. Oriente o usuário sobre onde encontrar as funcionalidades (ex: Dashboard, Projetos, Agenda, DDS, PDI, 1:1, Follow-up).
          4. Mantenha um tom encorajador e profissional de um Diretor conselheiro.
        `,
        config: {
          systemInstruction: "És o Copiloto do Sistema Líder. O teu objetivo é ajudar o gestor a utilizar a aplicação. Conheces todos os módulos: Dashboard, Projetos (Macro Kanban), Agenda, DDS, PDI, 1:1, Follow-up, etc. Responde a dúvidas sobre como usar a app, sugere boas práticas de liderança e orienta o utilizador sobre onde encontrar cada funcionalidade."
        }
      });
      return response.text || "Não consegui processar a análise estratégica agora.";
    } catch (error: any) {
      console.error("==== DETALHES DO ERRO DA API GEMINI ====");
      console.error(error);
      if (error?.status) console.error("Status HTTP:", error.status);
      if (error?.message) console.error("Mensagem de Erro:", error.message);
      console.error("========================================");

      return `Erro na conexão com a central de estratégia: ${error?.message || 'Falha desconhecida.'}`;
    }
  }

  /**
   * IA DE AUDITORIA POR FOTO: COMPLIANCE
   */
  public async analyzeSafetyImage(base64Data: string, mimeType: string, text: string, context: string): Promise<string> {
    if (!this.isEnabled || !this.ai) return "Análise de imagem indisponível (API Key missing).";
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            {
              text: `
                CONTEXTO TÉCNICO (Normas e POPs):
                ${context}

                DÚVIDA/COMANDO DO GESTOR:
                ${text || "Analise esta foto sob a ótica de conformidade industrial e segurança."}

                SUA MISSÃO:
                1. Identifique o cenário e objetos principais.
                2. Verifique desvios em relação aos POPs fornecidos (se houver).
                3. Aponte riscos de segurança (EHS) ou falta de organização (5S).
                4. Seja direto e técnico. Use negrito para pontos críticos.
              `
            }
          ]
        },
        config: {
          systemInstruction: "Você é um Auditor Sênior de Qualidade e Segurança Industrial. Sua visão é treinada para detectar desvios em ambientes produtivos."
        }
      });
      return response.text || "Não foi possível extrair dados da imagem.";
    } catch (error) {
      console.error("Image Analysis Error:", error);
      return "Erro ao processar imagem de auditoria.";
    }
  }

  /**
   * IA PROATIVA: RADAR LÍDER
   */
  public async analyzeProactiveRisks(risks: string[]): Promise<string> {
    if (risks.length === 0) return "Operação estável. Todos os indicadores dentro do padrão.";
    if (!this.isEnabled || !this.ai) return "Análise de riscos indisponível (API Key missing).";

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Como seu Co-Piloto de Operações, analise estes riscos detectados no sistema:
          ${risks.join('\n')}

          Sua missão:
          1. Priorize o risco MAIS CRÍTICO para a segurança ou produção.
          2. Gere uma recomendação curta (máx 2 frases) para o gestor agir HOJE.
          3. Use um tom de "parceiro estratégico".
        `,
        config: {
          systemInstruction: "Você é o Mentor Estratégico do Sistema Líder. Você transforma dados de risco em ações de liderança imediatas e precisas."
        }
      });
      return response.text || "Detectados pontos de atenção. Verifique os indicadores da matriz.";
    } catch (error) {
      return "Análise de radar indisponível no momento.";
    }
  }

  /**
   * DDS GENERATION
   */
  public async generateDds(prompt: string, config: { duration: number, tone: string }): Promise<DdsResponse> {
    if (!this.isEnabled || !this.ai) throw new Error("Serviço de IA não configurado.");
    const model = 'gemini-1.5-flash';
    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: `Você é um Especialista Sênior em EHS Industrial. Gere um DDS impactante de ${config.duration} min com tom ${config.tone}.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titulo_dds: { type: Type.STRING },
              gatilho_inicial: { type: Type.STRING },
              historia_curta: { type: Type.STRING },
              conexao_realidade: { type: Type.STRING },
              acao_pratica: { type: Type.STRING },
              frase_encerramento: { type: Type.STRING }
            },
            required: ["titulo_dds", "gatilho_inicial", "historia_curta", "conexao_realidade", "acao_pratica", "frase_encerramento"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("AI Service Error (DDS):", error);
      throw new Error("Falha ao gerar DDS técnico.");
    }
  }

  public async refineOccurrence(description: string): Promise<string> {
    if (!this.isEnabled || !this.ai) return description;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Refine e profissionalize a descrição desta ocorrência industrial: "${description}".`,
        config: { systemInstruction: "Você é um Engenheiro de Processos Sênior. Transforme relatos informais em registros profissionais." }
      });
      return response.text || description;
    } catch (error) {
      return description;
    }
  }

  public async validateConsistency(twttp: any, herca: any, twttpAdvanced?: any): Promise<string> {
    if (!this.isEnabled || !this.ai) return "";
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Analise a consistência técnica desta investigação:
          1. TWTTP Inicial: ${JSON.stringify(twttp)}
          2. TWTTP Avançada: ${JSON.stringify(twttpAdvanced || "Não aplicada")}
          3. HERCA: ${JSON.stringify(herca || "Não aplicado")}

          REGRA: Se TWTTP diz 'falta conhecimento', o HERCA é ignorado.
        `,
        config: { systemInstruction: "Você é um Auditor de Fator Humano." }
      });
      return response.text || "";
    } catch (error) {
      return "";
    }
  }

  public async suggestCountermeasures(hercaFactors: string[], rootCauses: string, twttpAdvanced?: any): Promise<string[]> {
    if (!this.isEnabled || !this.ai) return [];
    const isKnowledgeGap = !hercaFactors || hercaFactors.length === 0;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          TIPO DE FALHA: ${isKnowledgeGap ? "GAP DE CONHECIMENTO" : "FALHA SISTÊMICA"}
          DETALHES: ${JSON.stringify(twttpAdvanced || hercaFactors)}
          CAUSA RAIZ: ${rootCauses}
          Sugerir 3 contramedidas de engenharia/processo (Poka-Yoke).
        `,
        config: { systemInstruction: "Você é um Especialista em Engenharia de Prevenção de Erros." }
      });
      return response.text?.split('\n').filter(s => s.trim().length > 0).map(s => s.replace(/^\d+\.\s*/, '')) || [];
    } catch (error) {
      return [];
    }
  }

  public async queryRoleplay(message: string, systemContext: string): Promise<RoleplayResponse> {
    if (!this.isEnabled || !this.ai) throw new Error("Simulação indisponível.");
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
          systemInstruction: systemContext,
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      throw new Error("Falha na simulação.");
    }
  }

  public async generateRoleplayReport(history: string): Promise<RoleplayReport> {
    if (!this.isEnabled || !this.ai) throw new Error("Relatório indisponível.");
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Analise este histórico e gere relatório JSON:\n${history}`,
        config: {
          systemInstruction: "Você é um Mentor de Liderança.",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      throw new Error("Falha ao gerar relatório.");
    }
  }
}
