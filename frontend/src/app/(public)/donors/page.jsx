'use client';
import DonorDirectory from '@/components/donor-directory/DonorDirectory';

// Public Donor Directory on the website. Signed-in donors have the same directory in their
// dashboard at /donor-directory.
export default function PublicDonorsPage() {
  return <DonorDirectory />;
}
