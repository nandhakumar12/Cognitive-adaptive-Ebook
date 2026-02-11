/**
 * BOOK DETAIL PAGE
 * 
 * Full book detail view with:
 * - Large cover display
 * - Book metadata
 * - Chapter list
 * - Play button
 * - Audible-style design
 */

import React from 'react';
import type { Audiobook } from '../types/audiobook';
import './BookDetail.css';

interface BookDetailProps {
    book: Audiobook;
    progress?: number;
    onPlay: () => void;
    onBack: () => void;
}

export const BookDetail: React.FC<BookDetailProps> = ({
    book,
    progress = 0,
    onPlay,
    onBack
}) => {
    return (
        <div className="book-detail" role="main">
            <button
                className="back-button"
                onClick={onBack}
                aria-label="Back to library"
            >
                ← Back to Library
            </button>

            <div className="book-detail-header">
                <div className="book-detail-cover">
                    <img
                        src={book.coverUrl}
                        alt={`${book.title} cover`}
                    />
                </div>

                <div className="book-detail-info">
                    <h1 className="book-detail-title book-title">{book.title}</h1>
                    <p className="book-detail-author">By {book.author}</p>
                    <p className="book-detail-narrator">Narrated by {book.narrator}</p>

                    <div className="book-detail-meta">
                        <div className="meta-item">
                            <div className="rating">
                                <span aria-label={`${book.rating} out of 5 stars`}>
                                    {'⭐'.repeat(Math.round(book.rating))}
                                </span>
                                <span className="rating-number">{book.rating}</span>
                            </div>
                            <span className="rating-count">({book.ratingCount.toLocaleString()} ratings)</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Duration:</span>
                            <span className="meta-value">{book.duration}</span>
                        </div>
                    </div>

                    {progress > 0 && (
                        <div className="book-detail-progress">
                            <div className="progress-header">
                                <span>Your Progress: {progress}%</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        className="btn btn-primary play-large-btn"
                        onClick={onPlay}
                    >
                        ▶️ {progress > 0 ? 'Resume Listening' : 'Start Listening'}
                    </button>

                    <div className="book-detail-genres">
                        {book.genres.map((genre, index) => (
                            <span key={index} className="genre-tag">{genre}</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="book-detail-description">
                <h2>About this audiobook</h2>
                <p>{book.description}</p>
            </div>

            <div className="book-detail-chapters">
                <h2>Chapters ({book.chapters.length})</h2>
                <div className="chapters-list">
                    {book.chapters.map((chapter, index) => (
                        <div
                            key={chapter.id}
                            className="chapter-item"
                            role="button"
                            tabIndex={0}
                            aria-label={`Chapter ${index + 1}: ${chapter.title}, duration ${chapter.duration}`}
                        >
                            <div className="chapter-number">{index + 1}</div>
                            <div className="chapter-info">
                                <h3 className="chapter-title">{chapter.title}</h3>
                                <span className="chapter-duration">{chapter.duration}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
