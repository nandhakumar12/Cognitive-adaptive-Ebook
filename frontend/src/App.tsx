/**
 * MAIN APP COMPONENT - AUDIBLE-STYLE AUDIOBOOK PLATFORM
 * 
 * Multi-view application with:
 * - Library view (browse books)
 * - BookDetail view
 * - Player view (listening)
 * 
 * MAINTAINS: Cognitive feedback loop and all research features
 */

import { useState, useEffect } from 'react';
import { BookLibrary } from './components/BookLibrary';
import { BookDetail } from './components/BookDetail';
import { AudioPlayer } from './components/AudioPlayer';
import { ResearchDashboard } from './components/ResearchDashboard';
import { eventEmitter } from './services/EventEmitter';
import type { Audiobook } from './types/audiobook';
import audiobooksData from './data/audiobooks.json';
import { AuthPage } from './components/auth/AuthPage';
import { useAuth } from './contexts/AuthContext';
import './styles/audible-theme.css';
import './App.css';

type AppView = 'library' | 'bookDetail' | 'player';

function App() {
    const { isAuthenticated, isLoading, logout, user } = useAuth();
    const [currentView, setCurrentView] = useState<AppView>('library');
    const [selectedBook, setSelectedBook] = useState<Audiobook | null>(null);
    const [showResearchDashboard, setShowResearchDashboard] = useState(false);
    const [discoveredDurations, setDiscoveredDurations] = useState<Record<string, string>>({});

    const [userProgress] = useState<{ [key: string]: number }>({
        'book-1': 45,
        'book-2': 12,
        'book-3': 78
    });

    const [seekToTime, setSeekToTime] = useState<number | undefined>(undefined);
    const [currentAudioUrl, setCurrentAudioUrl] = useState<string>('');
    const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);

    useEffect(() => {
        if (isAuthenticated) {
            eventEmitter.startSession();
        }

        return () => {
            eventEmitter.endSession();
        };
    }, [isAuthenticated]);

    if (isLoading) {
        return (
            <div className="loading-screen" style={{
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#0A0E27'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner"></div>
                    <p>Loading your library...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthPage />;
    }

    const handleSelectBook = (bookId: string) => {
        console.log('[DEBUG] Selecting book:', bookId);
        const book = audiobooksData.books.find((b: any) => b.id === bookId);
        console.log('[DEBUG] Found book:', book);
        if (book) {
            setSelectedBook(book as Audiobook);
            setCurrentAudioUrl(book.audioUrl);
            setCurrentView('bookDetail');
            console.log('[DEBUG] Changed view to bookDetail');
        } else {
            console.error('[ERROR] Book not found:', bookId);
        }
    };

    const handlePlayBook = () => {
        console.log('[DEBUG] Playing book:', selectedBook?.title);
        if (selectedBook) {
            eventEmitter.refreshSession();
            setCurrentChapterIndex(0);
            setCurrentView('player');
        }
    };

    const handleBackToLibrary = () => {
        setCurrentView('library');
        setSelectedBook(null);
    };

    const handleBackToDetail = () => {
        setCurrentView('bookDetail');
    };

    const handleChapterClick = (index: number, startTime: number, audioUrl?: string) => {
        if (audioUrl) {
            setCurrentAudioUrl(audioUrl);
        }
        setCurrentChapterIndex(index);
        setSeekToTime(startTime);

        eventEmitter.refreshSession();

        setTimeout(() => setSeekToTime(undefined), 100);
    };

    const handleNextChapter = () => {
        if (selectedBook && currentChapterIndex < selectedBook.chapters.length - 1) {
            const nextIndex = currentChapterIndex + 1;
            const nextChapter = selectedBook.chapters[nextIndex];
            handleChapterClick(nextIndex, nextChapter.startTime, nextChapter.audioUrl);
        }
    };

    const handlePreviousChapter = () => {
        if (selectedBook && currentChapterIndex > 0) {
            const prevIndex = currentChapterIndex - 1;
            const prevChapter = selectedBook.chapters[prevIndex];
            handleChapterClick(prevIndex, prevChapter.startTime, prevChapter.audioUrl);
        }
    };

    const handleDurationChange = (durationInSeconds: number) => {
        if (!selectedBook) return;
        const mins = Math.floor(durationInSeconds / 60);
        const secs = Math.floor(durationInSeconds % 60);
        const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

        const chapterId = selectedBook.chapters[currentChapterIndex].id;
        const key = `${selectedBook.id}-${chapterId}`;

        if (discoveredDurations[key] !== durationStr) {
            setDiscoveredDurations(prev => ({
                ...prev,
                [key]: durationStr
            }));
        }
    };

    const handleToggleResearchDashboard = () => {
        setShowResearchDashboard(!showResearchDashboard);
    };

    return (
        <div className="app-container">
            {/* Header with Logout */}
            <div className="app-header-auth" style={{
                position: 'fixed',
                top: 0,
                right: 0,
                padding: '10px 20px',
                zIndex: 1000,
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
            }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                    Hello, {user?.username || 'User'}
                </span>
                <button
                    onClick={() => logout()}
                    style={{
                        background: 'rgba(0,0,0,0.05)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600
                    }}
                >
                    Sign Out
                </button>
            </div>

            {/* Library View */}
            {currentView === 'library' && (
                <BookLibrary
                    onSelectBook={handleSelectBook}
                    onToggleResearchDashboard={handleToggleResearchDashboard}
                />
            )}

            {/* Main Content Area (Detail or Player) */}
            {(currentView === 'bookDetail' || currentView === 'player') && (
                <>
                    <aside className={`research-dashboard-panel ${showResearchDashboard ? 'visible' : ''}`}>
                        <div className="research-toggle-wrapper">
                            <button
                                className="research-toggle-fab"
                                onClick={handleToggleResearchDashboard}
                                aria-label={showResearchDashboard ? "Hide Dashboard" : "Show Dashboard"}
                            >
                                {showResearchDashboard ? '✕' : '📊'}
                            </button>
                        </div>
                        <ResearchDashboard />
                    </aside>

                    {/* Book Detail View */}
                    {currentView === 'bookDetail' && selectedBook && (
                        <BookDetail
                            book={selectedBook}
                            progress={userProgress[selectedBook.id]}
                            onPlay={handlePlayBook}
                            onBack={handleBackToLibrary}
                        />
                    )}

                    {/* Player View */}
                    {currentView === 'player' && selectedBook && (
                        <div className="player-view">
                            <button className="back-button" onClick={handleBackToDetail}>
                                ← Back to Book
                            </button>

                            <div className="player-content">
                                <div className="player-book-info">
                                    <img src={selectedBook.coverUrl} alt={selectedBook.title} className="player-cover" />
                                    <h1>{selectedBook.title}</h1>
                                    <p>{selectedBook.author}</p>
                                    <p className="narrator">Narrated by {selectedBook.narrator}</p>
                                </div>

                                <AudioPlayer
                                    audioSrc={currentAudioUrl || selectedBook.audioUrl}
                                    sectionId={`${selectedBook.id}-${selectedBook.chapters[currentChapterIndex].id}`}
                                    sectionTitle={`${selectedBook.title} - ${selectedBook.chapters[currentChapterIndex].title}`}
                                    onSeekToTime={seekToTime}
                                    onNextChapter={handleNextChapter}
                                    onPreviousChapter={handlePreviousChapter}
                                    onDurationChange={handleDurationChange}
                                />

                                {/* Chapter List */}
                                <div className="player-chapters">
                                    <h2>Chapters</h2>
                                    <div className="chapters-list">
                                        {selectedBook.chapters.map((chapter, index) => (
                                            <button
                                                key={chapter.id}
                                                className={`chapter-item ${index === currentChapterIndex ? 'active' : ''}`}
                                                onClick={() => handleChapterClick(index, chapter.startTime, chapter.audioUrl)}
                                                aria-label={`Jump to ${chapter.title}`}
                                            >
                                                <span className="chapter-number">{index + 1}</span>
                                                <span className="chapter-title">{chapter.title}</span>
                                                <span className="chapter-duration">
                                                    {discoveredDurations[`${selectedBook.id}-${chapter.id}`] || chapter.duration}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default App;
