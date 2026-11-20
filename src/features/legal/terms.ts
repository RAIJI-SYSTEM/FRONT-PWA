import { LEGAL_CONTACT } from './contact';
import type { LegalText } from './LegalDocument';

export const TERMS: LegalText = {
  title: 'Termos de uso do Raiji',
  updatedAt: '20/11/2026',
  intro: `Estes termos explicam as regras para usar o ${LEGAL_CONTACT.company}, um app que conecta pessoas que vão viajar (motoristas) a passageiros, pessoas que precisam enviar encomendas e empresas que precisam de fretes. Ao criar uma conta ou usar o app, você concorda com estes termos.`,
  sections: [
    {
      title: 'O que o Raiji faz',
      paragraphs: [
        'O Raiji é uma plataforma de intermediação: motoristas publicam as viagens que já vão fazer e oferecem vagas e espaço de carga; passageiros, remetentes e empresas pedem uma vaga, enviam uma encomenda ou propõem um frete.',
        'O Raiji não presta o serviço de transporte. A viagem é combinada e realizada entre o motorista e quem contratou, que são responsáveis pelo que acertarem entre si.',
      ],
    },
    {
      title: 'Sua conta',
      items: [
        'Você precisa ter 18 anos ou mais e informar dados verdadeiros.',
        'A conta é pessoal: não compartilhe sua senha. Você responde pelo que for feito com ela.',
        'Contas de empresa (pessoa jurídica) devem ser criadas por quem tem poderes para representar a empresa.',
      ],
    },
    {
      title: 'Regras para motoristas',
      items: [
        'Ter CNH válida, com a observação EAR (exerce atividade remunerada), e enviar os dados e fotos da CNH para verificação.',
        'Usar veículo em boas condições, com documentação e seguro em dia, e cadastrar no app o veículo usado na viagem.',
        'Cumprir as leis de trânsito, respeitar a lotação do veículo e o peso e o tamanho de carga informados.',
        'Conferir as encomendas na retirada e não transportar itens proibidos.',
      ],
    },
    {
      title: 'Regras para passageiros, remetentes e empresas',
      items: [
        'Chegar no ponto de encontro no horário combinado e respeitar o motorista e os outros passageiros.',
        'Descrever as encomendas e a bagagem de forma correta (tamanho, peso e se é frágil).',
        'Não enviar itens proibidos por lei, perigosos, perecíveis sem embalagem adequada, animais ou dinheiro em espécie.',
      ],
    },
    {
      title: 'Preços e pagamentos',
      paragraphs: [
        'O preço de cada vaga ou encomenda é definido pelo motorista e mostrado antes da confirmação. O Raiji cobra uma taxa de serviço, mostrada no detalhamento do preço.',
        'Os pagamentos com cartão e Pix são processados pela Stripe. O Raiji não armazena os dados do seu cartão.',
      ],
    },
    {
      title: 'Cancelamentos',
      paragraphs: [
        'Motoristas e clientes podem cancelar pelo app. Cancelamentos frequentes ou em cima da hora podem levar a restrições na conta.',
      ],
    },
    {
      title: 'Avaliações e conduta',
      paragraphs: [
        'Depois de cada viagem, motoristas e clientes podem se avaliar. As avaliações devem ser honestas e respeitosas.',
        'Não são permitidos assédio, discriminação, ameaças, fraudes ou uso do app para atividades ilegais. Nesses casos, a conta pode ser suspensa ou encerrada.',
      ],
    },
    {
      title: 'Anúncios e recompensas',
      paragraphs: [
        'O app pode exibir anúncios e oferecer cupons e recompensas, que seguem as regras mostradas em cada oferta e podem ser alterados ou encerrados a qualquer momento.',
      ],
    },
    {
      title: 'Responsabilidades',
      paragraphs: [
        'O Raiji se esforça para manter o app funcionando e para verificar os motoristas, mas não garante que o serviço estará sempre disponível nem responde por atos de motoristas e clientes durante a viagem, salvo nos casos previstos em lei.',
      ],
    },
    {
      title: 'Seus dados',
      paragraphs: ['O uso dos seus dados pessoais está descrito na Política de Privacidade, que faz parte destes termos.'],
    },
    {
      title: 'Mudanças nestes termos',
      paragraphs: ['Podemos atualizar estes termos. Quando a mudança for importante, avisaremos pelo app ou por e-mail antes de ela valer.'],
    },
    {
      title: 'Contato e foro',
      paragraphs: [
        `Dúvidas sobre estes termos: ${LEGAL_CONTACT.email}.`,
        'Estes termos seguem as leis brasileiras, incluindo o Código de Defesa do Consumidor.',
      ],
    },
  ],
};
