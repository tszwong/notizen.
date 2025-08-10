import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { useNavigate } from "react-router-dom";

import { getUserToDoLists, createToDoList, updateToDoList, deleteToDoList } from '../utils/notesFirestore';
import type { ToDoListData, ChecklistItem } from '../types/todo';
import TodoList from '../components/ToDoList';
import PressableButton from '../components/PressableButton';

import { Tooltip as ReactTooltip } from 'react-tooltip';

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

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [lists, setLists] = useState<ToDoListData[]>([]);
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('today');
    const [showAllLists, setShowAllLists] = useState(false);
    const [showNewListModal, setShowNewListModal] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [listToDelete, setListToDelete] = useState<{ id: string, title: string } | null>(null);

    const cleanFont = {
        fontFamily: "'Nunito Sans', sans-serif",
    };

    type ListType = { id: string; name: string; color: string; count: number };
    const [selectedList, setSelectedList] = useState<ListType | null>(null);

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

    const displayedLists = showAllLists ? lists : lists.slice(0, 3);
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
        <div className="bg-white p-4 rounded-lg border border-gray-200">
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

    const renderSidebar = () => (
        <div 
            className="w-[23%] bg-gray-50 border-r border-gray-200 h-screen flex flex-col sidebar-container"
            style={{}}
        >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
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
                                : 'text-gray-700 hover:bg-gray-100'
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
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4" />
                                <span>Upcoming</span>
                            </div>
                            <span
                                className={`text-xs px-2 py-1 rounded-full min-w-[2em] text-center inline-flex items-center justify-center ${
                                    getUpcomingTasks().length >= 1
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
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <CalendarDays className="w-4 h-4" />
                                <span>Today</span>
                            </div>
                            <span
                                className={`text-xs px-2 py-1 rounded-full min-w-[2em] text-center inline-flex items-center justify-center ${
                                    getTodayTasks().length >= 1
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
                                    : 'text-gray-700 hover:bg-gray-100'
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
                                        : 'text-gray-700 hover:bg-gray-100'
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
                                    className={`text-xs px-2 py-1 rounded-full min-w-[2em] text-center inline-flex items-center justify-center ${
                                        list.items.length >= 1
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
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-500 hover:bg-gray-100 transition-colors mt-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New List</span>
                    </button>
                </div>

                {/* Tags Section */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        TAGS
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Tag 1
                        </span>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                            Tag 2
                        </span>
                        <button className="px-2 py-1 border border-dashed border-gray-300 text-gray-500 text-xs rounded-full hover:border-gray-400">
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
            <div className="w-[77%] flex flex-col h-screen main-content-container">
                {/* Header */}
                {!(activeView === 'list' && selectedListId) && (
                    <div
                        className="bg-gray-50"
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
                                    {activeView === 'all-lists' && 'All Lists'}
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
                <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                    {activeView === 'today' && (
                        <div className="space-y-4">
                            {todayTasks.map((task) => (
                                <TaskCard key={`${task.listId}-${task.id}`} task={task} showListTitle={true} />
                            ))}
                            {todayTasks.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <Clock className="w-25 h-25 mx-auto mb-4 text-gray-300" />
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
                                    <CalendarDays className="w-25 h-25 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-lg font-medium mt-10 mb-2">You're all caught up for this week!</h3>
                                </div>
                            )}
                        </div>
                    )}

                    {activeView === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Tasks</h3>
                                    <p className="ml-3 text-3xl font-bold text-blue-600">{getAllTasks().length}</p>
                                    <p className="ml-3 text-sm text-gray-500 mt-1">{getAllTasks().filter(t => t.completed).length} completed</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Lists</h3>
                                    <p className="ml-3 text-3xl font-bold text-green-600">{lists.length}</p>
                                    <p className="ml-3 text-sm text-gray-500 mt-1">Managing your tasks</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Due Today</h3>
                                    <p className="ml-3 text-3xl font-bold text-red-600">{todayTasks.length}</p>
                                    <p className="ml-3 text-sm text-gray-500 mt-1">Need attention today</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg border border-gray-200">
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
                            </div>
                        </div>
                    )}

                    {activeView === 'all-lists' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lists.map((list) => (
                                <div key={list.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
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
                                className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-gray-400 transition-colors cursor-pointer"
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
                            onChange={items => handleListItemsChange(selectedListId, items)}
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

    return (
        <div 
            className="flex bg-gray-100 dashboard-page"
        >
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
        </div>
    );
};

export default Dashboard;