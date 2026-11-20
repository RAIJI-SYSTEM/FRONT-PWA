import { LEGAL_CONTACT } from './contact';
import type { LegalText } from './LegalDocument';

export const PRIVACY: LegalText = {
  title: 'Política de privacidade',
  updatedAt: '20/11/2026',
  intro: `Esta política explica quais dados pessoais o ${LEGAL_CONTACT.company} coleta, para que usa, com quem compartilha e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).`,
  sections: [
    {
      title: 'Dados que coletamos',
      items: [
        'Conta: nome, e-mail, senha (guardada de forma protegida pelo sistema de login) e, se você entrar com o Google, os dados básicos do seu perfil Google.',
        'Contato: telefone, quando você informa no perfil.',
        'Empresa: CNPJ, razão social e as pessoas que você convida para gerenciar a empresa.',
        'Motoristas: número, categoria, validade e fotos da CNH, e dados dos veículos (placa, modelo, cor).',
        'Viagens e encomendas: origens, destinos, pontos de encontro, horários, bagagem, dados das encomendas e do destinatário.',
        'Localização: quando você usa o mapa ou permite o uso da localização, para encontrar viagens e endereços perto de você.',
        'Mensagens: o que você envia no chat, incluindo fotos, documentos e áudios.',
        'Pagamentos: valor, forma de pagamento e situação. Os dados do cartão ficam só com a Stripe.',
        'Uso do app: avaliações, notificações, preferências e identificadores do aparelho usados pelos anúncios.',
      ],
    },
    {
      title: 'Para que usamos',
      items: [
        'Criar e proteger sua conta e confirmar que é você quem está entrando.',
        'Encontrar viagens, ligar passageiros, encomendas e fretes aos motoristas e mostrar o caminho no mapa.',
        'Verificar a CNH dos motoristas, para a segurança de todos.',
        'Processar pagamentos e prevenir fraudes.',
        'Permitir a conversa entre motoristas e clientes e enviar avisos sobre as suas viagens.',
        'Exibir anúncios e oferecer recompensas.',
        'Cumprir obrigações legais e atender pedidos de autoridades.',
      ],
    },
    {
      title: 'Com quem compartilhamos',
      paragraphs: [
        'Para a viagem acontecer, o motorista vê o nome, os pontos de encontro e os dados da encomenda de quem contratou; o cliente vê o nome, o veículo e a placa do motorista.',
        'Também usamos empresas que tratam dados em nosso nome, somente para as finalidades acima:',
      ],
      items: [
        'Stripe: pagamentos com cartão e Pix.',
        'Mapbox: mapas, busca de endereços e rotas.',
        'Google (AdMob e login com Google): anúncios e login, quando você escolhe usar.',
        'Infosimples: consulta dos dados da CNH na verificação de motoristas.',
        'Resend: envio de e-mails.',
        'Provedores de nuvem onde o app e os dados ficam hospedados.',
      ],
    },
    {
      title: 'Bases legais',
      paragraphs: [
        'Tratamos os dados para executar o contrato com você (os serviços do app), cumprir obrigações legais, proteger a sua segurança e a de terceiros, prevenir fraudes (legítimo interesse) e, quando necessário, com o seu consentimento — por exemplo, para a localização e os anúncios personalizados.',
      ],
    },
    {
      title: 'Permissões do aparelho',
      items: [
        'Localização: para o mapa e para achar viagens perto de você.',
        'Câmera e fotos: para enviar a foto da CNH e imagens no chat.',
        'Microfone: para gravar mensagens de voz no chat.',
      ],
      paragraphs: ['Você pode negar ou retirar cada permissão nas configurações do aparelho; só a função que depende dela deixa de funcionar.'],
    },
    {
      title: 'Por quanto tempo guardamos',
      paragraphs: [
        'Guardamos os dados enquanto a sua conta estiver ativa e, depois, pelo tempo exigido por lei (por exemplo, registros de acesso por 6 meses, conforme o Marco Civil da Internet, e dados de pagamento pelo prazo fiscal). Depois disso, os dados são apagados ou anonimizados.',
      ],
    },
    {
      title: 'Seus direitos',
      paragraphs: ['Você pode, a qualquer momento:'],
      items: [
        'Confirmar se tratamos seus dados e pedir uma cópia deles.',
        'Corrigir dados incompletos ou errados.',
        'Pedir a exclusão da conta e dos dados que não precisamos guardar por lei.',
        'Pedir a portabilidade dos dados.',
        'Retirar um consentimento dado.',
        'Reclamar à Autoridade Nacional de Proteção de Dados (ANPD).',
      ],
    },
    {
      title: 'Segurança',
      paragraphs: [
        'Usamos medidas técnicas para proteger os dados, como conexões protegidas, controle de acesso e senhas guardadas de forma cifrada. Nenhum sistema é totalmente imune a falhas; se acontecer um incidente que possa trazer risco a você, avisaremos.',
      ],
    },
    {
      title: 'Crianças',
      paragraphs: ['As contas do Raiji são só para maiores de 18 anos. Não coletamos de propósito dados de crianças e adolescentes.'],
    },
    {
      title: 'Contato',
      paragraphs: [
        `Encarregado de dados (DPO): ${LEGAL_CONTACT.dpoEmail}.`,
        'Podemos atualizar esta política; a data no topo mostra a versão em vigor.',
      ],
    },
  ],
};
