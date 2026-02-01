
import { GoogleGenAI, Type } from "@google/genai";
import { DdsResponse, RoleplayResponse, RoleplayReport } from '../types';

/**
 * AiService - Camada de Abstração para Inteligência Artificial
 */
export class AiService {
  private static instance: AiService;
  private ai: GoogleGenAI;

  private constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
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
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          CONTEXTO OPERACIONAL DA UNIDADE:
          ${JSON.stringify(contextData)}

          PERGUNTA DO GESTOR:
          "${prompt}"

          SUA MISSÃO:
          1. Analise os dados brutos (Matriz, OEE, PDIs, Erros) para encontrar a resposta.
          2. Seja extremamente analítico e estratégico.
          3. Se a pergunta for sobre pessoas, cite nomes baseados nas skills reais.
          4. Se for sobre performance, cruze os erros humanos com a queda de OEE.
          5. Use um tom de Tech Lead/Consultor de Operações.
        `,
        config: {
          systemInstruction: "Você é o Diretor de Operações Virtual do Sistema Líder. Você tem acesso a todos os dados da fábrica e sua função é dar respostas precisas para otimizar a produção e a gestão de pessoas."
        }
      });
      return response.text || "Não consegui processar a análise estratégica agora.";
    } catch (error) {
      console.error("Strategic Consultant Error:", error);
      return "Erro na conexão com a central de estratégia.";
    }
  }

  /**
   * IA DE AUDITORIA POR FOTO: COMPLIANCE
   */
  public async analyzeSafetyImage(base64Data: string, mimeType: string, text: string, context: string): Promise<string> {
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
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
    const model = 'gemini-3-flash-preview';
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
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Refine e profissionalize a descrição desta ocorrência industrial: "${description}".`,
        config: { systemInstruction: "Você é um Engenheiro de Processos Sênior. Transforme relatos informais em registros profissionais." }
      });
      return response.text || description;
    } catch (error) {
      return description;
    }
  }

  public async validateConsistency(twttp: any, herca: any, twttpAdvanced?: any): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
    const isKnowledgeGap = !hercaFactors || hercaFactors.length === 0;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
