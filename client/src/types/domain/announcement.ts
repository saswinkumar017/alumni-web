export interface Announcement {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly author: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly featured: boolean;
  readonly tags?: readonly string[];
}