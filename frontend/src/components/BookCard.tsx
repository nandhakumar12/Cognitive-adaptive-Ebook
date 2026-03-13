/**
 * BOOK CARD COMPONENT
 * 
 * Reusable audiobook card for library grid
 * Audible-style design with cover, metadata, and progress
 */

import React from 'react';
import type { Audiobook } from '../types/audiobook';
import './BookCard.css';

interface BookCardProps {
    book: Audiobook;
    progress?: number;
    onPlay: (bookId: string) => void;
    onEdit?: (book: Audiobook) => void;
    onDelete?: (bookId: string) => void;
    showProgress?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
    book,
    progress = 0,
    onPlay,
    onEdit,
    onDelete,
    showProgress = false
}) => {
    const handleClick = () => {
        onPlay(book.id);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPlay(book.id);
        }
    };

    return (
        <div
            className="book-card"
            onClick={handleClick}
            onKeyPress={handleKeyPress}
            tabIndex={0}
            role="button"
            aria-label={`${book.title} by ${book.author}. ${showProgress ? `${progress}% complete. ` : ''}Click to ${showProgress ? 'resume' : 'play'}`}
        >
            <div className="book-card-cover-wrapper">
                <img
                    src={book.coverUrl}
                    alt={`${book.title} cover`}
                    className="book-card-cover"
                />
                <div className="book-card-overlay">
                    <button
                        className="book-card-play-btn"
                        aria-label={showProgress ? `Resume ${book.title}` : `Play ${book.title}`}
                    >
                        {showProgress ? '▶️ Resume' : '▶️ Play'}
                    </button>
                </div>

                {showProgress && progress > 0 && (
                    <div className="book-card-progress-wrapper">
                        <div className="book-card-progress-bar">
                            <div
                                className="book-card-progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Management Controls */}
                {(onEdit || onDelete) && (
                    <div className="book-card-mgmt-controls" onClick={e => e.stopPropagation()}>
                        {onEdit && (
                            <button
                                className="mgmt-btn edit-btn"
                                onClick={() => onEdit(book)}
                                title="Edit Book"
                            >
                                ✏️
                            </button>
                        )}
                        {onDelete && (
                            <button
                                className="mgmt-btn delete-btn"
                                onClick={() => onDelete(book.id)}
                                title="Delete Book"
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="book-card-info">
                <h3 className="book-card-title">{book.title}</h3>
                <p className="book-card-author">By {book.author}</p>

                <div className="book-card-meta">
                    <div className="book-card-rating">
                        <span className="rating-stars" aria-label={`${book.rating} out of 5 stars`}>
                            {'⭐'.repeat(Math.round(book.rating || 0))}
                        </span>
                        <span className="rating-number">{book.rating || 0}</span>
                    </div>
                    <span className="book-card-duration">{book.duration || 'N/A'}</span>
                </div>
            </div>
        </div>
    );
};
