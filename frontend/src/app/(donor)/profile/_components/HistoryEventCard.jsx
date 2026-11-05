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
import { DateBadge } from './AppointmentCard';

/**
 * A history entry that isn't a checked-in appointment (those use DonationCard):
 *  - registered: the day the donor registered through "Become a Donor"
 *  - recorded:   a donation staff recorded on the donor record
 *  - reported:   the last donation date the donor entered when registering
 */
export default function HistoryEventCard({ item }) {
  const { kind, date } = item;
  const when = formatDate(date);

  const content = {
    registered: {
      title: 'Registered as a donor',
      pill: <Pill tone="success" icon={<HowToRegIcon />}>Registered</Pill>,
      meta: [
        item.donor?.bloodType && <MetaLine key="bt" icon={<WaterDropOutlinedIcon />}>Blood type {item.donor.bloodType}</MetaLine>,
        item.donor?.location && <MetaLine key="loc" icon={<PlaceOutlinedIcon />}>{item.donor.location}</MetaLine>,
      ],
      text: 'Thank you for joining! You now appear in the donor directory, where hospitals can find you.',
    },
    recorded: {
      title: item.entry?.location || 'Blood donation',
      pill: <Pill tone="info" icon={<FavoriteIcon />}>Donated</Pill>,
      meta: [
        item.entry?.units > 1 && <MetaLine key="u" icon={<WaterDropOutlinedIcon />}>{item.entry.units} units</MetaLine>,
        item.entry?.notes && <MetaLine key="n" icon={<NotesIcon />}>{item.entry.notes}</MetaLine>,
      ],
    },
    reported: {
      title: 'Previous donation',
      pill: <Pill tone="neutral" icon={<EditNoteIcon />}>Reported by you</Pill>,
      meta: [],
      text: 'The last donation date you entered when you registered as a donor.',
    },
  }[kind];

  return (
    <Paper component="article" elevation={0} aria-label={`${content.title} on ${when}`} sx={itemCardSx}>
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
