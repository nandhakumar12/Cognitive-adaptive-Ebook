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
    const progressText = showProgress ? `${progress}% complete. ` : '';
    const actionText = showProgress ? 'resume' : 'play';
    const ariaLabel = `${book.title} by ${book.author}. ${progressText}Click to ${actionText}`;

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPlay(book.id);
        }
    };

    return (
        <div className="book-card">
            <button
                className="book-card-action-trigger"
                onClick={() => onPlay(book.id)}
                onKeyPress={handleKeyPress}
                aria-label={ariaLabel}
            >
                <div className="book-card-cover-wrapper">
                    <img
                        src={book.coverUrl}
                        alt={`${book.title} cover`}
                        className="book-card-cover"
                    />
                    <div className="book-card-overlay">
                        {/* Changed to div/span to avoid nested buttons */}
                        <div className="book-card-play-btn-mock">
                            {showProgress ? '▶️ Resume' : '▶️ Play'}
                        </div>
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
            </button>

            {/* Management Controls - Moved outside main action button to avoid nesting */}
            {(onEdit || onDelete) && (
                <div className="book-card-mgmt-controls">
                    {onEdit && (
                        <button
                            className="mgmt-btn edit-btn"
                            onClick={(e) => { e.stopPropagation(); onEdit(book); }}
                            title="Edit Book"
                        >
                            ✏️
                        </button>
                    )}
                    {onDelete && (
                        <button
                            className="mgmt-btn delete-btn"
                            onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}
                            title="Delete Book"
                        >
                            🗑️
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
