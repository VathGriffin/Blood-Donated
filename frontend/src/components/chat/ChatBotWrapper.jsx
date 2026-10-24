'use client';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const ChatBot = dynamic(() => import('./ChatBot'), { ssr: false });

export default function ChatBotWrapper() {
  const pathname = usePathname();
  // The /assistant page IS the full chat experience — a floating launcher on
  // top of it would be a redundant, overlapping "chat about chat" button.
  if (pathname === '/assistant') return null;
  return <ChatBot />;
}
