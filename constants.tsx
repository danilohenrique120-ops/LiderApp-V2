
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
  <svg viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
    {/* Definições de Gradientes para as linhas de circuito */}
    <defs>
      <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>

    {/* ELO ESQUERDO */}
    <path 
      d="M80 20 L115 40 V80 L80 100 L45 80 V40 L80 20Z" 
      stroke="#0F172A" strokeWidth="8" strokeLinejoin="round" 
    />
    <path 
      d="M80 28 L108 44 V76 L80 92 L52 76 V44 L80 28Z" 
      stroke="#1E293B" strokeWidth="2" opacity="0.5" 
    />
    {/* Linhas de Circuito Elo Esquerdo */}
    <path d="M55 45 H75 V65" stroke="url(#circuitGrad)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M55 75 H70 M75 75 H90" stroke="url(#circuitGrad)" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="55" cy="45" r="2" fill="#94a3b8" />
    <circle cx="90" cy="75" r="2" fill="#94a3b8" />

    {/* ELO DIREITO (Entrelaçado) */}
    <path 
      d="M160 20 L195 40 V80 L160 100 L125 80 V40 L160 20Z" 
      stroke="#0F172A" strokeWidth="8" strokeLinejoin="round" 
    />
    <path 
      d="M160 28 L188 44 V76 L160 92 L132 76 V44 L160 28Z" 
      stroke="#1E293B" strokeWidth="2" opacity="0.5" 
    />
    {/* Linhas de Circuito Elo Direito */}
    <path d="M185 45 H165 V65" stroke="url(#circuitGrad)" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M185 75 H170 M165 75 H150" stroke="url(#circuitGrad)" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="185" cy="45" r="2" fill="#94a3b8" />
    <circle cx="150" cy="75" r="2" fill="#94a3b8" />

    {/* CONEXÃO CENTRAL (Onde os elos se cruzam) */}
    <g transform="translate(120, 60)">
      {/* Hexágono Laranja Central */}
      <path 
        d="M0 -15 L13 -7.5 V7.5 L0 15 L-13 7.5 V-7.5 L0 -15Z" 
        fill="#F97316" 
      />
      {/* Efeito de brilho no hexágono central */}
      <path 
        d="M0 -15 L13 -7.5 V7.5" 
        stroke="white" strokeWidth="1" opacity="0.3" 
      />
    </g>

    {/* Linhas Conectoras Superiores/Inferiores dos Elos */}
    <path d="M98 30 C110 30 130 30 142 30" stroke="#0F172A" strokeWidth="8" />
    <path d="M98 90 C110 90 130 90 142 90" stroke="#0F172A" strokeWidth="8" />
  </svg>
);
