'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initPush } from './push';

/** Liga o push no app Android para a pessoa logada (não desenha nada) */
export default function PushRegistrar({ userId }: { userId: string }) {
  const router = useRouter();
  useEffect(() => {
    void initPush(userId, (href) => router.push(href));
  }, [userId, router]);
  return null;
}
