
export type SkillStatus = 'ok' | 'warning' | 'critical' | 'na';

/**
 * Calcula o status de uma competência baseado no Método Sistema Líder / WCM
 * @param real Nível atual do colaborador (0-4)
 * @param target Nível exigido pelo cargo (0-4)
 */
export const calculateSkillStatus = (real: number | null, target: number): SkillStatus => {
    if (real === null) return 'na';
    
    // Caso 1: Atingiu ou superou a meta
    if (real >= target) return 'ok';
    
    // Caso 2: Gap Crítico
    // Se não sabe nada (0) mas precisa de algo, ou se o gap é maior que 1 nível
    if (real === 0 || (target - real) > 1) return 'critical';
    
    // Caso 3: Gap de Atenção
    // Diferença de apenas 1 nível
    if ((target - real) === 1) return 'warning';

    return 'ok';
};

export const getStatusColor = (status: SkillStatus) => {
    switch (status) {
        case 'ok': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
        case 'warning': return 'text-amber-500 bg-amber-50 border-amber-100';
        case 'critical': return 'text-rose-500 bg-rose-50 border-rose-100';
        default: return 'text-slate-300 bg-transparent border-transparent';
    }
};
