import React, { useState, useEffect, useRef } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import html2pdf from 'html2pdf.js';
import { createNote, updateNote, getNoteById, deleteNote } from '../utils/notesFirestore';
import { useAuth } from './auth/AuthProvider';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import PauseIcon from '@mui/icons-material/Pause';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone';
import DeleteIcon from '@mui/icons-material/Delete';
import PressableButton from "./PressableButton";
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { recordActivity } from '../utils/activityTracker';
import ImageResize from 'quill-image-resize-module-react';

Quill.register('modules/imageResize', ImageResize);

interface NoteEditorProps {
  noteId: string | null;
  title: string;
  content: string;
  onNoteChange: (note: { noteId: string | null; title: string; content: string }) => void;
  onNewNote: () => void;
  className?: string;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ noteId, title, content, onNoteChange, onNewNote, className = '' }) => {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [timestamps, setTimestamps] = useState<{ createdAt?: any; updatedAt?: any }>({});
    const [listening, setListening] = useState(false);
    const [downloadComplete, setDownloadComplete] = useState(false);
    const recognitionRef = useRef<any>(null);
    const lastSaved = useRef({ title: '', content: '' });
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const quillRef = useRef<any>(null);
    const selectionRef = useRef<any>(null);
    const lastChangeSourceRef = useRef<string | null>(null);
    const [editorHeight, setEditorHeight] = useState<string | number>('auto');

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
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
        ],

    clipboard: {
        matchVisual: false,
    },
    history: {
        delay: 2000,
        maxStack: 500,
        userOnly: true
    },
    imageResize: {
        parchment: Quill.import('parchment'),
        modules: [ 'Resize', 'DisplaySize', 'Toolbar' ]
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

  const downloadPDF = () => {
    const editor = document.querySelector('.ql-editor');
    if (editor) {
      setDownloadComplete(true);
      const safeTitle = title.trim() ? title.trim().replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_') : 'notes';
      html2pdf().from(editor).save(`${safeTitle}.pdf`);
      setTimeout(() => setDownloadComplete(false), 5000);
    }
  };

  return (
    <div className={`note-editor-container ${className}`}>
      <div className="note-editor-card" style={{ position: 'relative', overflow: 'hidden', padding: '2rem' }}>
        <div className="note-editor-toolbar-sticky">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
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
                background: listening ? 'rgb(255,139,125)' : 'rgba(255,255,255,0.7)',
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
              onClick={onNewNote}
              className="nbg-button-corner-anim"
              aria-label="New Note"
              data-tooltip-id="new-note-tooltip"
              data-tooltip-content="New Note"
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
              <span className="nbg-button-content"><AddIcon /></span>
            </PressableButton>
            <PressableButton
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
            </PressableButton>
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
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={handleContentChange}
          modules={modules}
          formats={formats}
          placeholder="Start typing your notes..."
          style={{ 
            minHeight: 120,
            height: editorHeight,
            maxHeight: 800,
            background: 'rgba(255, 255, 255, 0.95)',
            // border: 'none',
            // borderBottom: '1px',
            overflow: 'auto'
          }}
        />
        <div style={{ marginTop: '0.5rem', color: saving ? '#888' : '#4ECDC4', fontWeight: 500 }}>
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

      <ReactTooltip id="recording-tooltip" anchorSelect="[data-tooltip-id='recording-tooltip']" />
      <ReactTooltip id="new-note-tooltip" anchorSelect="[data-tooltip-id='new-note-tooltip']" />
      <ReactTooltip id="download-pdf-tooltip" anchorSelect="[data-tooltip-id='download-pdf-tooltip']" />
      <ReactTooltip id="delete-note-tooltip" anchorSelect="[data-tooltip-id='delete-note-tooltip']" />
    </div>
  );
};

export default NoteEditor;