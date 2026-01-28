import { useState } from 'react';
import { getAuth } from 'firebase/auth';

// Define o que a IA sabe fazer
type AcaoIA = 'dds' | 'analise' | 'roleplay' | 'pdi';

export function useLiderAI() {
  const [loading, setLoading] = useState(false);

  const gerar = async (acao: AcaoIA, dadosInput: any) => {
    setLoading(true);
    const auth = getAuth();
    const user = auth.currentUser;

    // 1. Segurança: Verifica se o usuário entrou no app
    if (!user) {
      alert("Você precisa fazer login primeiro!");
      setLoading(false);
      return null;
    }

    try {
      // Pega o crachá digital (token)
      const token = await user.getIdToken(true);
      
      // SEU SERVIDOR DO GOOGLE CLOUD (Já configurado):
      const BACKEND_URL = "https://lider-backend-universal-831955890134.us-central1.run.app"; 

      // 2. Chama o servidor
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: acao, data: dadosInput })
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Erro no servidor");
      }

      // 3. Sucesso! Retorna o texto
      return json.content;

    } catch (error: any) {
      console.error("Erro:", error);
      alert(`Ops! ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { gerar, loading };
}