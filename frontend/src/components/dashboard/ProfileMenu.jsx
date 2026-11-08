'use client';
import { useState } from 'react';
import { Avatar, Box, ButtonBase, Tooltip, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { uploadUrl } from '@/lib/config';
import { ROLE_CONFIG, ROLES } from '@/lib/navigation';
import AccountMenu from '@/components/account/AccountMenu';
import { useT } from '@/i18n/I18nProvider';

const MENU_ID = 'dashboard-account-menu';
const BUTTON_ID = 'dashboard-account-button';
const ACCOUNT_ROLE = { [ROLES.ADMIN]: 'admin', [ROLES.HOSPITAL_STAFF]: 'hospital', [ROLES.DONOR]: 'donor' };
const BACK_TO_WEBSITE = { labelKey: 'nav.backToWebsite', href: '/', icon: HomeOutlinedIcon };

/**
 * The account chip in the top bar — avatar, name and role, so it's always clear who is
 * signed in — opening the shared AccountMenu: profile header, the role's links
 * (profileLinks in lib/navigation.js), back to the public site, and sign out. `profile` and
 * `onLogout` come from useDashboardSession. On phones the chip collapses to just the avatar.
 */
export default function ProfileMenu({ role, profile, onLogout }) {
  const [anchor, setAnchor] = useState(null);
  const t = useT();
  const cfg = ROLE_CONFIG[role];
  const accountRole = ACCOUNT_ROLE[role];
  const open = Boolean(anchor);
  const subtitle = profile.subtitle || t(profile.subtitleKey);

  return (
    <>
      <Tooltip title={open ? '' : t('layout.account.menu')}>
        <ButtonBase
          id={BUTTON_ID}
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label={t('layout.account.menuFor', { name: profile.name || '' })}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? MENU_ID : undefined}
          sx={{
            ml: 0.5, pl: { xs: 0.5, sm: 1.25 }, pr: { xs: 0.5, sm: 0.75 }, py: 0.5, gap: 1,
            borderRadius: '12px', border: 1, borderColor: open ? 'primary.main' : 'divider', bgcolor: 'background.paper',
            textAlign: 'left', transition: 'background-color .15s ease, border-color .15s ease',
            '&:hover': { bgcolor: 'action.hover' },
            '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
          }}
        >
          <Box sx={{ position: 'relative', display: 'flex' }}>
            <Avatar src={uploadUrl(profile.photo)} alt="" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700, width: 34, height: 34, fontSize: '0.9rem' }}>
              {profile.name?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
            <Box aria-hidden="true" sx={{ position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main', border: '2px solid', borderColor: 'background.paper' }} />
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0, maxWidth: 170 }}>
            <Typography noWrap sx={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.25 }}>{profile.name}</Typography>
            <Typography noWrap sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.25 }}>{subtitle}</Typography>
          </Box>
          <KeyboardArrowDownIcon aria-hidden="true" sx={{
            display: { xs: 'none', sm: 'block' }, fontSize: 18, color: 'text.secondary',
            transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease',
          }} />
        </ButtonBase>
      </Tooltip>

      <AccountMenu
        id={MENU_ID}
        labelledBy={BUTTON_ID}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        account={{ name: profile.name, email: profile.email, photo: profile.photo, role: accountRole, roleLabel: subtitle }}
        items={[...cfg.profileLinks, BACK_TO_WEBSITE]}
        onLogout={onLogout}
      />
    </>
  );
}
