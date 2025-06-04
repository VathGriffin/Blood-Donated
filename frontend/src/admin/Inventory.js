import React from 'react';
import {
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    useTheme,
    Box
} from '@mui/material';

const inventory = [
    { blood: 'A+', units: 120 },
    { blood: 'B+', units: 85 },
    { blood: 'O-', units: 45 },
    { blood: 'AB+', units: 32 },
    { blood: 'A-', units: 60 },
];

const Inventory = () => {
    const theme = useTheme();

    const getBloodChipColor = (blood) => {
        if (blood.includes('A+')) return 'error';
        if (blood.includes('B+')) return 'warning';
        if (blood.includes('O')) return 'primary';
        if (blood.includes('AB')) return 'secondary';
        return 'default';
    };

    return (
        <Box>
            {/* 🔧 Title with icon and gradient text */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
                    🧪
                </Typography>
                <Typography
                    variant="h4"
                    fontWeight="bold"
                    sx={{
                        background: 'linear-gradient(to right, #b71c1c, #d32f2f)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Blood Inventory
                </Typography>
            </Box>

            {/* 📊 Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
                <Table>
                    <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fbe9e7' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Blood Type</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Available Units</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {inventory.map((item, idx) => (
                            <TableRow
                                key={idx}
                                sx={{
                                    '&:nth-of-type(odd)': {
                                        backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                                    },
                                    '&:hover': {
                                        backgroundColor: theme.palette.action.hover,
                                    },
                                }}
                            >
                                <TableCell>
                                    <Chip
                                        label={item.blood}
                                        color={getBloodChipColor(item.blood)}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography fontWeight="bold" color="text.primary">
                                        {item.units} units
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Inventory;
