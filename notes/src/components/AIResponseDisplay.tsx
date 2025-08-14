// components/AISummaryDisplay.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './auth/AuthProvider';
import type { AISummary, AITaskExtraction } from '../utils/notesFirestore';
import { getUserAISummaries, deleteExpiredAISummaries, deleteAISummary } from '../utils/notesFirestore';
import { getUserAITaskExtractions, deleteAITaskExtraction, deleteExpiredAITaskExtractions } from '../utils/notesFirestore';
import CreateListFromExtraction from '../utils/CreateListFromExtraction';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined';
import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';

export default function AISummaryDisplay({ noteId }: { noteId: string | null }) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [summaries, setSummaries] = useState<AISummary[]>([]);
    const [loading, setLoading] = useState(false);
    const summariesEndRef = useRef<HTMLDivElement | null>(null);
    const [taskExtractions, setTaskExtractions] = useState<AITaskExtraction[]>([]);
    const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean[]>>({});

    const cleanFont = {
        fontFamily: "'Nunito Sans', sans-serif",
    };

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

    // Load task extractions when component mounts or opens
    useEffect(() => {
        if (user && isOpen) {
            loadTaskExtractions();
        }
    }, [user, isOpen]);

    const loadTaskExtractions = async () => {
        if (!user) return;
        await deleteExpiredAITaskExtractions(user.uid);
        const userTasks = await getUserAITaskExtractions(user.uid);
        setTaskExtractions(userTasks);
    };

    // When taskExtractions change, initialize checkedTasks state
    useEffect(() => {
        const initialChecked: { [extractionId: string]: boolean[] } = {};
        taskExtractions.forEach(extraction => {
            const extractionId = extraction.id !== undefined ? String(extraction.id) : '';
            initialChecked[extractionId] = Array.isArray(extraction.tasks)
                ? extraction.tasks.map(() => false)
                : [];
        });
        setCheckedTasks(initialChecked);
    }, [taskExtractions]);

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
                        backgroundColor: '#f7b801',
                        color: '#000',
                        border: 'none',
                        borderRadius: isOpen ? '8px 0 0 8px' : '8px 0 0 8px',
                        padding: '12px 20px 12px 16px',
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
                        <AutoAwesomeIcon style={{ fontSize: '18px' }} />
                        <span>AI Responses</span>
                    </div>
                    {isOpen ? (
                        <ArrowForwardIosOutlinedIcon style={{ fontSize: '16px' }} />
                    ) : (
                        <ArrowBackIosNewOutlinedIcon style={{ fontSize: '16px' }} />
                    )}
                </button>
            </motion.div>

            {/* Summary Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: 300, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 300, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{
                            position: 'fixed',
                            bottom: '0px',
                            right: '0px',
                            width: '340px',
                            maxHeight: '60vh',
                            backgroundColor: 'rgba(255, 255, 255, 0.6)',
                            borderRadius: '25px',
                            zIndex: 999,
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '-4px 4px 16px rgba(0,0,0,0.13)',
                            overflow: 'hidden',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: '12px 0px',
                                backgroundColor: 'rgb(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderBottom: 'none',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '25px',
                                    marginLeft: '20px'
                                }}
                            >
                                <h3 style={{ margin: 0, marginLeft: '8px', fontSize: '16px', color: '#000', ...cleanFont, fontWeight: '700' }}>Responses</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#000',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    marginRight: '20px',
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
                                position: 'relative',
                            }}
                        >
                            {/* Background gradient with opacity */}
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    zIndex: 0,
                                    pointerEvents: 'none',
                                    backgroundImage: "linear-gradient(to left top, #fefae0, #fdf8dc, #fcf5d9, #fcf3d5, #fbf0d2, #faebc7, #f9e7bc, #f8e2b1, #f7d99c, #f6d088, #f6c774, #f6bd60)",
                                    opacity: 0,
                                }}
                            />
                            {/* Content goes here */}

                            <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}></div>
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
                                    No summaries are found.<br />
                                </div>
                            ) : (
                                <div style={{ padding: '20px 10px', paddingBottom: '0px', flex: 1 }}>
                                    {filteredSummaries.map((summary, index) => (
                                        <motion.div
                                            key={summary.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            style={{
                                                marginBottom: '16px',
                                                padding: '16px',
                                                backgroundColor: 'rgb(231, 236, 239, 0.1)',
                                                marginLeft: '16px',
                                                marginRight: '16px',
                                                borderRadius: '25px',
                                                border: '1px solid #e0e0e0',
                                                position: 'relative',
                                                backdropFilter: 'blur(1px)',
                                                WebkitBackdropFilter: 'blur(1px)',
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
                                                className="summary-content"
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
                                                    fontSize: '10px',
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

                            {/* Extracted Tasks */}
                            <div style={{ padding: '20px 10px', margin: '0 auto', flex: 1 }}>
                                {/* <h4 style={{ margin: '10px 0 6px 0', fontWeight: 700, fontSize: '15px', color: '#333' }}>Extracted Tasks</h4> */}
                                {taskExtractions.length === 0 ? (
                                    <div style={{ color: '#888', fontSize: '13px', marginBottom: 12, marginLeft: 4 }}>No extracted tasks found.</div>
                                ) : (
                                    taskExtractions.map((extraction, idx) => (
                                        <motion.div
                                            key={extraction.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            style={{
                                                marginLeft: '16px',
                                                marginRight: '16px',
                                                marginBottom: '16px',
                                                padding: '16px',
                                                backgroundColor: 'rgb(231, 236, 239, 0.1)',
                                                borderRadius: '18px',
                                                border: '1px solid #e0e0e0',
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 15 }}>{extraction.noteTitle || 'Untitled Note'}</div>
                                            <ul style={{ margin: 0, paddingLeft: 12 }}>
                                                {extraction.tasks.map((task, i) => (
                                                    <li
                                                        key={i}
                                                        style={{
                                                            fontSize: '13px',
                                                            marginBottom: 6,
                                                            lineHeight: 1.5,
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            style={{ marginTop: 5, marginRight: 8 }}
                                                            checked={checkedTasks[String(extraction.id)]?.[i] || false}
                                                            onChange={() => {
                                                                setCheckedTasks(prev => ({
                                                                    ...prev,
                                                                    [String(extraction.id)]: prev[String(extraction.id)]?.map((val, idx) =>
                                                                        idx === i ? !val : val
                                                                    ),
                                                                }));
                                                            }}
                                                        />
                                                        <div>
                                                            {typeof task === 'string' ? (
                                                                task
                                                            ) : (
                                                                <>
                                                                    <span style={{ fontWeight: 500 }}>{task.task}</span>
                                                                    {task.priority && (
                                                                        <span
                                                                            style={{
                                                                                marginLeft: 6,
                                                                                padding: '2px 8px',
                                                                                borderRadius: '8px',
                                                                                fontSize: '11px',
                                                                                fontWeight: 600,
                                                                                backgroundColor:
                                                                                    task.priority === "high"
                                                                                        ? "#fee2e2"
                                                                                        : task.priority === "medium"
                                                                                            ? "#fef9c3"
                                                                                            : task.priority === "low"
                                                                                                ? "#dcfce7"
                                                                                                : "#eee",
                                                                                color:
                                                                                    task.priority === "high"
                                                                                        ? "#b91c1c"
                                                                                        : task.priority === "medium"
                                                                                            ? "#b45309"
                                                                                            : task.priority === "low"
                                                                                                ? "#166534"
                                                                                                : "#333",
                                                                                marginRight: 4,
                                                                            }}
                                                                        >
                                                                            {task.priority}
                                                                        </span>
                                                                    )}
                                                                    {task.dueDate && (
                                                                        <span style={{ color: '#7a6c4d', marginLeft: 4 }}> due: {task.dueDate}</span>
                                                                    )}
                                                                    {task.tags && Array.isArray(task.tags) && task.tags.length > 0 && (
                                                                        <span style={{ marginLeft: 6 }}>
                                                                            {task.tags.map((tag, idx) => (
                                                                                <span
                                                                                    key={idx}
                                                                                    style={{
                                                                                        background: '#f6bd60',
                                                                                        color: '#232323',
                                                                                        borderRadius: '8px',
                                                                                        padding: '1px 7px',
                                                                                        fontSize: '11px',
                                                                                        marginRight: 4,
                                                                                        fontWeight: 500,
                                                                                    }}
                                                                                >
                                                                                    {tag}
                                                                                </span>
                                                                            ))}
                                                                        </span>
                                                                    )}
                                                                    {task.description && (
                                                                        <div style={{ color: '#555', fontSize: '12px', marginTop: 2, marginLeft: 2 }}>
                                                                            {task.description}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                            {user && (
                                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                                                    <CreateListFromExtraction
                                                        userId={user.uid}
                                                        extraction={{ ...extraction, id: extraction.id ?? '' }}
                                                        checked={checkedTasks[String(extraction.id)] || []}
                                                        setChecked={checkedArr => setCheckedTasks(prev => ({
                                                            ...prev,
                                                            [String(extraction.id)]: checkedArr,
                                                        }))}
                                                    />
                                                </div>
                                            )}
                                            <div style={{ fontSize: '10px', color: '#888', marginTop: 15 }}>
                                                {extraction.createdAt && typeof extraction.createdAt.toDate === 'function'
                                                    ? extraction.createdAt.toDate().toLocaleString()
                                                    : ''}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}