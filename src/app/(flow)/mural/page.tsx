'use client';

import FlowTopBar from '@/components/FlowTopBar';
import Redirect from '@/components/Redirect';
import WithSearchParams from '@/components/WithSearchParams';
import BoardScreen from '@/features/board/components/BoardScreen';

/** /mural?id=... — meu pedido no mural: ofertas dos motoristas */
export default function BoardPage() {
  return (
    <>
      <FlowTopBar title="Pedido no mural" backHref="/homepage" />
      <WithSearchParams>
        {(params) => {
          const id = params.get('id');
          return id ? <BoardScreen requestId={id} /> : <Redirect to="/homepage" />;
        }}
      </WithSearchParams>
    </>
  );
}
