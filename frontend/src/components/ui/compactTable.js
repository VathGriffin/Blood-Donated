// Compact dashboard tables: a rounded, tinted header strip and borderless rows.
export const compactHeadCell = {
  color: 'text.secondary', fontWeight: 600, fontSize: '0.78rem', bgcolor: 'action.hover', borderBottom: 'none', whiteSpace: 'nowrap',
  '&:first-of-type': { borderRadius: '8px 0 0 8px' },
  '&:last-of-type': { borderRadius: '0 8px 8px 0', width: 48 },
};

export const compactTableContainerSx = { px: { xs: 1, md: 2 }, pb: 1.5 };
