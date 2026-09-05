export interface GalleryAlbum {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description?: string;
  readonly coverImage: string;
  readonly images: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}