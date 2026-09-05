import { apiClient } from "@/lib/api/client";

export interface DashboardData {
  totalAlumni: number;
  upcomingEvents: number;
  activeConnections: number;
  unreadMessages: number;
  recentEvents: Array<{
    id: string;
    title: string;
    date: string;
    location: string;
  }>;
  recentActivities: Array<{
    id: string;
    description: string;
    timestamp: string;
  }>;
}

export async function getDashboard(): Promise<DashboardData> {
  return apiClient.get<DashboardData>("/dashboard");
}
