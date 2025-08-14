import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { useNavigate } from "react-router-dom";

import { getUserToDoLists, createToDoList, updateToDoList, deleteToDoList, getUserStats, updateUserStats, createUserTag, getUserTags, deleteUserTag } from '../utils/notesFirestore';
import type { ToDoListData, ChecklistItem, Tag } from '../types/todo';
import TodoList from '../components/ToDoList';
import CalendarHeatMap from '../components/CalendarHeatMap';
import PressableButton from '../components/PressableButton';
import { getPriorityCompletionData } from '../utils/GetPrioCompletionStats';
import { getCurrentStreak, getActivityData } from '../utils/activityTracker';

import { Tooltip as ReactTooltip } from 'react-tooltip';
import { Bar } from 'react-chartjs-2';

// MUI imports
import { PieChart } from '@mui/x-charts/PieChart';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

import {
    Calendar,
    ChevronDown,
    ChevronUp,
    Plus,
    Settings,
    LogOut,
    Clock,
    CalendarDays,
    LayoutGrid,
    ExternalLink,
    X
} from 'lucide-react';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';

function unflattenStats(flat: any) {
    const stats: any = { priorityCounts: {}, taskStats: {}, overdueStats: {} };
    for (const key in flat) {
        if (key.startsWith('priorityCounts.')) {
            const sub = key.split('.')[1];
            stats.priorityCounts[sub] = flat[key];
        } else if (key.startsWith('taskStats.')) {
            // Handle flat keys like 'taskStats.created' and 'taskStats.completed'
            const parts = key.split('.');
            if (parts.length === 2) {
                stats.taskStats[parts[1]] = flat[key];
            } else if (parts.length === 3) {
                // legacy: date-based stats, ignore or migrate if needed
                // Optionally: migrate to flat here
            }
        } else if (key.startsWith('overdueStats.')) {
            const sub = key.split('.')[1];
            stats.overdueStats[sub] = flat[key];
        } else {
            stats[key] = flat[key];
        }
    }
    return stats;
}

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [lists, setLists] = useState<ToDoListData[]>([]);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('overview');
    const [showAllLists, setShowAllLists] = useState(false);
    const [showNewListModal, setShowNewListModal] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [listToDelete, setListToDelete] = useState<{ id: string, title: string } | null>(null);
    const [stats, setStats] = useState<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState(250);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [tags, setTags] = useState<Tag[]>([]);
    const [showTagModal, setShowTagModal] = useState(false);
    const [activeTag, setActiveTag] = useState<Tag | null>(null);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#ffafcc');

    const cleanFont = {
        fontFamily: "'Nunito Sans', sans-serif",
    };

    const glassStyle = {
        backgroundColor: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '-4px 4px 16px rgba(0,0,0,0.13)',
        border: '1px solid #e0e0e0',
        borderRadius: '25px',
    };

    // Responsive size for the list container
    type ListType = { id: string; name: string; color: string; count: number };
    const [selectedList, setSelectedList] = useState<ListType | null>(null);

    useEffect(() => {
        function handleResize() {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                setSize(Math.max(150, Math.min(width, 350))); // min 150, max 350
            }
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Get all tasks from all lists
    const getAllTasks = () => {
        return lists.flatMap(list =>
            list.items.map(item => ({
                ...item,
                listId: list.id,
                listTitle: list.title
            }))
        );
    };

    // Helper to get YYYY-MM-DD string in local time
    function getLocalDateString(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const todayStr = getLocalDateString(new Date());
    const weekFromTodayStr = getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    // Get tasks due today
    const getTodayTasks = () => {
        return getAllTasks().filter(task =>
            task.dueDate &&
            !task.completed &&
            task.dueDate === todayStr
        );
    };

    // Get tasks due this week (including today)
    const getUpcomingTasks = () => {
        return getAllTasks().filter(task => {
            if (!task.dueDate || task.completed) return false;
            return task.dueDate > todayStr && task.dueDate <= weekFromTodayStr;
        }).sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
    };

    // Get overdue tasks
    const getOverdueTasks = () => {
        const todayStr = getLocalDateString(new Date());
        return getAllTasks().filter(task =>
            task.dueDate &&
            !task.completed &&
            task.dueDate < todayStr // Only dates strictly before today
        );
    };

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        getUserToDoLists(user.uid).then(fetchedLists => {
            const validLists = fetchedLists
                .filter(list => typeof list.id === 'string')
                .map(list => ({ ...list, id: list.id as string }));
            setLists(validLists);
            setLoading(false);
        });
    }, [user]);

    useEffect(() => {
        if (!user) return;
        getUserStats(user.uid).then(rawStats => {
            setStats(unflattenStats(rawStats || {}));
        });
    }, [user, lists]);

    useEffect(() => {
        if (!user) return;
        getActivityData(user).then(activityData => {
            setCurrentStreak(getCurrentStreak(activityData));
        });
    }, [user]);

    // --- 1. TAG BUTTON LOGIC ---
    // In renderSidebar, update the tag button onClick:
    const filteredLists = activeView === 'all-lists' && activeTag
        ? lists.filter(list => list.tags?.some(tag => tag.id === activeTag.id))
        : lists;

    const displayedLists = showAllLists ? filteredLists : filteredLists.slice(0, 3);
    const hasMoreLists = lists.length > 3;

    const handleAddList = async () => {
        if (!user || !newListTitle.trim()) return;

        setIsCreatingList(true);
        try {
            const docRef = await createToDoList(user.uid, newListTitle.trim());
            setLists(prev => [...prev, { id: docRef.id, title: newListTitle.trim(), items: [] }]);
            setNewListTitle('');
            setShowNewListModal(false);
        } catch (error) {
            console.error('Error creating list:', error);
        } finally {
            setIsCreatingList(false);
        }
    };

    const handleDeleteList = async (listId: string) => {
        if (!user) return;
        await deleteToDoList(user.uid, listId);
        setLists(prev => prev.filter(list => list.id !== listId));
        if (selectedListId === listId) setSelectedListId(null);
    };

    const handleListItemsChange = async (listId: string, newItems: ChecklistItem[]) => {
        if (!user) return;
        await updateToDoList(user.uid, listId, { items: newItems });
        setLists(prev =>
            prev.map(list =>
                list.id === listId ? { ...list, items: newItems } : list
            )
        );
    };

    const handleListTagsChange = async (listId: string, newTags: Tag[]) => {
        if (!user) return;
        await updateToDoList(user.uid, listId, { tags: newTags });
        setLists(prev =>
            prev.map(list =>
                list.id === listId ? { ...list, tags: newTags } : list
            )
        );
    };

    // Handle task completion for today/upcoming views
    const handleTaskToggle = async (taskId: string, listId: string) => {
        const list = lists.find(l => l.id === listId);
        if (!list) return;

        const updatedItems = list.items.map(item =>
            item.id === taskId ? { ...item, completed: !item.completed } : item
        );

        await handleListItemsChange(listId, updatedItems);
    };

    // Handle task deletion for today/upcoming views
    const handleTaskDelete = async (taskId: string, listId: string) => {
        const list = lists.find(l => l.id === listId);
        if (!list) return;

        const updatedItems = list.items.filter(item => item.id !== taskId);
        await handleListItemsChange(listId, updatedItems);
    };

    // New List Modal Component
    const NewListModal = () => (
        showNewListModal && (
            <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(2px)',
                }}
            >
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2
                            className="text-xl font-semibold text-gray-900"
                            style={{
                                ...cleanFont,
                                color: 'black',
                                fontWeight: '900'
                            }}
                        >
                            New List
                        </h2>
                        <button
                            onClick={() => {
                                setShowNewListModal(false);
                                setNewListTitle('');
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
                            placeholder="Enter list name..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => {
                                setShowNewListModal(false);
                                setNewListTitle('');
                            }}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddList}
                            disabled={!newListTitle.trim() || isCreatingList}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreatingList ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        )
    );

    // Delete List Modal Component
    const DeleteListModal = ({ open, onCancel, onConfirm, listTitle }: { open: boolean, onCancel: () => void, onConfirm: () => void, listTitle: string }) => (
        open && (
            <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(2px)',
                    ...cleanFont
                }}
            >
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2
                            className="text-xl font-semibold text-gray-900"
                            style={{ fontWeight: '900', ...cleanFont, color: 'black' }}
                        >
                            Delete List
                        </h2>
                    </div>
                    <div className="mb-4 text-gray-700">
                        Are you sure you want to delete <span className="font-bold">{listTitle}</span>? This action cannot be undone.
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            style={{ cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            style={{ cursor: 'pointer' }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        )
    );

    // Task Component for Today/Upcoming views
    const TaskCard = ({ task, showListTitle = false }: { task: any; showListTitle?: boolean }) => (
        <div className="bg-white p-4 rounded-xl border border-gray-200 upper-layer">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleTaskToggle(task.id, task.listId)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-10"
                    />
                    <div className="flex-1">
                        <span className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-900'} font-medium`}>
                            {task.task}
                        </span>
                        {showListTitle && (
                            <p className="text-md text-gray-500 mt-0">From: {task.listTitle}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-1">
                    {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                </div>

                <div className="flex items-center gap-10">
                    {task.priority && (
                        <span className={`px-4 py-2 text-sm font-semibold rounded ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                            }`}>
                            {task.priority}
                        </span>
                    )}
                    {task.dueDate && (
                        <span className="text-md text-gray-500">
                            {(() => {
                                const [year, month, day] = task.dueDate.split('-');
                                return `${year}/${month}/${day}`;
                            })()}
                        </span>
                    )}
                    <button
                        onClick={() => handleTaskDelete(task.id, task.listId)}
                        className="text-gray-400 hover:text-red-500 p-3"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );

    const allTasks = getAllTasks();
    const { total, completed } = getPriorityCompletionData(allTasks);

    const barData = {
        labels: ['Low', 'Medium', 'High'],
        datasets: [
            {
                label: 'Completed',
                data: [completed.low, completed.medium, completed.high],
                backgroundColor: ['#d9ddbbff', '#b0c4b1', '#606c38'],
            },
            {
                label: 'Total Active Tasks',
                data: [total.low, total.medium, total.high],
                backgroundColor: ['#bdbdbd', '#bdbdbd', '#bdbdbd'],
            },
        ],
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            tooltip: { enabled: true },
        },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
    };

    useEffect(() => {
        if (!user) return;
        getUserTags(user.uid).then(setTags);
    }, [user]);

    const TAG_COLORS = ['#ffb703', '#c1121f', '#ffafcc', '#c8b6ff', '#a2d2ff', '#219ebc', '#52b788'];

    const TagModal = () => (
        showTagModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}>
                <div className="bg-white rounded-4xl p-6 w-full max-w-md mx-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="ml-1 text-xl font-semibold text-gray-900" style={{ ...cleanFont, fontWeight: '900' }}>New Tag</h2>
                        <button onClick={() => setShowTagModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                            <X className="w-5 h-5 text-gray-500" style={{ cursor: 'pointer' }} />
                        </button>
                    </div>
                    <div className="mb-4">
                        {/* <label className="block text-sm font-medium text-gray-700 mb-2">Tag Name</label> */}
                        <input
                            type="text"
                            value={newTagName}
                            onChange={e => setNewTagName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter tag name..."
                            autoFocus
                        />
                    </div>
                    <div className="mb-4">
                        {/* <label className="block text-sm font-medium text-gray-700 mb-2">Tag Color</label> */}
                        <div className="flex gap-2 flex-wrap ml-1">
                            {TAG_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`w-6 h-6 rounded-lg border-2 ${newTagColor === color ? 'border-blue-500' : 'border-gray-300'}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setNewTagColor(color)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end mt-3">
                        <button
                            onClick={() => {
                                setShowTagModal(false);
                                setNewTagName('');
                                setNewTagColor(TAG_COLORS[0]);
                            }}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-3xl hover:bg-gray-50"
                            style={{ cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateTag}
                            disabled={!newTagName.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-3xl hover:bg-blue-700 disabled:opacity-50"
                            style={{ cursor: 'pointer' }}
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div>
        )
    );

    const handleCreateTag = async () => {
        if (!user || !newTagName.trim()) return;
        try {
            const tag = await createUserTag(user.uid, { name: newTagName.trim(), color: newTagColor });
            setTags(prev => [...prev, tag]);
            setShowTagModal(false);
            setNewTagName('');
            setNewTagColor(TAG_COLORS[0]);
        } catch (error) {
            console.error('Error creating tag:', error);
        }
    };

    // Replace your handleRemoveTag with this:
    const handleRemoveTag = async (tagId: string) => {
        if (!user) return;
        // Remove tag from user's tags in Firestore
        await deleteUserTag(user.uid, tagId);
        // Remove tag from local state
        setTags(prev => prev.filter(tag => tag.id !== tagId));
        // Remove tag from all lists that use it
        const updatedLists = lists.map(list => {
            if (list.tags?.some(tag => tag.id === tagId)) {
                const newTags = (list.tags || []).filter(tag => tag.id !== tagId);
                updateToDoList(user.uid, list.id, { tags: newTags });
                return { ...list, tags: newTags };
            }
            return list;
        });
        setLists(updatedLists);
        // If the removed tag was the active filter, clear it
        if (activeTag?.id === tagId) setActiveTag(null);
    };

    const renderSidebar = () => (
        <div
            className="w-[23%] bg-[rgb(244,241,235)] h-screen flex flex-col sidebar-container"
            style={{ maxWidth: 340 }}
        >
            {/* Header */}
            <div className="p-6 border-b border-gray-300">
                <div className="flex items-center gap-3">
                    <PressableButton
                        onClick={() => navigate("/")}
                        className="key-effect hide-when-focus button-corner-anim"
                        aria-label="Go Home"
                        data-tooltip-id="home-tooltip"
                        data-tooltip-content="Go Home"
                        style={{
                            padding: '0.75rem',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            fontWeight: '500',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '35px',
                            marginRight: '1rem',
                            zIndex: 2
                        }}
                    >
                        <span className="corner-anim-span"></span>
                        <span className="button-content"><ArrowBackOutlinedIcon /></span>
                    </PressableButton>

                    <span
                        style={{
                            fontFamily: "'Nunito Sans', sans-serif",
                            fontWeight: 900,
                            fontStyle: 'italic',
                            fontSize: '2rem',
                            color: '#000',
                            letterSpacing: '0.03em',
                            marginLeft: '0rem',
                            marginRight: '1rem',
                            userSelect: 'none',
                        }}
                    >
                        notizen.
                    </span>
                </div>
            </div>

            {/* Search */}
            {/* <div className="p-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full pl-4 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>
            </div> */}

            {/* Navigation */}
            <div
                className="flex-1 px-4 overflow-y-auto"
                style={{
                    paddingTop: '1rem'
                }}
            >
                {/* Overview */}
                <div className="mb-6">
                    <button
                        onClick={() => setActiveView('overview')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeView === 'overview'
                            ? 'bg-[rgba(172,222,175,0.40)] text-[rgba(36,101,38,0.9)]'
                            : 'text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="font-medium">Overview</span>
                    </button>
                </div>

                {/* Tasks Section */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        TASKS
                    </h3>
                    <div className="space-y-1">
                        <button
                            onClick={() => setActiveView('upcoming')}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${activeView === 'upcoming'
                                ? 'bg-[rgba(172,222,175,0.40)] text-[rgba(36,101,38,0.9)]'
                                : 'text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4" />
                                <span>Upcoming</span>
                            </div>
                            <span
                                className={`text-xs px-2 py-1 rounded-full min-w-[2em] text-center inline-flex items-center justify-center ${getUpcomingTasks().length >= 1
                                    ? ''
                                    : 'bg-gray-200 text-gray-600'
                                    }`}
                                style={
                                    getUpcomingTasks().length >= 1
                                        ? { backgroundColor: '#fcbf49', color: '#232323' }
                                        : {}
                                }
                            >
                                {getUpcomingTasks().length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveView('today')}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${activeView === 'today'
                                ? 'bg-[rgba(172,222,175,0.40)] text-[rgba(36,101,38,0.9)]'
                                : 'text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <CalendarDays className="w-4 h-4" />
                                <span>Today</span>
                            </div>
                            <span
                                className={`text-xs px-2 py-1 rounded-full min-w-[2em] text-center inline-flex items-center justify-center ${getTodayTasks().length >= 1
                                    ? ''
                                    : 'bg-gray-200 text-gray-600'
                                    }`}
                                style={
                                    getTodayTasks().length >= 1
                                        ? { backgroundColor: '#fcbf49', color: '#232323' }
                                        : {}
                                }
                            >
                                {getTodayTasks().length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveView('calendar')}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${activeView === 'calendar'
                                ? 'bg-[rgba(172,222,175,0.40)] text-[rgba(36,101,38,0.9)]'
                                : 'text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            <span>Calendar</span>
                        </button>
                    </div>
                </div>

                {/* Lists Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            LISTS
                        </h3>
                        <button
                            onClick={() => setActiveView('all-lists')}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-sm pt-1 pb-2 pl-2 pr-2 transition-colors"
                            style={{ cursor: 'pointer' }}
                            data-tooltip-id="home-tooltip"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {displayedLists.map((list) => (
                            <button
                                key={list.id}
                                onClick={() => {
                                    setSelectedListId(list.id!);
                                    setActiveView('list');
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${selectedListId === list.id && activeView === 'list'
                                    ? 'bg-[rgba(172,222,175,0.40)] text-[rgba(36,101,38,0.9)]'
                                    : 'text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full bg-blue-400"
                                        style={{ backgroundColor: list.color || "#60a5fa" }}
                                    />
                                    <span>{list.title}</span>
                                </div>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full min-w-[2em] text-center inline-flex items-center justify-center ${list.items.length >= 1
                                        ? ''
                                        : 'bg-gray-200 text-gray-600'
                                        }`}
                                    style={
                                        list.items.length >= 1
                                            ? { backgroundColor: '#fcbf49', color: '#232323' }
                                            : {}
                                    }
                                >
                                    {list.items.length}
                                </span>
                            </button>
                        ))}
                        {hasMoreLists && (
                            <button
                                onClick={() => setShowAllLists(!showAllLists)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                {showAllLists ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                <span className="text-sm">
                                    {showAllLists ? 'Show less' : `Show ${lists.length - 3} more`}
                                </span>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowNewListModal(true)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-500 hover:bg-blue-200 transition-colors mt-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New List</span>
                    </button>
                </div>

                {/* Tags Section */}
                <div className="mb-6 pt-8 border-t border-gray-300">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        TAGS
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <div
                                key={tag.id}
                                className="relative group"
                            >
                                <button
                                    className={`px-2 py-1 text-xs rounded-full border ${activeTag?.id === tag.id ? 'border-blue-500' : 'border-gray-300'}`}
                                    style={{ backgroundColor: tag.color, color: '#232323' }}
                                    onClick={() => {
                                        if (activeTag?.id === tag.id) {
                                            setActiveTag(null);
                                            setActiveView('all-lists');
                                        } else {
                                            setActiveTag(tag);
                                            setActiveView('all-lists');
                                        }
                                    }}
                                >
                                    {tag.name}
                                </button>
                                {/* Remove icon, only visible on hover */}
                                <button
                                    className="absolute -top-2 -right-1 rounded-full pt-0 group-hover:block hidden bg-transparent"
                                    style={{ border: 'none', zIndex: 10 }}
                                    onClick={e => {
                                        e.stopPropagation();
                                        handleRemoveTag(tag.id);
                                    }}
                                    title="Remove tag"
                                >
                                    <RemoveCircleOutlineIcon fontSize="small" style={{ color: 'black', fontSize: '16px' }} />
                                </button>
                            </div>
                        ))}
                        <button
                            className="px-2 py-1 border border-dashed border-gray-300 text-gray-500 text-xs rounded-full hover:border-gray-400"
                            onClick={() => setShowTagModal(true)}
                        >
                            + Add Tag
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom actions */}
            {/* <div className="p-4 border-t border-gray-200">
                <div className="space-y-2">
                    <button
                        onClick={() => setActiveView('settings')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-100 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                    </button>
                </div>
            </div> */}

            <ReactTooltip id="home-tooltip" anchorSelect="[data-tooltip-id='home-tooltip']" />
        </div>
    );

    const renderMainContent = () => {
        const todayTasks = getTodayTasks();
        const upcomingTasks = getUpcomingTasks();

        return (
            <div className="w-[77%] flex flex-col h-screen main-content-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Header */}
                {!(activeView === 'list' && selectedListId) && (
                    <div
                        className=""
                        style={{
                            padding: '2rem 2rem',
                            ...cleanFont,
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h1
                                    className="text-2xl font-bold"
                                    style={{
                                        ...cleanFont,
                                        color: '#1F2937',
                                    }}
                                >
                                    {activeView === 'today' && 'Today'}
                                    {activeView === 'upcoming' && 'Upcoming'}
                                    {activeView === 'calendar' && 'Calendar'}
                                    {activeView === 'overview' && 'Overview'}
                                    {activeView === 'list' && selectedList?.name}
                                    {activeView === 'all-lists' && (
                                        activeTag
                                            ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <span
                                                        className="px-2 py-1 text-base rounded-full border border-blue-500"
                                                        style={{ backgroundColor: activeTag.color, color: '#232323' }}
                                                    >
                                                        {activeTag.name}
                                                    </span>
                                                    <span className="ml-2 text-lg font-normal text-gray-500">Lists</span>
                                                </span>
                                            )
                                            : 'All Lists'
                                    )}
                                    {activeView === 'settings' && 'Settings'}
                                </h1>
                                {activeView === 'today' && (
                                    <p className="text-gray-500 mt-1 ml-3">
                                        {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} due today
                                    </p>
                                )}
                                {activeView === 'upcoming' && (
                                    <p className="text-gray-500 mt-1 ml-3">
                                        {upcomingTasks.length} task{upcomingTasks.length !== 1 ? 's' : ''} due this week
                                    </p>
                                )}
                            </div>
                            {/* <button
                                onClick={() => setShowNewListModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add New List
                            </button> */}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div
                    className={`flex-1 p-10 overflow-y-auto rounded-3xl${activeView !== 'list' ? ' bg-gray-50 upper-layer' : ''}`}
                >
                    {activeView === 'today' && (
                        <div className="space-y-4">
                            {todayTasks.map((task) => (
                                <TaskCard key={`${task.listId}-${task.id}`} task={task} showListTitle={true} />
                            ))}
                            {todayTasks.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <Clock className="w-25 h-25 mx-auto mb-4 text-white" />
                                    <h3 className="text-lg font-medium mt-10 mb-2">No tasks due today</h3>
                                </div>
                            )}
                        </div>
                    )}

                    {activeView === 'upcoming' && (
                        <div className="space-y-4">
                            {upcomingTasks.map((task) => (
                                <TaskCard key={`${task.listId}-${task.id}`} task={task} showListTitle={true} />
                            ))}
                            {upcomingTasks.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <CalendarDays className="w-25 h-25 mx-auto mb-4 text-white" />
                                    <h3 className="text-lg font-medium mt-10 mb-2">You're all caught up for this week!</h3>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Overview metrics */}
                    {activeView === 'overview' && (
                        <div className="space-y-6">
                            {/* Overview Stats of Tasks and Lists */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-3xl col-span-3 flex flex-col md:flex-row justify-between items-center gap-8 upper-layer">
                                    <div className="flex flex-col items-center flex-1 border-r border-gray-300">
                                        <span className="text-sm text-gray-500 mb-1">Active Lists</span>
                                        <span className="text-3xl font-bold text-black">{lists.length}</span>
                                    </div>
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-sm text-gray-500 mb-1">Total Tasks</span>
                                        <span className="text-3xl font-bold text-black">{getAllTasks().length}</span>
                                    </div>
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-sm text-gray-500 mb-1">Due Today</span>
                                        <span className="text-3xl font-bold text-[#ffb703]">{todayTasks.length}</span>
                                    </div>
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-sm text-gray-500 mb-1">Overdue</span>
                                        <span className="text-3xl font-bold text-[#e63946]">{getOverdueTasks().length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Task Priority Distribution Pie Chart */}
                            {stats && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 rounded-3xl col-span-2 row-span-2 flex flex-col upper-layer">
                                        <h3
                                            className="text-lg font-semibold text-gray-900 mb-2"
                                            data-tooltip-id="priority-dist-tooltip"
                                            data-tooltip-content="Includes tasks from active and inactive lists"
                                        >
                                            Task Priority Distribution (All Time)
                                        </h3>
                                        <ReactTooltip
                                            id="priority-dist-tooltip"
                                            place="top"
                                            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, maxWidth: 220 }}
                                        />
                                        <div ref={containerRef} style={{ width: '100%', maxWidth: 1050, margin: '0 auto' }}>
                                            <PieChart
                                                series={[
                                                    {
                                                        data: [
                                                            { id: 0, value: stats.priorityCounts?.low ?? 0, label: 'Low', color: '#d9ddbbff' },
                                                            { id: 1, value: stats.priorityCounts?.medium ?? 0, label: 'Medium', color: '#b0c4b1' },
                                                            { id: 2, value: stats.priorityCounts?.high ?? 0, label: 'High', color: '#606c38' }
                                                        ],
                                                        innerRadius: 60,
                                                        outerRadius: 100,
                                                        paddingAngle: 2,
                                                        cornerRadius: 4,
                                                        // startAngle: -90,
                                                        // endAngle: 90,
                                                    }
                                                ]}
                                                width={size}
                                                height={size}
                                            />
                                            <div className="mt-5 flex justify-center items-center w-full">
                                                <div style={{ width: Math.max(520, Math.min(size, 850)), maxWidth: '100%', height: 300 }}>
                                                    <Bar data={barData} options={{ ...barOptions, maintainAspectRatio: false }} height={size * 0.5} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Streak and Task Completion */}
                                    <div className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col justify-center upper-layer">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Streak</h3>
                                        <div className='ml-3 gap-3 flex flex-row items-center'>
                                            <span className="text-3xl font-bold text-[#239a3b]">{currentStreak}</span>
                                            <span className="text-sm text-gray-500 mt-1">days</span>
                                        </div>
                                        <CalendarHeatMap />
                                        <ReactTooltip id="heatmap-tooltip" place="top" style={{ zIndex: 9999 }} />
                                    </div>
                                    <div
                                        className="p-6 rounded-3xl flex flex-col items-center upper-layer"
                                        style={{ minHeight: 250, maxHeight: 350, overflow: 'hidden' }}
                                    >
                                        <h3
                                            className="text-lg font-semibold text-gray-900 mb-2 self-start"
                                            data-tooltip-id="task-completion-tooltip"
                                            data-tooltip-content="Includes tasks from active and inactive lists"
                                        >
                                            Task Completion
                                        </h3>
                                        <ReactTooltip
                                            id="task-completion-tooltip"
                                            place="top"
                                            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, maxWidth: 220 }}
                                        />
                                        <ul className="ml-3 mb-0 self-start" style={{ fontSize: 13, }}>
                                            <li>
                                                Created: {stats.taskStats?.created ?? 0}
                                            </li>
                                            <li>
                                                Completed: {stats.taskStats?.completed ?? 0}
                                            </li>
                                            {/* <li>
                                                Percent Completed: {stats.taskStats?.created
                                                    ? `${Math.round((stats.taskStats?.completed ?? 0) / stats.taskStats.created * 100)}%`
                                                    : 'N/A'}
                                            </li> */}
                                        </ul>
                                        <div
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                margin: '2rem 0 0 0',
                                            }}
                                        >
                                            <div style={{ width: '100%', maxWidth: 180 }}>
                                                <div
                                                    style={{
                                                        background: '#e5e7eb',
                                                        borderRadius: 8,
                                                        height: 100,
                                                        width: '100%',
                                                        overflow: 'hidden',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            background: 'linear-gradient(90deg, #606c38 0%, #b0c4b1 70%, #e9edc9 100%)',
                                                            opacity: 0.8,
                                                            width: stats.taskStats?.created
                                                                ? `${Math.round(
                                                                    Math.min(
                                                                        100,
                                                                        (stats.taskStats?.completed ?? 0) / stats.taskStats.created * 100
                                                                    )
                                                                )}%`
                                                                : '0%',
                                                            height: '100%',
                                                            transition: 'width 0.5s',
                                                        }}
                                                    />
                                                    <span
                                                        style={{
                                                            position: 'absolute',
                                                            left: '50%',
                                                            top: '50%',
                                                            transform: 'translate(-50%, -50%)',
                                                            color: '#232323',
                                                            ...cleanFont,
                                                            fontWeight: 900,
                                                            fontSize: 24,
                                                            letterSpacing: 0.5,
                                                            userSelect: 'none',
                                                        }}
                                                    >
                                                        {stats.taskStats?.created
                                                            ? `${Math.round((stats.taskStats?.completed ?? 0) / stats.taskStats.created * 100)}%`
                                                            : '0%'}
                                                    </span>
                                                </div>
                                                {/* <div style={{ marginTop: 6, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                                                    {stats.taskStats?.created
                                                        ? `${stats.taskStats?.completed ?? 0} / ${stats.taskStats?.created ?? 0} completed`
                                                        : '0 / 0 completed'}
                                                </div> */}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* <div className="p-6 rounded-3xl border border-gray-200 upper-layer">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-gray-600">Task management dashboard loaded</span>
                                        <span className="text-gray-400 ml-auto">Just now</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-gray-600">Viewing {lists.length} active lists</span>
                                        <span className="text-gray-400 ml-auto">Now</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <span className="text-gray-600">Ready to manage your tasks</span>
                                        <span className="text-gray-400 ml-auto">Today</span>
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    )}

                    {activeView === 'all-lists' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredLists.map((list) => (
                                <div key={list.id} className="upper-layer bg-white p-6 rounded-3xl border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: list.color || "#60a5fa" }}
                                            />
                                            <h3 className="font-semibold text-gray-900">{list.title}</h3>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedListId(list.id!); setActiveView('list'); }}
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-sm pt-1 pb-2 pl-2 pr-2 transition-colors"
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 mb-2">{list.items.length}</p>
                                    <p className="text-sm text-gray-500">
                                        {list.items.length === 1 ? 'task' : 'tasks'}
                                    </p>
                                </div>
                            ))}
                            <div
                                onClick={() => setShowNewListModal(true)}
                                className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-3xl p-6 flex flex-col items-center justify-center hover:border-gray-400 transition-colors cursor-pointer"
                            >
                                <Plus className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-gray-600 font-medium">Create New List</span>
                            </div>
                        </div>
                    )}

                    {activeView === 'list' && selectedListId && (
                        <TodoList
                            title={lists.find(l => l.id === selectedListId)?.title || ''}
                            items={lists.find(l => l.id === selectedListId)?.items || []}
                            tags={lists.find(l => l.id === selectedListId)?.tags || []}
                            onChange={items => handleListItemsChange(selectedListId, items)}
                            onTagsChange={tags => handleListTagsChange(selectedListId, tags)}
                            onDelete={() => {
                                const list = lists.find(l => l.id === selectedListId);
                                setListToDelete({ id: selectedListId, title: list?.title || '' });
                                setShowDeleteModal(true);
                            }}
                            onRename={(newTitle, color) => handleRenameList(selectedListId, newTitle, color)}
                            defaultMinimized={false}
                        />
                    )}

                    {(activeView === 'calendar' || activeView === 'settings') && (
                        <div className="text-center py-12 text-gray-500">
                            <h3 className="text-lg font-medium mb-2">{activeView.charAt(0).toUpperCase() + activeView.slice(1)} View</h3>
                            <p>This view is under development</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleRenameList = async (listId: string, newTitle: string, color?: string) => {
        if (!user) return;
        await updateToDoList(user.uid, listId, { title: newTitle, ...(color ? { color } : {}) });
        setLists(prev =>
            prev.map(list =>
                list.id === listId ? { ...list, title: newTitle, ...(color ? { color } : {}) } : list
            )
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg text-gray-600">Loading your tasks...</div>
            </div>
        );
    }

    console.log('Stats:', stats);

    return (
        <div
            className="flex bg-gray-100 dashboard-page relative"
            style={{ height: '100vh', overflow: 'hidden' }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    backgroundImage: 'linear-gradient(to right top, #e9edc9, #dde6c4, #d2dec0, #c7d7bb, #bdcfb7, #b1c4ab, #a4b99f, #98ae93, #889d7c, #798d65, #6c7c4e, #606c38)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(18px)',
                    WebkitFilter: 'blur(18px)',
                    pointerEvents: 'none',
                    opacity: 0.5,
                }}
            />
            <div className="flex w-full relative z-10">
                {renderSidebar()}
                {renderMainContent()}
                <NewListModal />
                <DeleteListModal
                    open={showDeleteModal}
                    listTitle={listToDelete?.title || ''}
                    onCancel={() => setShowDeleteModal(false)}
                    onConfirm={async () => {
                        if (listToDelete) {
                            await handleDeleteList(listToDelete.id);
                            setShowDeleteModal(false);
                            setListToDelete(null);
                        }
                    }}
                />
                <TagModal />
            </div>
        </div>
    );
};

export default Dashboard;