// Strip HTML tags from text inputs
export function stripHtml(str: string | null): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

const VALID_STATUSES = ["draft", "review", "approved", "published"] as const;
const VALID_PLATFORMS = ["instagram", "facebook", "both"] as const;
const VALID_CATEGORIES = ["post", "story", "reels"] as const;

export type PostStatus = (typeof VALID_STATUSES)[number];
export type PostPlatform = (typeof VALID_PLATFORMS)[number];
export type PostCategory = (typeof VALID_CATEGORIES)[number];

export function isValidStatus(s: string): s is PostStatus {
  return (VALID_STATUSES as readonly string[]).includes(s);
}

export function isValidPlatform(p: string): p is PostPlatform {
  return (VALID_PLATFORMS as readonly string[]).includes(p);
}

export function isValidCategory(c: string): c is PostCategory {
  return (VALID_CATEGORIES as readonly string[]).includes(c);
}
