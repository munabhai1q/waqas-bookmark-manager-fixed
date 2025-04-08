export interface Bookmark {
  id: number;
  title: string;
  url: string;
  description?: string;
  categoryId: number;
  userId: number;
}

export interface BookmarkCategory {
  id: number;
  name: string;
  userId: number;
}

export interface User {
  id: number;
  username: string;
}

export interface NewBookmark {
  title: string;
  url: string;
  description?: string;
  categoryId: number;
}

export interface NewCategory {
  name: string;
}
