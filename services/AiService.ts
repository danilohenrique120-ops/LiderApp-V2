
import { GoogleGenAI, Type } from "@google/genai";
import { DdsResponse, RoleplayResponse, RoleplayReport } from '../types';

/**
 * AiService - Camada de Abstração para Inteligência Artificial
 * Como Tech Lead, centralizamos as chamadas aqui para garantir segurança e escalabilidade.
 */
export class AiService {
  private static instance: AiService;
  private ai: GoogleGenAI;

  private constructor() {
    // Inicialização segura usando a chave injetada pelo ambiente
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  }

  public static getInstance(): AiService {
    if (!AiService.instance) {
      AiService.instance = new AiService();
    }
    return AiService.instance;
  }

  /**
   * DDS GENERATION
   * Gera o roteiro de Diálogo Diário de Segurança baseado em contexto industrial.
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

  /**
   * ROLEPLAY ENGINE
   * Motor de simulação de conversas difíceis para líderes.
   */
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
      console.error("AI Service Error (Roleplay):", error);
      throw new Error("Falha na simulação de conversa.");
    }
  }

  /**
   * ROLEPLAY REPORT
   * Analisa a performance do líder após a simulação.
   */
  public async generateRoleplayReport(history: string): Promise<RoleplayReport> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise este histórico de conversa e gere um relatório de mentoria:\n${history}`,
        config: {
          systemInstruction: "Você é um Mentor de Liderança. Avalie pontos fortes e melhoria. Seja crítico mas construtivo.",
          responseMimeType: "application/json"
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("AI Service Error (Report):", error);
      throw new Error("Falha ao gerar relatório de mentoria.");
    }
  }
}
