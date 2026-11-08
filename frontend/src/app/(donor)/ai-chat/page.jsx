'use client';
import { Box } from '@mui/material';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import { useI18n } from '@/i18n/I18nProvider';
import { useUserAuth } from '@/store/UserAuthContext';
import { uploadUrl } from '@/lib/config';
import { initialsOf } from '@/lib/format';
import { PageHero } from '@/components/ui';
import HeartArt from '@/components/donor/HeartArt';
import ChatPanel from '@/components/assistant/ChatPanel';
import { AboutAssistant, QuickQuestions } from '@/components/assistant/SidePanels';
import useAssistantChat from '@/components/assistant/useAssistantChat';

/**
 * Donor "Chat with AI" (inside the donor dashboard, so the session is already confirmed).
 * Answers come from POST /api/chat (Gemini on the server) with the built-in guide as the
 * fallback; "Am I eligible" / "Check my eligibility" are answered from the donor's own record
 * and the platform rules instead of the AI (see useAssistantChat.checkEligibility).
 */
export default function DonorAiChatPage() {
  const { t, lang } = useI18n();
  const { user, token } = useUserAuth();
  const chat = useAssistantChat({ token, email: user?.email, lang });

  const ask = (key) => (key === 'eligible'
    ? chat.checkEligibility(t('aiChat.quick.eligible'))
    : chat.send(t(`aiChat.quick.${key}`)));
  const act = (key) => (key === 'eligibility'
    ? chat.checkEligibility(t('aiChat.actions.eligibility'))
    : chat.send(t(`aiChat.actionPrompts.${key}`)));

  return (
    <Box sx={{ pb: 3 }}>
      <PageHero
        titleId="ai-chat-title"
        crumbs={[{ label: 'BloodLife AI', href: '/profile' }, { label: t('aiChat.crumb') }]}
        icon={<SmartToyRoundedIcon />}
        title={t('aiChat.title')}
        subtitle={t('aiChat.subtitle')}
        art={<Box sx={{ display: { xs: 'none', lg: 'block' }, width: 300, height: 110, flexShrink: 0 }}><HeartArt idPrefix="ai-hero" /></Box>}
      />
      <Box sx={{
        display: 'grid', gap: { xs: 2, md: 2.5 }, alignItems: 'stretch',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 360px' },
        // On large screens the chat fills the viewport below the hero and scrolls inside.
        height: { lg: 'calc(100vh - 300px)' }, minHeight: { lg: 600 },
      }}>
        <ChatPanel messages={chat.messages} sending={chat.sending} onSend={chat.send} onRetry={chat.retry} onAction={act}
          user={{ name: user?.fullName, photo: uploadUrl(user?.photo), initials: initialsOf(user?.fullName) }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 }, minHeight: 0, overflowY: { lg: 'auto' } }}>
          <QuickQuestions onAsk={ask} disabled={chat.sending} />
          <AboutAssistant />
        </Box>
      </Box>
    </Box>
  );
}
