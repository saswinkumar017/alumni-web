import { apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/shared";
import type { Donation, DonationStats, CreateDonationRequest } from "@/types/domain/donation";

type RawDonationStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

interface RawDonation {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  purpose: string | null;
  transactionId?: string | null;
  status: string;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: string;
}

const STATUS_MAP: Record<RawDonationStatus, Donation["status"]> = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
};

function toDonation(raw: RawDonation): Donation {
  return {
    id: raw.id,
    userId: raw.userId,
    displayName: raw.purpose ?? "General donation",
    amount: Number(raw.amount),
    currency: raw.currency,
    purpose: raw.purpose ?? "",
    transactionId: raw.transactionId ?? undefined,
    status: STATUS_MAP[raw.status as RawDonationStatus] ?? "pending",
    createdAt: raw.createdAt,
  };
}

export async function getDonations(): Promise<Donation[]> {
  const donations = await apiClient.get<RawDonation[]>("/donations");
  return donations.map(toDonation);
}

export async function getDonation(id: number): Promise<Donation> {
  return toDonation(await apiClient.get<RawDonation>(`/donations/${id}`));
}

export async function createDonation(data: CreateDonationRequest): Promise<Donation> {
  const res = await apiClient.post<ApiResponse<RawDonation>>("/donations", {
    amount: data.amount,
    purpose: data.purpose,
    notes: data.currency ? `Currency: ${data.currency}` : undefined,
  });
  return toDonation(res.data);
}

export async function getDonationStats(): Promise<DonationStats> {
  return apiClient.get<DonationStats>("/donations/stats");
}
