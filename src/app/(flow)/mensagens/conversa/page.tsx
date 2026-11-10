'use client';

import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import ChatScreen from '@/features/messages/components/ChatScreen';

/** /mensagens/conversa?id=... */
export default function ChatPage() {
  // O cabeçalho fica dentro da tela, que ocupa a viewport inteira (lista rolável + campo de texto fixo)
  return (
    <WithSearchParams>
      {(params) => {
        const id = params.get('id');
        return id ? <ChatScreen key={id} conversationId={id} /> : <Redirect to="/mensagens" />;
      }}
    </WithSearchParams>
  );
}
