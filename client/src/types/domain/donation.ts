export type DonationStatus = "pending" | "completed" | "failed" | "refunded";

export interface Donation {
  id: number;
  userId: number;
  displayName?: string;
  amount: number;
  currency: string;
  purpose: string;
  transactionId?: string;
  status: DonationStatus;
  receiptUrl?: string | null;
  createdAt: string;
}

export interface DonationStats {
  totalAmount: number | null;
  totalDonations: number;
}

export interface CreateDonationRequest {
  amount: number;
  currency?: string;
  purpose: string;
}
