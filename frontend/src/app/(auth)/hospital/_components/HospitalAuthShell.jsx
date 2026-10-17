'use client';
import { Alert, Box, Paper, Typography } from '@mui/material';
import { Favorite, CheckCircle, QrCodeScanner, Inventory2, EventAvailable } from '@mui/icons-material';

const BLUE_GRADIENT = 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)';

// Shared by every hospital-portal auth page so they stay visually identical.
export const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2.5 } };
export const primaryButtonSx = {
    borderRadius: 2.5, fontWeight: 700, fontSize: '0.95rem', py: 1.4, textTransform: 'none',
    background: BLUE_GRADIENT,
    boxShadow: '0 4px 16px rgba(13,71,161,0.35)',
    '&:hover': { background: 'linear-gradient(135deg, #0a3880 0%, #1257a8 100%)' },
    '&.Mui-disabled': { background: BLUE_GRADIENT, color: 'rgba(255,255,255,0.9)', opacity: 0.5, boxShadow: 'none' },
};
export const linkSx = {
    color: '#1565c0', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
    '&:focus-visible': { outline: '2px solid #1565c0', outlineOffset: 2, borderRadius: 0.5 },
};

export function ErrorAlert({ children }) {
    return children ? <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.82rem' }}>{children}</Alert> : null;
}

// Outcome screen (email sent, link invalid, password changed): round icon, title, text, actions.
const TONES = { info: ['#e3f2fd', '#1565c0'], error: ['#fdecea', '#c62828'], success: ['#e8f5e9', '#2e7d32'] };
export function ResultPanel({ tone = 'info', icon, title, role = 'status', children }) {
    const [bg, fg] = TONES[tone];
    return (
        <Box role={role} sx={{ textAlign: 'center' }}>
            <Box sx={{ width: 56, height: 56, mx: 'auto', mb: 2, borderRadius: '50%', bgcolor: bg, color: fg, display: 'grid', placeItems: 'center' }}>
                {icon}
            </Box>
            <Typography fontWeight={700} mb={1}>{title}</Typography>
            {children}
        </Box>
    );
}

const capabilities = [
    { icon: <EventAvailable sx={{ fontSize: 17 }} />, text: 'Confirm and check in appointments' },
    { icon: <Inventory2 sx={{ fontSize: 17 }} />, text: "Manage your hospital's blood stock" },
    { icon: <QrCodeScanner sx={{ fontSize: 17 }} />, text: 'Scan donor QR codes at check-in' },
];

/**
 * Hospital portal frame: the navy brand panel on the left (desktop only) and a card on the right
 * with a blue header carrying `icon`, `title` and `subtitle`.
 */
export default function HospitalAuthShell({ icon, title, subtitle, children, footer = 'Hospital staff only · accounts are created by BloodLife admins' }) {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <Box sx={{
                display: { xs: 'none', md: 'flex' }, width: '45%', flexShrink: 0,
                position: 'relative', flexDirection: 'column', justifyContent: 'space-between', p: 5,
                background: 'linear-gradient(160deg, #0d1b2a 0%, #1b3a4b 60%, #1565c0 100%)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 46, height: 46, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(6px)', border: '1.5px solid rgba(255,255,255,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Favorite sx={{ color: '#ef5350', fontSize: 24 }} />
                    </Box>
                    <Box>
                        <Typography fontWeight={800} fontSize="1.05rem" color="white" lineHeight={1.2}>BloodLife</Typography>
                        <Typography fontSize="0.72rem" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.08em' }}>
                            HOSPITAL PORTAL
                        </Typography>
                    </Box>
                </Box>

                <Box>
                    <Typography fontWeight={900} fontSize={{ md: '2rem', lg: '2.3rem' }} color="white" lineHeight={1.2} mb={1.5}>
                        Your Hospital&apos;s<br />Blood Operations
                    </Typography>
                    <Typography fontSize="0.95rem" sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, mb: 4 }}>
                        Manage requests, inventory, and donor check-ins for your facility.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {capabilities.map((c, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{
                                    width: 32, height: 32, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbdefb', flexShrink: 0,
                                }}>{c.icon}</Box>
                                <Typography fontSize="0.875rem" color="rgba(255,255,255,0.85)" fontWeight={500}>{c.text}</Typography>
                                <CheckCircle sx={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', ml: 'auto', flexShrink: 0 }} />
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Typography fontSize="0.72rem" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em' }}>
                    © 2026 HUST · DATA SCIENCE 4TH YEAR
                </Typography>
            </Box>

            <Box component="main" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 } }}>
                <Box sx={{ width: '100%', maxWidth: 440 }}>
                    <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #ebebeb', bgcolor: '#fff' }}>
                        <Box sx={{ background: BLUE_GRADIENT, borderBottom: '3px solid #e53935', px: { xs: 3, sm: 4 }, py: 3.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.15)', flexShrink: 0,
                                border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', '& svg': { fontSize: 26 },
                            }}>
                                {icon}
                            </Box>
                            <Box>
                                <Typography component="h1" fontWeight={800} fontSize="1.2rem" color="white" lineHeight={1.2}>{title}</Typography>
                                <Typography fontSize="0.8rem" sx={{ color: 'rgba(255,255,255,0.7)' }}>{subtitle}</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ p: { xs: 3, sm: 4 } }}>{children}</Box>
                    </Paper>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 2.5 }}>
                        {footer}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
