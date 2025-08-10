// components/AISummaryDisplay.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './auth/AuthProvider';
import type { AISummary } from '../utils/notesFirestore';
import { getUserAISummaries, deleteExpiredAISummaries, deleteAISummary } from '../utils/notesFirestore';

import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export default function AISummaryDisplay({ noteId }: { noteId: string | null }) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [summaries, setSummaries] = useState<AISummary[]>([]);
    const [loading, setLoading] = useState(false);
    const summariesEndRef = useRef<HTMLDivElement | null>(null);

    // Load summaries when component mounts or opens
    useEffect(() => {
        if (user && isOpen) {
            loadSummaries();
        }
    }, [user, isOpen]);

    // Auto-scroll to bottom when summaries change
    useEffect(() => {
        if (summariesEndRef.current && isOpen) {
            setTimeout(() => {
                summariesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [summaries, isOpen]);

    const loadSummaries = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Clean up expired summaries first
            await deleteExpiredAISummaries(user.uid);
            // Then load current summaries
            const userSummaries = await getUserAISummaries(user.uid);
            setSummaries(userSummaries);
        } catch (error) {
            console.error('Error loading AI summaries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSummary = async (summaryId) => {
        if (!user) return;

        try {
            await deleteAISummary(user.uid, summaryId);
            setSummaries(prev => prev.filter(s => s.id !== summaryId));
        } catch (error) {
            console.error('Error deleting summary:', error);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDaysUntilExpiry = (createdAt: any) => {
        if (!createdAt) return 0;
        const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        const expiry = new Date(created);
        expiry.setDate(expiry.getDate() + 3);
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    // After fetching summaries, filter by noteId
    const filteredSummaries = noteId
        ? summaries.filter(s => s.noteId === noteId)
        : [];

    return (
        <>
            {/* Floating Tab Button */}
            <motion.div
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: isOpen ? '320px' : '-10px', // stick out more
                    zIndex: 1000,
                    transition: 'right 0.3s ease',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        backgroundColor: '#606c38',
                        color: 'white',
                        border: 'none',
                        borderRadius: isOpen ? '8px 0 0 8px' : '8px 0 0 8px',
                        padding: '12px 8px 12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minWidth: '100px',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <SmartToyIcon style={{ fontSize: '18px' }} />
                        <span>AI Logs</span>
                    </div>
                    {isOpen ? (
                        <KeyboardArrowDownIcon style={{ fontSize: '16px' }} />
                    ) : (
                        <KeyboardArrowUpIcon style={{ fontSize: '16px' }} />
                    )}
                </button>
            </motion.div>

            {/* Summary Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{
                            position: 'fixed',
                            top: '0',
                            right: '0',
                            width: '320px',
                            height: '100vh',
                            backgroundColor: '#f8f9fa',
                            borderLeft: '1px solid #e0e0e0',
                            zIndex: 999,
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: '20px',
                                backgroundColor: '#606c38',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <SmartToyIcon />
                                <h3 style={{ margin: 0, fontSize: '16px' }}>AI Summary Logs</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                }}
                            >
                                <CloseIcon style={{ fontSize: '20px' }} />
                            </button>
                        </div>

                        {/* Content */}
                        <div
                            style={{
                                flex: 1,
                                padding: '0',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {loading ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100px',
                                        color: '#666',
                                    }}
                                >
                                    Loading summaries...
                                </div>
                            ) : filteredSummaries.length === 0 ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100px',
                                        color: '#666',
                                        textAlign: 'center',
                                        padding: '20px',
                                    }}
                                >
                                    No AI summaries yet.<br />
                                    Create your first summary to see it here!
                                </div>
                            ) : (
                                <div style={{ padding: '16px 0', flex: 1 }}>
                                    {filteredSummaries.map((summary, index) => (
                                        <motion.div
                                            key={summary.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            style={{
                                                marginBottom: '16px',
                                                padding: '16px',
                                                backgroundColor: 'white',
                                                marginLeft: '16px',
                                                marginRight: '16px',
                                                borderRadius: '8px',
                                                border: '1px solid #e0e0e0',
                                                position: 'relative',
                                            }}
                                        >
                                            {/* Header */}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                <div style={{ flex: 1, marginRight: '8px' }}>
                                                    <h4
                                                        style={{
                                                            margin: 0,
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            color: '#333',
                                                            lineHeight: '1.3',
                                                        }}
                                                    >
                                                        {summary.noteTitle || 'Untitled Note'}
                                                    </h4>
                                                    <div
                                                        style={{
                                                            fontSize: '12px',
                                                            color: '#666',
                                                            marginTop: '4px',
                                                        }}
                                                    >
                                                        {formatDate(summary.createdAt)}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteSummary(summary.id)}
                                                    className="delete-summary-btn"
                                                    style={{
                                                        backgroundColor: 'transparent',
                                                        border: 'none',
                                                        color: '#999',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        borderRadius: '4px',
                                                    }}
                                                >
                                                    <DeleteIcon style={{ fontSize: '16px' }} />
                                                </button>
                                            </div>

                                            {/* Summary Content */}
                                            <div
                                                style={{
                                                    fontSize: '13px',
                                                    lineHeight: '1.4',
                                                    color: '#444',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                }}
                                                dangerouslySetInnerHTML={{ __html: summary.summaryContent }}
                                            />

                                            {/* Expiry indicator */}
                                            <div
                                                style={{
                                                    marginTop: '8px',
                                                    fontSize: '11px',
                                                    color: '#888',
                                                    fontStyle: 'italic',
                                                }}
                                            >
                                                Expires in {getDaysUntilExpiry(summary.createdAt)} days
                                            </div>
                                        </motion.div>
                                    ))}
                                    <div ref={summariesEndRef} />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}