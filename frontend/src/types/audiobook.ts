/**
 * Audiobook Type Definitions
 */

export interface Chapter {
    id: string;
    title: string;
    duration: string; // Format: "28:32"
    startTime: number; // Seconds from start
}

export interface Audiobook {
    id: string;
    title: string;
    author: string;
    narrator: string;
    duration: string; // Format: "4h 49m"
    rating: number; // 0-5
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
    currentTime: number; // Seconds
    currentChapter: number;
    lastListened: number; // Timestamp
    completed: boolean;
    bookmarks: Bookmark[];
}

export interface Bookmark {
    id: string;
    bookId: string;
    time: number; // Seconds
    note?: string;
    createdAt: number;
}

export interface UserLibrary {
    userId: string;
    books: string[]; // Book IDs
    progress: Record<string, UserProgress>;
    favorites: string[];
}
