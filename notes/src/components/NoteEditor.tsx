import React, { useState, useEffect, useRef } from "react";

// Extend the Window interface to include __idleTimer
declare global {
  interface Window {
    __idleTimer?: ReturnType<typeof setTimeout>;
  }
}

import { createNote, updateNote, getNoteById, deleteNote } from '../utils/notesFirestore';
import { createAISummary, createAITaskExtraction } from '../utils/notesFirestore';
import { useAuth } from './auth/AuthProvider';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { recordActivity } from '../utils/activityTracker';
import PressableButton from "./PressableButton";

import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import ImageResize from 'quill-image-resize-module-react';

// import html2pdf from 'html2pdf.js';

import DoneIcon from '@mui/icons-material/Done';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import PauseIcon from '@mui/icons-material/Pause';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CircularProgress from '@mui/material/CircularProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

//@ts-ignore
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

Quill.register('modules/imageResize', ImageResize);

interface NoteEditorProps {
  noteId: string | null;
  title: string;
  content: string;
  onNoteChange: (note: { noteId: string | null; title: string; content: string }) => void;
  onNewNote: () => void;
  className?: string;
  focusMode?: boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ noteId, title, content, onNoteChange, onNewNote, className = '', focusMode = false }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [timestamps, setTimestamps] = useState<{ createdAt?: any; updatedAt?: any }>({});
  const [listening, setListening] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [summarizing, setSummarizing] = useState(false); // Add a state for loading
  const [showCheckIcon, setShowCheckIcon] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number } | null>(null);
  const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
  const [idle, setIdle] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastSaved = useRef({ title: '', content: '' });
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quillRef = useRef<any>(null);
  const selectionRef = useRef<any>(null);
  const lastChangeSourceRef = useRef<string | null>(null);
  const [editorHeight, setEditorHeight] = useState<string | number>('auto');
  const [lineCount, setLineCount] = useState(0);
  const [highlightedLatexIdx, setHighlightedLatexIdx] = useState<number | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [extractingTasks, setExtractingTasks] = useState(false);
  const [highlightMenuAnchor, setHighlightMenuAnchor] = useState<null | HTMLElement>(null);

  const cleanFont = {
    fontFamily: "'Nunito Sans', sans-serif",
  };

  // Comprehensive toolbar configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }],
      [{ 'background': [] }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],

    clipboard: {
      matchVisual: false,
    },
    history: {
      delay: 1000,
      maxStack: 2000,
      userOnly: true
    },
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize', 'Toolbar']
    }
  };

  // Custom formats for the editor
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'blockquote', 'code-block',
    'list', 'bullet',
    'indent', 'align',
    'link', 'image', 'video',
    'clean'
  ];

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onNoteChange({ noteId, title: e.target.value, content });
    if (user) setTimeout(() => { recordActivity(user); }, 0);
  };

  // Preserve selection before value changes, but only if not user typing
  const handleContentChange = async (value: string, delta: any, source: string, editor: any) => {
    lastChangeSourceRef.current = source;
    if (source !== 'user' && quillRef.current) {
      const quillEditor = quillRef.current.getEditor();
      selectionRef.current = quillEditor.getSelection();
    } else {
      selectionRef.current = null;
    }
    onNoteChange({ noteId, title, content: value });
    if (user) await recordActivity(user);
  };

  // Restore selection after value changes, but only if not user typing
  useEffect(() => {
    if (
      quillRef.current &&
      selectionRef.current &&
      lastChangeSourceRef.current !== 'user'
    ) {
      const editor = quillRef.current.getEditor();
      if (document.activeElement === editor.root) {
        editor.setSelection(selectionRef.current);
      }
    }
  }, [content]);

  // Responsive editor height using ResizeObserver
  useEffect(() => {
    if (!quillRef.current) return;
    const editorElem = quillRef.current.getEditor().root;
    const updateHeight = () => {
      setEditorHeight(Math.max(editorElem.scrollHeight + 24, 120)); // 120px min height
    };
    updateHeight();
    const resizeObserver = new window.ResizeObserver(updateHeight);
    resizeObserver.observe(editorElem);
    return () => resizeObserver.disconnect();
  }, [content]);

  const handleDelete = async () => {
    if (!noteId) return;
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      if (user) await recordActivity(user); // Track activity when user deletes a note
      await deleteNote(noteId);
      onNoteChange({ noteId: null, title: '', content: '' });
      setShowDeleteOverlay(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200); // Duration matches the animation
    }
  };

  // Autosave logic
  useEffect(() => {
    if (!user) return;
    if (
      title === lastSaved.current.title &&
      content === lastSaved.current.content
    ) {
      return;
    }
    setSaving(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        let newNoteId = noteId;
        if (noteId) {
          await updateNote(noteId, title, content);
        } else {
          const docRef = await createNote(user.uid, title, content);
          newNoteId = docRef.id;
          onNoteChange({ noteId: newNoteId, title, content });
        }
        lastSaved.current = { title, content };
        // Fetch the note to get updated timestamps
        if (newNoteId) {
          const updatedNote = await getNoteById(newNoteId);
          setTimestamps({
            createdAt: updatedNote?.createdAt,
            updatedAt: updatedNote?.updatedAt,
          });
        }
      } catch (e) {
        // Optionally handle error
      }
      setSaving(false);
    }, 1500); // 1.5 seconds after last change
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [title, content, user, noteId]);

  // Web Speech API
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      // Add onto existing content, not the content at the time of starting recognition
      onNoteChange({ noteId, title, content: (typeof recognitionRef.current._lastContent === 'string' ? recognitionRef.current._lastContent : content) + transcript });
      recognitionRef.current._lastContent = (typeof recognitionRef.current._lastContent === 'string' ? recognitionRef.current._lastContent : content) + transcript;
    };
    recognitionRef.current.onend = () => setListening(false);
    recognitionRef.current.onerror = () => setListening(false);
  }, []);

  const handleSpeech = async () => {
    if (!recognitionRef.current) return;
    if (user) await recordActivity(user); // Track activity when user uses speech-to-text
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      // Save the latest content so we always append to the latest
      recognitionRef.current._lastContent = content;
      recognitionRef.current.start();
      setListening(true);
    }
  };

  // const downloadPDF = () => {
  //   const editor = document.querySelector('.ql-editor');
  //   if (editor) {
  //     setDownloadComplete(true);
  //     const safeTitle = title.trim() ? title.trim().replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_') : 'notes';
  //     html2pdf().from(editor).save(`${safeTitle}.pdf`);
  //     setTimeout(() => setDownloadComplete(false), 5000);
  //   }
  // };

  // AI Summary function
  // Updated summarizeWithAI function with correct backend URL
  const summarizeWithAI = async () => {
    if (!user) return;

    if (!content || content.trim().length === 0) {
      alert('Please add some content to summarize.');
      return;
    }

    setSummarizing(true); // Set loading state to true

    try {
      await recordActivity(user);

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.response) {
        // Append the AI summary as HTML
        const summarySection = `<br><br><strong>--- AI Summary ---</strong><br>${data.response}<br><strong>--- End Summary ---</strong><br><br>`;
        onNoteChange({ noteId, title, content: content + summarySection });

        // Show the check icon for 2 seconds
        setShowCheckIcon(true);
        setTimeout(() => setShowCheckIcon(false), 2000);
      } else {
        console.error('AI summary failed:', data.error);
        alert(`Failed to generate summary: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error summarizing with AI:', error);
      if (error instanceof Error) {
        alert(`Error: ${error.message || 'Unknown error occurred.'}`);
      } else {
        alert('Unknown error occurred.');
      }
    } finally {
      setSummarizing(false); // Reset loading state
    }
  };

  // New function to summarize only the selected text
  const summarizeSelectedText = async () => {
    if (!selectedText || selectedText.length > 30000) {
      alert('Selected text is empty or exceeds the input limit.');
      return;
    }

    setSummarizing(true);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: selectedText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.response) {
        // Save the summary to Firestore instead of appending to content
        if (!user) {
          alert('User not authenticated.');
          return;
        }
        await createAISummary(
          user.uid,
          noteId,
          title || 'Untitled Note',
          selectedText,
          data.response
        );
        alert('Summary generated and saved to AI Logs!');
      } else {
        console.error('AI summary failed:', data.error);
        alert(`Failed to generate summary: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error summarizing with AI:', error);
      alert(`Error: ${error.message || 'Unknown error occurred.'}`);
    } finally {
      setSummarizing(false);
      setSelectedText('');
      setButtonPosition(null);
    }
  };

  const handleAISummary = async () => {
    if (!user || !content.trim()) {
      alert('Please add some content before generating a summary.');
      return;
    }

    setIsGeneratingSummary(true);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      // Save the summary to Firestore
      await createAISummary(
        user.uid,
        noteId,
        title || 'Untitled Note',
        content,
        data.response
      );

      alert('Summary generated and saved to AI Logs!');
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  useEffect(() => {
    const handleSelection = (e: Event) => {
      const selection = window.getSelection();
      // Only enable summarize highlight if selection is inside the text editor
      const editorElem = quillRef.current?.getEditor().root;
      if (
        selection &&
        selection.toString().trim().length > 0 &&
        selection.anchorNode &&
        editorElem &&
        editorElem.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(selection.toString());
        setButtonPosition({ x: rect.left + window.scrollX, y: rect.top + window.scrollY - 30 });
      } else {
        setSelectedText('');
        setButtonPosition(null);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, []);

  // Editor height logic
  const computedEditorHeight = focusMode ? '60vh' : '90vh';
  const editorStyle = {
    minHeight: computedEditorHeight,
    maxHeight: computedEditorHeight,
    background: 'rgba(255, 255, 255, 0.95)',
    overflow: 'auto',
  };

  // Helper: Split content into lines and find LaTeX lines with their index
  const getLatexLineIndices = (content: string) => {
    // Remove HTML tags, split by lines
    const text = content.replace(/<[^>]+>/g, '\n');
    return text
      .split('\n')
      .map((line, idx) => ({ line: line.trim(), idx }))
      .filter(({ line }) => /^\$.*\$$/.test(line));
  };

  const LATEX_PANEL_KEY = 'latexPanelMinimized';
  const [latexPanelMinimized, setLatexPanelMinimized] = useState<boolean>(() => {
    // Default to minimized (hidden) unless user previously opened it
    const saved = localStorage.getItem(LATEX_PANEL_KEY);
    return saved === null ? true : saved === 'true';
  });

  // Persist minimized state
  useEffect(() => {
    localStorage.setItem(LATEX_PANEL_KEY, latexPanelMinimized ? 'true' : 'false');
  }, [latexPanelMinimized]);

  useEffect(() => {
    // const ONE_MINUTE = 1 * 60 * 1000;
    const FORTY_FIVE_MINUTES = 45 * 60 * 1000;
    const timer = setTimeout(() => {
      setIdle(true);
    }, FORTY_FIVE_MINUTES);

    return () => clearTimeout(timer);
  }, [noteId, title, content]); // Reset timer if user changes note or edits

  // Optionally, reset timer on user activity (keypress, mousemove, etc.)
  useEffect(() => {
    if (!idle) {
      const resetIdle = () => {
        clearTimeout(window.__idleTimer);
        window.__idleTimer = setTimeout(() => setIdle(true), 30 * 60 * 1000);
      };
      window.addEventListener('mousemove', resetIdle);
      window.addEventListener('keydown', resetIdle);
      return () => {
        window.removeEventListener('mousemove', resetIdle);
        window.removeEventListener('keydown', resetIdle);
        clearTimeout(window.__idleTimer);
      };
    }
  }, [idle]);

  // --- AI Task Extraction ---
  const handleExtractTasks = async () => {
    if (!user || !content.trim()) {
      alert('Please add some content before extracting tasks.');
      return;
    }
    setExtractingTasks(true);
    setAnchorEl(null);
    try {
      const response = await fetch('/api/extractTasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to extract tasks');
      }
      if (data.tasks && data.tasks.length > 0) {
        await createAITaskExtraction(
          user.uid,
          noteId,
          title || 'Untitled Note',
          content,
          data.tasks
        );
        // Optionally show a snackbar or toast for feedback
      } else {
        // Optionally show a snackbar or toast for "No actionable tasks found."
      }
    } catch (error) {
      console.error('Error extracting tasks:', error);
      // Optionally show a snackbar or toast for error
    } finally {
      setExtractingTasks(false);
    }
  };

  // --- Menu handlers ---
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  // --- Highlighted Text AI Actions ---
  const handleHighlightMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setHighlightMenuAnchor(event.currentTarget);
  };
  const handleHighlightMenuClose = () => setHighlightMenuAnchor(null);

  const handleSummarizeSelectedText = async () => {
    handleHighlightMenuClose();
    await summarizeSelectedText();
  };

  const handleExtractTasksFromSelectedText = async () => {
    handleHighlightMenuClose();
    if (!selectedText || selectedText.length > 30000) {
      alert('Selected text is empty or exceeds the input limit.');
      return;
    }
    setExtractingTasks(true);
    try {
      const response = await fetch('/api/extractTasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: selectedText }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to extract tasks');
      }
      if (data.tasks && data.tasks.length > 0) {
        // Save to Firestore for AIResponseDisplay
        if (user) {
          await createAITaskExtraction(
            user.uid,
            noteId,
            title || 'Untitled Note',
            selectedText,
            data.tasks
          );
        }
        // Optionally show a snackbar or toast for feedback
      } else {
        // Optionally show a snackbar or toast for "No actionable tasks found."
      }
    } catch (error) {
      console.error('Error extracting tasks:', error);
      // Optionally show a snackbar or toast for error
    } finally {
      setExtractingTasks(false);
      setSelectedText('');
      setButtonPosition(null);
    }
  };

  return (
    <div className={`note-editor-container ${className}`} style={{ gap: '2rem' }}>
      {/* Green transition overlay with sliding "Deleting..." text */}
      {showDeleteOverlay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '0%',
            height: '100vh',
            background: '#f28482',
            zIndex: 99999,
            animation: 'greenTransition 1.2s forwards',
            overflow: 'visible',
          }}
        >
          {/* Sliding "Deleting..." text with increasing letter spacing */}
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '100%',
              transform: 'translate(-100%, -50%)',
              fontWeight: 'bold',
              color: '#fff',
              fontSize: '2rem',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              animation: 'slideDeletingText 1.2s forwards',
              zIndex: 100000,
              textShadow: '0 2px 8px #355c3c',
              letterSpacing: '0.1em', // initial value, will be animated
            }}
            className="deleting-text-anim"
          >
            deleting...
          </span>
        </div>
      )}
      {/* Add keyframes for the animation */}
      <style>
        {`
          @keyframes greenTransition {
            from { width: 0%; }
            to { width: 100%; }
          }
          @keyframes slideDeletingText {
            from { left: 0%; opacity: 0.2; letter-spacing: 0.1em; }
            to { left: 80%; opacity: 1; letter-spacing: 1.5em; }
          }
          .deleting-text-anim {
            animation: slideDeletingText 1.2s forwards;
          }
        `}
      </style>
      <div
        className="note-editor-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '2rem',
          borderRadius: '40px', // <-- Add rounded corners to editor card
          borderColor: '#a3b18a',
          boxShadow: '0 4px 24px rgba(60,9,108,0.08)', // optional subtle shadow
          // background: 'rgba(255,255,255,0.95)',
        }}
      >
        <div
          className="note-editor-toolbar-sticky"
          style={{
            borderRadius: '14px', // <-- Add rounded corners to toolbar
            background: 'rgba(245,245,255,0.85)', // optional subtle background
            padding: '0.5rem 1rem',
            marginBottom: '1rem',
            boxShadow: '0 2px 8px rgba(60,9,108,0.04)', // optional subtle shadow
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0rem', gap: '1rem' }}>
            <input
              value={title}
              onChange={handleTitleChange}
              placeholder="Title"
              style={{
                width: '100%',
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: 0,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: '#232323',
              }}
            />

            <PressableButton
              onClick={handleSpeech}
              className="nbg-button-corner-anim"
              aria-label={listening ? 'Stop Listening' : 'Start Speech to Text'}
              data-tooltip-id="recording-tooltip"
              data-tooltip-content={listening ? 'Stop Listening' : 'Start Speech to Text'}
              style={{
                background: listening ? 'rgb(255,139,125)' : 'none',
                color: listening ? 'white' : '#7A6C4D',
                fontWeight: 700,
                marginLeft: '0.5rem',
                minWidth: 48,
                minHeight: 48,
                borderRadius: '50%',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                border: 'none',
              }}
            >
              <span className="nbg-corner-anim-span"></span>
              <span className="nbg-button-content">{listening ? <PauseIcon /> : <RecordVoiceOverIcon />}</span>
            </PressableButton>

            <PressableButton
              onClick={handleMenuClick}
              className="nbg-button-corner-anim"
              aria-label="AI Features"
              data-tooltip-id="ai-summary-tooltip"
              data-tooltip-content="AI Features"
              style={{
                color: '#7A6C4D',
                fontWeight: 700,
                minWidth: 48,
                minHeight: 48,
                borderRadius: '50%',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                border: 'none',
              }}
              disabled={summarizing || extractingTasks}
            >
              <span className="nbg-corner-anim-span"></span>
              <span className="nbg-button-content">
                {summarizing || extractingTasks ? (
                  <CircularProgress size={24} style={{ color: '#7A6C4D' }} />
                ) : showCheckIcon ? (
                  <DoneIcon />
                ) : (
                  <AutoAwesomeIcon />
                )}
              </span>
            </PressableButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  handleAISummary();
                }}
                disabled={summarizing}
              >
                Summarize Note
              </MenuItem>
              <MenuItem
                onClick={handleExtractTasks}
                disabled={extractingTasks}
              >
                Extract Tasks
              </MenuItem>
            </Menu>

            <PressableButton
              onClick={onNewNote}
              className="nbg-button-corner-anim"
              aria-label="New Note"
              data-tooltip-id="new-note-tooltip"
              data-tooltip-content="New Note"
              style={{
                borderRadius: '50%',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                border: 'none',
                minWidth: 48,
                minHeight: 48,
              }}
            >
              <span className="nbg-corner-anim-span"></span>
              <span className="nbg-button-content"><AddIcon /></span>
            </PressableButton>

            {/* <PressableButton
              onClick={downloadPDF}
              className="nbg-button-corner-anim"
              aria-label="Download PDF"
              data-tooltip-id="download-pdf-tooltip"
              data-tooltip-content="Download PDF"
              style={{
                background: 'rgba(255,255,255,0.7)',
                color: '#7A6C4D',
                fontWeight: 700,
                minWidth: 48,
                minHeight: 48,
                borderRadius: '50%',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                border: 'none',
              }}
            >
              <span className="nbg-corner-anim-span"></span>
              <span className="nbg-button-content">{downloadComplete ? <FileDownloadDoneIcon /> : <DownloadIcon />}</span>
            </PressableButton> */}

            {noteId && (
              <PressableButton
                onClick={handleDelete}
                className="nbg-button-corner-anim"
                aria-label="Delete Note"
                data-tooltip-id="delete-note-tooltip"
                data-tooltip-content="Delete Note"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  color: '#e57373',
                  fontWeight: 700,
                  minWidth: 48,
                  minHeight: 48,
                  borderRadius: '50%',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.3rem',
                  border: 'none',
                }}
              >
                <span className="nbg-corner-anim-span"></span>
                <span className="nbg-button-content"><DeleteIcon /></span>
              </PressableButton>
            )}
          </div>
        </div>

        <div style={{}}>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={handleContentChange}
            modules={modules}
            formats={formats}
            placeholder="Start typing your notes..."
            style={editorStyle}
          />
        </div>

        {/* LaTeX Results Panel */}
        <div style={{ width: '100%', marginTop: '1em', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={() => setLatexPanelMinimized((prev) => !prev)}
            style={{
              background: '#7A6C4D',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.4em 1em',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '1em',
              fontSize: '0.8em',
            }}
            aria-label={latexPanelMinimized ? 'Show LaTeX Results' : 'Hide LaTeX Results'}
          >
            {latexPanelMinimized ? 'Show LaTeX Results' : 'Hide LaTeX Results'}
          </button>
          {!latexPanelMinimized && (
            <div style={{
              width: '100%',
              maxHeight: '30vh',
              overflowY: 'auto',
              background: '#f8f8f8',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(60,9,108,0.08)',
              padding: '1em',
              margin: '0 auto'
            }}>
              {/* <div style={{ fontWeight: 600, marginBottom: '0.5em', color: '#7A6C4D' }}>LaTeX Results</div> */}
              {getLatexLineIndices(content).map(({ line, idx }) => (
                <div key={idx} style={{ marginBottom: '1.2em' }}>
                  <div style={{ fontSize: '0.95em', color: '#888', marginBottom: '0.2em' }}></div>
                  <BlockMath math={line.slice(1, -1)} errorColor="#cc0000" />
                </div>
              ))}
              {getLatexLineIndices(content).length === 0 && (
                <div style={{ color: '#bbb', fontSize: '0.95em' }}>No LaTeX detected.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '2rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginTop: '0.5rem', color: saving ? '#888' : '#588157', fontWeight: 500 }}>
          {saving ? 'Saving...' : 'Saved'}
        </div>
        <div style={{ marginTop: '0.5rem', color: '#888', fontSize: '0.95rem' }}>
          {timestamps.createdAt && typeof timestamps.createdAt.toDate === 'function' && (
            <span>Created: {timestamps.createdAt.toDate().toLocaleString()} </span>
          )}
          {timestamps.updatedAt && typeof timestamps.updatedAt.toDate === 'function' && (
            <span> | Last Updated: {timestamps.updatedAt.toDate().toLocaleString()}</span>
          )}
        </div>
      </div>

      {buttonPosition && (
        <>
          <PressableButton
            onClick={handleHighlightMenuClick}
            aria-label="AI Actions for Selected Text"
            data-tooltip-id="summarize-selected-tooltip"
            data-tooltip-content="AI Actions for Selected Text"
            style={{
              position: 'absolute',
              top: buttonPosition.y - 15,
              left: buttonPosition.x - 20,
              background: '#606c38',
              color: '#fefae0',
              fontWeight: 700,
              minWidth: 42,
              minHeight: 40,
              borderRadius: '30%',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              border: 'none',
              zIndex: 1000,
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <span className="nbg-button-content"><AutoAwesomeIcon /></span>
          </PressableButton>
          <Menu
            anchorEl={highlightMenuAnchor}
            open={Boolean(highlightMenuAnchor)}
            onClose={handleHighlightMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <MenuItem
              onClick={handleSummarizeSelectedText}
              disabled={summarizing}
            >
              Summarize Selection
            </MenuItem>
            <MenuItem
              onClick={handleExtractTasksFromSelectedText}
              disabled={extractingTasks}
            >
              Extract Tasks from Selection
            </MenuItem>
          </Menu>
        </>
      )}

      {idle && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(245,245,245,0.96)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h2 style={{ fontSize: '2.2rem', color: '#000', marginBottom: '1.5rem', fontWeight: 800, ...cleanFont }}>
            You've been idle for a while...
          </h2>
          <button
            style={{
              marginTop: '1rem',
              background: '#606c38',
              color: 'white',
              fontSize: '1.2rem',
              padding: '0.4em 1.8em',
              borderRadius: '1.5em',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(60,9,108,0.10)',
            }}
            onClick={() => setIdle(false)}
          >
            Go back to work
          </button>
        </div>
      )}

      <ReactTooltip id="recording-tooltip" anchorSelect="[data-tooltip-id='recording-tooltip']" />
      <ReactTooltip id="new-note-tooltip" anchorSelect="[data-tooltip-id='new-note-tooltip']" />
      <ReactTooltip id="ai-summary-tooltip" anchorSelect="[data-tooltip-id='ai-summary-tooltip']" />
      <ReactTooltip id="download-pdf-tooltip" anchorSelect="[data-tooltip-id='download-pdf-tooltip']" />
      <ReactTooltip id="delete-note-tooltip" anchorSelect="[data-tooltip-id='delete-note-tooltip']" />
      <ReactTooltip
        id="summarize-selected-tooltip" anchorSelect="[data-tooltip-id='summarize-selected-tooltip']"
        style={{ zIndex: 9999 }}
      />
      <ReactTooltip
        anchorSelect=".ql-bold"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Bold"
      />
      <ReactTooltip
        anchorSelect=".ql-italic"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Italic"
      />
      <ReactTooltip
        anchorSelect=".ql-underline"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Underline"
      />
      <ReactTooltip
        anchorSelect=".ql-strike"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Strikethrough"
      />
      <ReactTooltip
        anchorSelect=".ql-header"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Header"
      />
      <ReactTooltip
        anchorSelect=".ql-list[value='ordered']"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Ordered List"
      />
      <ReactTooltip
        anchorSelect=".ql-list[value='bullet']"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Bullet List"
      />
      <ReactTooltip
        anchorSelect=".ql-link"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Insert Link"
      />
      <ReactTooltip
        anchorSelect=".ql-image"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Insert Image"
      />
      <ReactTooltip
        anchorSelect=".ql-video"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Insert Video"
      />
      <ReactTooltip
        anchorSelect=".ql-code-block"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Code Block"
      />
      <ReactTooltip
        anchorSelect=".ql-blockquote"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Blockquote"
      />
      <ReactTooltip
        anchorSelect=".ql-clean"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Remove Formatting"
      />
      <ReactTooltip
        anchorSelect=".ql-font"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Font"
      />
      <ReactTooltip
        anchorSelect=".ql-size"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Font Size"
      />
      <ReactTooltip
        anchorSelect=".ql-color"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Font Color"
      />
      <ReactTooltip
        anchorSelect=".ql-background"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Highlight"
      />
      <ReactTooltip
        anchorSelect=".ql-indent[value='-1']"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Indent Left"
      />
      <ReactTooltip
        anchorSelect=".ql-indent[value='+1']"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Indent Right"
      />
      <ReactTooltip
        anchorSelect=".ql-align"
        place="bottom"
        style={{ fontSize: '0.85rem', padding: '0.3em 0.7em', zIndex: 9999 }}
        content="Align"
      />
    </div>
  );
};

export default NoteEditor;