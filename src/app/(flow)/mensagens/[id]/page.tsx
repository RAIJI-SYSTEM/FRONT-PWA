import ChatScreen from '@/features/messages/components/ChatScreen';

export default async function ChatPage({ params }: PageProps<'/mensagens/[id]'>) {
  const { id } = await params;
  // O cabeçalho fica dentro da tela, que ocupa a viewport inteira (lista rolável + campo de texto fixo)
  return <ChatScreen conversationId={id} />;
}
