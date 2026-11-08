'use client';
import DonorDirectory from '@/components/donor-directory/DonorDirectory';

// The Donor Directory inside the donor dashboard (sidebar "Donor Directory"). The public
// website has the same directory at /donors.
export default function DashboardDonorDirectoryPage() {
  return <DonorDirectory inDashboard />;
}
