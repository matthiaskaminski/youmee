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
  category: string;
  media: MediaItem[];
  comments: Comment[];
}

export interface Opinion {
  id: string;
  person: string;
  content: string;
  source: string;
  createdAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
}
