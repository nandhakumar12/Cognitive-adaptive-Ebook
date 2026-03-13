/**
 * Audiobook Type Definitions
 */

export interface Chapter {
    id: string;
    title: string;
    duration: string;
    startTime: number;
    audioUrl?: string;
}

export interface Audiobook {
    id: string;
    title: string;
    author: string;
    narrator: string;
    duration: string;
    rating: number;
    ratingCount: number;
    coverUrl: string;
    description: string;
    chapters: Chapter[];
    audioUrl: string;
    genres: string[];
    releaseDate: string;
    publisher: string;
}

export interface UserProgress {
    bookId: string;
    currentTime: number;
    currentChapter: number;
    lastListened: number;
    completed: boolean;
    bookmarks: Bookmark[];
}

export interface Bookmark {
    id: string;
    bookId: string;
    time: number;
    note?: string;
    createdAt: number;
}

export interface UserLibrary {
    userId: string;
    books: string[];
    progress: Record<string, UserProgress>;
    favorites: string[];
}
