import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const DonorCard = ({ name, bloodType, city }) => (
    <Card sx={{ mb: 2 }}>
        <CardContent>
            <Typography variant="h6">{name}</Typography>
            <Typography color="text.secondary">Blood Type: {bloodType}</Typography>
            <Typography>City: {city}</Typography>
        </CardContent>
    </Card>
);

export default DonorCard;
