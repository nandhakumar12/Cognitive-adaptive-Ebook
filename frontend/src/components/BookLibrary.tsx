/**
 * BOOK LIBRARY COMPONENT
 * 
 * Main library view with:
 * - Continue Listening section
 * - Browse Library grid
 * - Search and filter
 * - Audible-style layout
 */

import React, { useState, useEffect } from 'react';
import { BookCard } from './BookCard';
import type { Audiobook } from '../types/audiobook';
import audiobooksData from '../data/audiobooks.json';
import './BookLibrary.css';

interface BookLibraryProps {
    onSelectBook: (bookId: string) => void;
    onToggleResearchDashboard: () => void;
}

export const BookLibrary: React.FC<BookLibraryProps> = ({ onSelectBook, onToggleResearchDashboard }) => {
    const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredBooks, setFilteredBooks] = useState<Audiobook[]>([]);

    // Simulated user progress (in a real app, fetch from backend)
    const [userProgress] = useState<{ [key: string]: number }>({
        'book-1': 45, // 45% complete
        'book-2': 12,
        'book-3': 78
    });

    useEffect(() => {
        // Load audiobooks from JSON
        setAudiobooks(audiobooksData.books as Audiobook[]);
        setFilteredBooks(audiobooksData.books as Audiobook[]);
    }, []);

    useEffect(() => {
        // Filter books based on search query
        if (searchQuery.trim() === '') {
            setFilteredBooks(audiobooks);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = audiobooks.filter(book =>
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query) ||
                book.narrator.toLowerCase().includes(query)
            );
            setFilteredBooks(filtered);
        }
    }, [searchQuery, audiobooks]);

    const continueListeningBooks = audiobooks
        .filter(book => userProgress[book.id] > 0)
        .sort((a, b) => userProgress[b.id] - userProgress[a.id])
        .slice(0, 3);

    return (
        <div className="book-library" role="main">
            {/* Header */}
            <header className="library-header">
                <div className="library-logo">
                    <span className="logo-icon">🎧</span>
                    <h1 className="logo-text">Cognitive Audio</h1>
                </div>

                <div className="library-search">
                    <label htmlFor="search-books" className="sr-only">
                        Search audiobooks
                    </label>
                    <div className="search-bar">
                        <span className="search-icon" aria-hidden="true">🔍</span>
                        <input
                            id="search-books"
                            type="search"
                            className="search-input"
                            placeholder="Search audiobooks, authors, or genres..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <button className="btn btn-secondary library-btn" onClick={() => setSearchQuery('')}>
                    ↻ Refresh Library
                </button>
            </header>

            {/* Continue Listening Section */}
            {continueListeningBooks.length > 0 && (
                <section className="library-section" aria-labelledby="continue-listening-heading">
                    <h2 id="continue-listening-heading" className="section-title">
                        Continue Listening
                    </h2>
                    <div className="continue-listening-grid">
                        {continueListeningBooks.map(book => (
                            <div key={book.id} className="continue-listening-card">
                                <div className="continue-listening-cover">
                                    <img src={book.coverUrl} alt={`${book.title} cover`} />
                                </div>
                                <div className="continue-listening-info">
                                    <h3 className="continue-listening-title">{book.title}</h3>
                                    <p className="continue-listening-author">By {book.author}</p>
                                    <p className="continue-listening-progress">
                                        {userProgress[book.id]}% complete • {book.duration} remaining
                                    </p>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${userProgress[book.id]}%` }}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-primary continue-listening-btn"
                                        onClick={() => onSelectBook(book.id)}
                                    >
                                        ▶️ Resume
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Browse Library Section */}
            <section className="library-section" aria-labelledby="browse-library-heading">
                <h2 id="browse-library-heading" className="section-title">
                    Browse Library
                </h2>
                {filteredBooks.length > 0 ? (
                    <div className="books-grid">
                        {filteredBooks.map(book => (
                            <BookCard
                                key={book.id}
                                book={book}
                                progress={userProgress[book.id]}
                                onPlay={onSelectBook}
                                showProgress={!!userProgress[book.id]}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="no-results">
                        <p>No audiobooks found matching "{searchQuery}"</p>
                    </div>
                )}
            </section>

            {/* Research Dashboard Toggle */}
            <div className="research-toggle-wrapper">
                <button
                    className="btn btn-secondary research-toggle-btn"
                    onClick={onToggleResearchDashboard}
                >
                    📊 Research Dashboard
                </button>
            </div>
        </div>
    );
};
