'use client';
import { Box, Paper, Typography } from '@mui/material';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import EditNoteIcon from '@mui/icons-material/EditNote';
import NotesIcon from '@mui/icons-material/Notes';
import { MetaLine, Pill, formatDate, itemCardSx } from '@/components/donor/ui';
import { useT } from '@/i18n/I18nProvider';
import { DateBadge } from './AppointmentCard';

/**
 * A history entry that isn't a checked-in appointment (those use DonationCard):
 *  - registered: the day the donor registered through "Become a Donor"
 *  - recorded:   a donation staff recorded on the donor record
 *  - reported:   the last donation date the donor entered when registering
 */
export default function HistoryEventCard({ item }) {
  const t = useT();
  const { kind, date } = item;
  const when = formatDate(date);

  const content = {
    registered: {
      title: t('donor.history.registeredTitle'),
      pill: <Pill tone="success" icon={<HowToRegIcon />}>{t('donor.history.registered')}</Pill>,
      meta: [
        item.donor?.bloodType && <MetaLine key="bt" icon={<WaterDropOutlinedIcon />}>{t('donor.history.bloodType', { type: item.donor.bloodType })}</MetaLine>,
        item.donor?.location && <MetaLine key="loc" icon={<PlaceOutlinedIcon />}>{item.donor.location}</MetaLine>,
      ],
      text: t('donor.history.registeredText'),
    },
    recorded: {
      title: item.entry?.location || t('donor.history.donation'),
      pill: <Pill tone="info" icon={<FavoriteIcon />}>{t('donor.history.donated')}</Pill>,
      meta: [
        item.entry?.units > 1 && <MetaLine key="u" icon={<WaterDropOutlinedIcon />}>{t('donor.history.units', { count: item.entry.units })}</MetaLine>,
        item.entry?.notes && <MetaLine key="n" icon={<NotesIcon />}>{item.entry.notes}</MetaLine>,
      ],
    },
    reported: {
      title: t('donor.history.previous'),
      pill: <Pill tone="neutral" icon={<EditNoteIcon />}>{t('donor.history.reported')}</Pill>,
      meta: [],
      text: t('donor.history.reportedText'),
    },
  }[kind];

  return (
    <Paper component="article" elevation={0} aria-label={t('donor.history.aria', { title: content.title, date: when })} sx={itemCardSx}>
      <Box sx={{ display: 'flex', gap: { xs: 1.75, sm: 3 }, alignItems: 'center' }}>
        <DateBadge date={date} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <Typography component="h3" sx={{ fontWeight: 800, fontSize: '1.15rem', mr: 0.5, overflowWrap: 'anywhere' }}>{content.title}</Typography>
            {content.pill}
          </Box>
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', columnGap: 3.5, rowGap: 0.75 }}>
            <MetaLine icon={<EventOutlinedIcon />}>{when}</MetaLine>
            {content.meta}
          </Box>
          {content.text && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{content.text}</Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
