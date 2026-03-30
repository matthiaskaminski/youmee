export interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  order: number;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string; role: string };
}

export interface Post {
  id: string;
  title: string;
  description: string;
  hashtags: string;
  imageUrl: string;
  status: string;
  date: string | null;
  order: number;
  platform: string;
  media: MediaItem[];
  comments: Comment[];
}
