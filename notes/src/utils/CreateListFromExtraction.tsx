import React, { useState } from 'react';
import NewListModal from '../components/NewListModal';
import { Tag } from '../types/todo';

import { createToDoList, ChecklistItem, getUserTags, createUserTag, updateUserStats } from '../utils/notesFirestore';
import { increment } from "firebase/firestore";

import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface Extraction {
    id: string;
    noteTitle: string;
    tasks: any[];
}

interface CreateListFromExtractionProps {
    userId: string;
    extraction: Extraction;
    checked: boolean[];
    onListCreated?: () => void;
    setChecked: (checked: boolean[]) => void;
}

const CreateListFromExtraction: React.FC<CreateListFromExtractionProps> = ({
    userId,
    extraction,
    checked,
    onListCreated,
    setChecked,
}) => {
    const [showModal, setShowModal] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showCreatedOverlay, setShowCreatedOverlay] = useState(false);

    const handleCreateList = async () => {
        const selectedTasks: ChecklistItem[] = extraction.tasks
            .map((task, idx) => (checked[idx] ? task : null))
            .filter(Boolean)
            .map(task => {
                const item: ChecklistItem = {
                    id: crypto.randomUUID(),
                    task: typeof task === 'string' ? task : task.task,
                    completed: false,
                };
                if (typeof task !== 'string') {
                    if (task.priority) item.priority = task.priority;
                    if (task.dueDate) item.dueDate = task.dueDate;
                    if (task.description) item.description = task.description;
                }
                return item;
            });

        // --- TAG LOGIC START ---
        // 1. Collect all unique tag names from selected tasks
        const tagNames = new Set<string>();
        extraction.tasks.forEach((task, idx) => {
            if (checked[idx] && typeof task !== 'string' && Array.isArray(task.tags)) {
                task.tags.forEach((tag: string) => tagNames.add(tag));
            }
        });

        let tagsToAdd: Tag[] = [];
        if (tagNames.size > 0) {
            // 2. Fetch user's existing tags
            const existingTags = await getUserTags(userId);
            const existingTagNames = new Set(existingTags.map(tag => tag.name));
            // 3. For each tag name, create if not exists
            for (const tagName of tagNames) {
                let tag = existingTags.find(t => t.name === tagName);
                if (!tag) {
                    // Pick a random color or use a default
                    const COLORS = ['#ffb703', '#c1121f', '#ffafcc', '#c8b6ff', '#a2d2ff', '#219ebc', '#52b788'];
                    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                    tag = await createUserTag(userId, { name: tagName, color });
                }
                tagsToAdd.push(tag);
            }
        }
        // --- TAG LOGIC END ---

        if (selectedTasks.length === 0) {
            alert('Please select at least one task.');
            return;
        }
        setIsCreating(true);
        try {
            await createToDoList(userId, {
                title: newListTitle || 'New List',
                items: selectedTasks,
                tags: tagsToAdd,
            });
            // --- Update user stats for created tasks and priorities ---
            if (selectedTasks.length > 0 && userId) {
                const prioCounts = { low: 0, medium: 0, high: 0 };
                selectedTasks.forEach(task => {
                    const prio = (task.priority || 'medium') as 'low' | 'medium' | 'high';
                    prioCounts[prio]++;
                });

                const statsUpdate: any = {
                    'taskStats.created': increment(selectedTasks.length),
                };
                Object.entries(prioCounts).forEach(([prio, count]) => {
                    if (count > 0) {
                        statsUpdate[`priorityCounts.${prio}`] = increment(count);
                    }
                });

                await updateUserStats(userId, statsUpdate);
            }
            setShowModal(false);
            setNewListTitle('');
            setChecked(Array(extraction.tasks.length).fill(false)); // Unselect all checkboxes
            setShowCreatedOverlay(true); // Show overlay
            setTimeout(() => setShowCreatedOverlay(false), 2000); // Hide after 2s
            if (onListCreated) onListCreated();
        } catch (err) {
            console.error('Failed to create list:', err);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            <button
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    marginTop: 8,
                    marginBottom: 8,
                }}
                disabled={!checked.some(Boolean)}
                onClick={() => setShowModal(true)}
            >
                Create List from Selected
            </button>
            <NewListModal
                open={showModal}
                value={newListTitle}
                isCreating={isCreating}
                onChange={setNewListTitle}
                onCancel={() => {
                    setShowModal(false);
                    setNewListTitle('');
                }}
                onCreate={handleCreateList}
            />
            {/* Overlay for in-progress and created */}
            {(isCreating || showCreatedOverlay) && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.18)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto',
                        transition: 'opacity 0.4s',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                    }}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: 16,
                            padding: '32px 48px',
                            // boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: 220,
                        }}
                    >
                        {isCreating ? (
                            <>
                                <CircularProgress size={38} style={{ marginBottom: 18, color: '#2563eb' }} />
                                <div style={{ fontWeight: 700, fontSize: 18, color: '#2563eb' }}>Creating List...</div>
                            </>
                        ) : (
                            <>
                                <CheckCircleOutlineIcon style={{ color: '#22c55e', fontSize: 44, marginBottom: 10 }} />
                                <div style={{ fontWeight: 700, fontSize: 18, color: '#22c55e' }}>List Created</div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default CreateListFromExtraction;