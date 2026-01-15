
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Apenas aceita requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { occurrence, twttp, herca, actionPlan } = req.body;

    if (!occurrence || !occurrence.description) {
      return res.status(400).json({ error: 'Dados da ocorrência incompletos' });
    }

    // Inicializa a IA com a chave de ambiente protegida
    // Fixed: Initialized GoogleGenAI strictly following the provided SDK guidelines using process.env.API_KEY directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        Atue como um Especialista Sênior em Segurança Industrial e Qualidade (WCM/Lean Manufacturing).
        Analise os dados desta investigação de erro humano e gere um Relatório Executivo Analítico.
        
        DADOS DA OCORRÊNCIA:
        - Descrição: ${occurrence.description}
        - Colaborador: ${occurrence.employee?.name || 'Não informado'} (${occurrence.employee?.function || 'Não informado'})
        
        ANÁLISE DE CONHECIMENTO (TWTTP):
        ${JSON.stringify(twttp)}
        
        FATORES HERCA IDENTIFICADOS:
        ${JSON.stringify(herca)}
        
        PLANO DE AÇÃO PROPOSTO:
        - Causa Raiz: ${actionPlan?.rootCauses || 'Não informada'}
        - Ação Corretiva: ${actionPlan?.action || 'Não informada'}
        - Contramedida Principal: ${actionPlan?.countermeasure || 'Não informada'}
        
        ESTRUTURA DO SEU RELATÓRIO:
        1. RESUMO EXECUTIVO (Uma visão clara do risco).
        2. VALIDAÇÃO TÉCNICA (O plano proposto é eficaz para a causa raiz? Se não, sugira ajuste).
        3. RECOMENDAÇÃO DO LÍDER (Dica estratégica para evitar recorrência).
        
        Use um tom profissional e direto. Formate o texto de maneira legível com parágrafos claros.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const resultText = response.text;

    if (!resultText) {
      throw new Error("A IA retornou uma resposta vazia.");
    }

    return res.status(200).json({ text: resultText });

  } catch (error: any) {
    console.error("Erro na Serverless Function:", error);
    return res.status(500).json({ error: error.message || 'Erro interno ao processar análise.' });
  }
}
