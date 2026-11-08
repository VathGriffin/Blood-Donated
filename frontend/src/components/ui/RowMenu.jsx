'use client';
import { useT } from '@/i18n/I18nProvider';
import { useState } from 'react';
import Link from 'next/link';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

/** Row "⋮" menu holding a single link. */
export default function RowMenu({ label, href, horizontal }) {
  const t = useT();
  const [anchor, setAnchor] = useState(null);
  const Icon = horizontal ? MoreHorizIcon : MoreVertIcon;
  return (
    <>
      <IconButton size="small" aria-label={t('ui.rowActions')} onClick={(e) => setAnchor(e.currentTarget)} sx={{ color: 'text.secondary' }}>
        <Icon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem component={Link} href={href} onClick={() => setAnchor(null)}>
          <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{label}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
