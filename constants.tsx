
import React from 'react';

export const TOPICS_LIST = ['SAP', 'EHS&S', 'PLANO DE PRODUÇÃO', 'QUALIDADE'];

export const ROLE_OPTIONS = ['Operador III', 'Operador II', 'Operador I', 'Auxiliar de Produção'];

export const PREREQUISITE_RULES: Record<string, Record<string, number>> = {
  'Preenchimento de OP': { 'Operador III': 4, 'Operador II': 3, 'Operador I': 3, 'Auxiliar de Produção': 3 },
  'Apontamento de OP': { 'Operador III': 4, 'Operador II': 3, 'Operador I': 3, 'Auxiliar de Produção': 1 },
  'Encerramento de OP': { 'Operador III': 4, 'Operador II': 3, 'Operador I': 2, 'Auxiliar de Produção': 1 },
  'Abertura de notas de manutenção': { 'Operador III': 4, 'Operador II': 3, 'Operador I': 3, 'Auxiliar de Produção': 1 },
  'Planejar e realizar DDS': { 'Operador III': 3, 'Operador II': 3, 'Operador I': 3, 'Auxiliar de Produção': 2 },
  'Comportamento seguro (SSMA)': { 'Operador III': 3, 'Operador II': 3, 'Operador I': 3, 'Auxiliar de Produção': 3 },
  'Conhecer as FISPQS': { 'Operador III': 3, 'Operador II': 3, 'Operador I': 3, 'Auxiliar de Produção': 3 },
  'Organização diária do time': { 'Operador III': 4, 'Operador II': 3, 'Operador I': 2, 'Auxiliar de Produção': 1 },
  'Atualizar cronograma': { 'Operador III': 3, 'Operador II': 2, 'Operador I': 1, 'Auxiliar de Produção': 0 },
  'Conhecimento no cronograma': { 'Operador III': 3, 'Operador II': 3, 'Operador I': 3, 'Auxiliar de Produção': 1 },
  'Participação em Shop Floor': { 'Operador III': 3, 'Operador II': 3, 'Operador I': 3, 'Auxiliar de Produção': 1 }
};

export const LogoIcon = () => (
  <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M75 25 L105 25 L125 55 L105 85 L75 85 L55 55 Z" stroke="#0f172a" strokeWidth="6" strokeLinejoin="round" />
    <path d="M78 35 L100 35 L115 55 L100 75 L78 75 L63 55 Z" stroke="#0f172a" strokeWidth="1" strokeLinejoin="round" opacity="0.3" />
    <path d="M95 25 L125 25 L145 55 L125 85 L95 85 L75 55 Z" stroke="#0f172a" strokeWidth="6" strokeLinejoin="round" />
    <path d="M98 35 L120 35 L135 55 L120 75 L98 75 L83 55 Z" stroke="#0f172a" strokeWidth="1" strokeLinejoin="round" opacity="0.3" />
    <circle cx="100" cy="25" r="2" fill="#0f172a" />
    <circle cx="100" cy="85" r="2" fill="#0f172a" />
    <circle cx="75" cy="55" r="2" fill="#0f172a" />
    <circle cx="125" cy="55" r="2" fill="#0f172a" />
    <path d="M94 50 L106 50 L112 55 L106 60 L94 60 L88 55 Z" fill="#f97316" />
  </svg>
);
