import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import NoteEditor from "../components/NoteEditor";
import Timer from "../components/Timer";
import DocumentsGrid from "../components/DocumentsGrid";
import CalendarHeatMap from "../components/CalendarHeatMap";
import LogoutButton from "../components/LogoutButton";
import PressableButton from '../components/PressableButton';
import TimeDisplay from '../components/TimeDisplay';
import AISummaryDisplay from '../components/AIResponseDisplay';

import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayLessonIcon from '@mui/icons-material/PlayLesson';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChecklistIcon from '@mui/icons-material/Checklist';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
// import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { Tooltip as ReactTooltip } from 'react-tooltip';
import { useAuth } from '../components/auth/AuthProvider';
import { recordActivity } from '../utils/activityTracker';
import { motion, AnimatePresence } from 'framer-motion';

import { getNoteById } from '../utils/notesFirestore';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showTimer, setShowTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [focusMode, setfocusMode] = useState(false);
  const appRef = useRef<HTMLDivElement>(null);

  const toggleTimer = () => {
    setShowTimer((prev) => {
      if (!prev) setShowHeatmap(false); // Close heatmap if opening timer
      return !prev;
    });
  };

  const toggleHeatmap = () => {
    setShowHeatmap((prev) => {
      if (!prev) setShowTimer(false); // Close timer if opening heatmap
      return !prev;
    });
  };

  const handleTimerStateChange = (isRunning: boolean) => {
    setTimerRunning(isRunning);
  };

  const [showGrid, setShowGrid] = useState(false);

  // Note state lifted up
  const [noteState, setNoteState] = useState({
    noteId: null as string | null,
    title: '',
    content: '',
  });

  const [showCreateOverlay, setShowCreateOverlay] = useState(false);

  // Load last noteId from localStorage on mount
  useEffect(() => {
    const savedNoteId = localStorage.getItem('lastNoteId');
    if (savedNoteId) {
      // Fetch the note data from Firestore
      getNoteById(savedNoteId).then(note => {
        if (note) {
          setNoteState({
            noteId: note.id || savedNoteId,
            title: note.title || '',
            content: note.content || '',
          });
        }
      });
    }
  }, []);

  // Save noteId to localStorage whenever it changes
  useEffect(() => {
    if (noteState.noteId) {
      localStorage.setItem('lastNoteId', noteState.noteId);
    }
  }, [noteState.noteId]);

  // Handler for creating a new note
  const handleNewNote = async () => {
    if ((noteState.title.trim() || noteState.content.trim()) && noteState.noteId) {
      setNoteState({ ...noteState });
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    if (user) await recordActivity(user);
    localStorage.removeItem('lastNoteId'); // Clear last noteId on new note
    setShowCreateOverlay(true); // Show transition overlay
    setTimeout(() => {
      window.location.reload(); // Refresh the screen, do NOT clear editor contents
    }, 1200); // Duration matches animation
  };

  // Handler for deleting a note (pass to NoteEditor)
  const handleNoteChange = (note: { noteId: string | null; title: string; content: string }) => {
    setNoteState(note);
    if (!note.noteId) {
      localStorage.removeItem('lastNoteId'); // Clear last noteId on delete
    }
  };


  useEffect(() => {
    if (noteState.noteId) {
      console.log("Current noteId:", noteState.noteId);
    }
  }, [noteState.noteId]);

  useEffect(() => {
    const savedNoteId = localStorage.getItem('lastNoteId');
    if (savedNoteId) {
      // Fetch the note data from Firestore
      getNoteById(savedNoteId).then(note => {
        if (note) {
          setNoteState({
            noteId: note.id || savedNoteId,
            title: note.title || '',
            content: note.content || '',
          });
        }
      });
    }
  }, []);


  // Determine if editor should be expanded
  const isEditorExpanded = focusMode || !showTimer || timerRunning;

  // Check if we need to enter or exit fullscreen mode
  useEffect(() => {
    const el = appRef.current;
    if (focusMode && el && !document.fullscreenElement) {
      el.requestFullscreen?.();
    } else if (!focusMode && document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }, [focusMode]);

  return (
    <div
      ref={appRef}
      style={{
        display: 'flex',
        gap: '2rem',
        padding: '2rem',
        maxWidth: isEditorExpanded ? '1750px' : '1750px',
        margin: '0 auto',
        transition: 'max-width 0.3s ease'
      }}>
      {/* Creating new note transition overlay */}
      {showCreateOverlay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '0%',
            height: '100vh',
            background: '#b5e48c',
            zIndex: 99999,
            animation: 'createTransition 1.2s forwards',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
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
              animation: 'slideCreateText 1.2s forwards',
              zIndex: 100000,
              // textShadow: '0 2px 8px #355c3c',
              letterSpacing: '0.1em',
            }}
            className="creating-text-anim"
          >
            creating new note...
          </span>
        </div>
      )}
      <style>
        {`
          @keyframes createTransition {
            from { width: 0%; }
            to { width: 100%; }
          }
          @keyframes slideCreateText {
            from { left: 0%; opacity: 0.2; letter-spacing: 0.1em; }
            to { left: 80%; opacity: 1; letter-spacing: 0.8em; }
          }
          .creating-text-anim {
            animation: slideCreateText 1.2s forwards;
          }
        `}
      </style>
      <div style={{
        flex: isEditorExpanded ? 1 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        // Shrink grid/editor based on which panel is open
        maxWidth: focusMode
          ? '100%'
          : showTimer
            ? timerRunning
              ? '85%'   // Expand editor more when timer is minimized and running
              : '75%'
            : showHeatmap
              ? '85%'
              : '100%',
        width: focusMode
          ? '100%'
          : showTimer
            ? timerRunning
              ? '85%'   // Expand editor more when timer is minimized and running
              : '75%'
            : showHeatmap
              ? '85%'
              : '100%',
        height: isEditorExpanded ? '1000px' : '950px',
        transition: 'max-width 0.5s ease'
      }}>
        {/* Top bar with logo and button group */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1.5rem',
            marginTop: '1rem',
            gap: '1.5rem',
            position: 'relative',
            justifyContent: 'space-between',
          }}
        >
          {/* Text Logo on the left */}
          <span
            style={{
              fontFamily: "'Nunito Sans', sans-serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '2.5rem',
              color: focusMode ? '#fff' : '#000',
              letterSpacing: '0.03em',
              marginLeft: '1rem',
              marginRight: '2.5rem',
              userSelect: 'none',
            }}
          >
            notizen.
          </span>
          {/* Button group and time display on the right */}
          <div
            className={`button-group${focusMode ? ' focusMode-active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <TimeDisplay />
            <PressableButton
              onClick={() => setShowGrid((prev) => !prev)}
              className="key-effect hide-when-focus button-corner-anim"
              aria-label="Documents"
              data-tooltip-id="document-grid-tooltip"
              data-tooltip-content="Documents"
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
              <span className="button-content">{showGrid ? <ExpandLessIcon /> : <ExpandMoreIcon />}</span>
            </PressableButton>

            <PressableButton
              onClick={() => navigate("/dashboard")}
              className="key-effect hide-when-focus button-corner-anim"
              aria-label="To-Do Lists"
              data-tooltip-id="dashboard-tooltip"
              data-tooltip-content="Dashboard"
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
              <span className="button-content"><SpaceDashboardOutlinedIcon /></span>
            </PressableButton>

            <PressableButton
              onClick={toggleTimer}
              className="key-effect hide-when-focus button-corner-anim"
              aria-label="Pomodoro Timer"
              data-tooltip-id="timer-tooltip"
              data-tooltip-content="Pomodoro Timer"
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
              <span className="button-content"><AccessAlarmIcon /></span>
            </PressableButton>

            {/* <PressableButton
              onClick={toggleHeatmap}
              className="key-effect hide-when-focus button-corner-anim"
              aria-label="Activity Tracker"
              data-tooltip-id="activity-tracker-tooltip"
              data-tooltip-content="Activity Tracker"
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
              <span className="button-content"><CalendarTodayIcon /></span>
            </PressableButton> */}

            <PressableButton
              onClick={() => setfocusMode((prev) => !prev)}
              className="key-effect focus-mode-btn button-corner-anim"
              aria-label={focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
              data-tooltip-id="focus-mode-tooltip"
              data-tooltip-content={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
              style={{
                background: focusMode ? '#b0c4b1' : '#606c38',
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
              <span className="button-content">{focusMode ? "⏹" : <PlayLessonIcon />}</span>
            </PressableButton>

            <LogoutButton size={50} />
          </div>
        </div>

        {!focusMode && showGrid ? (
          <DocumentsGrid
            onSelectNote={(note) => {
              if (user) recordActivity(user);
              setNoteState(note);
              setShowGrid(false);
              if (note.noteId) {
                console.log("Opened note from grid, noteId:", note.noteId);
              }
            }}
            height={isEditorExpanded ? '1000px' : '950px'}
          />
        ) : (
          <NoteEditor
            noteId={noteState.noteId}
            title={noteState.title}
            content={noteState.content}
            onNoteChange={handleNoteChange}
            onNewNote={handleNewNote}
            focusMode={focusMode}
          />
        )}
      </div>

      <AnimatePresence>
        {!focusMode && showTimer && (
          <motion.div
            key="timer"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{
              flex: timerRunning ? 0 : 0,
              minWidth: timerRunning ? '180px' : '280px',
              opacity: 1,
              transform: 'translateX(0)',
              transition: 'all 0.3s ease'
            }}
          >
            <Timer onStateChange={handleTimerStateChange} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* <AnimatePresence>
        {!focusMode && showHeatmap && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <CalendarHeatMap />
            <ReactTooltip id="heatmap-tooltip" anchorSelect="rect[data-tooltip-id='heatmap-tooltip']" />
          </motion.div>
        )}
      </AnimatePresence> */}

      <AISummaryDisplay noteId={noteState.noteId} />

      {/* tool tips for the menu buttons */}
      <ReactTooltip id="focus-mode-tooltip" anchorSelect="[data-tooltip-id='focus-mode-tooltip']" />
      <ReactTooltip id="document-grid-tooltip" anchorSelect="[data-tooltip-id='document-grid-tooltip']" />
      <ReactTooltip id="dashboard-tooltip" anchorSelect="[data-tooltip-id='dashboard-tooltip']" />
      <ReactTooltip id="timer-tooltip" anchorSelect="[data-tooltip-id='timer-tooltip']" />
      {/* <ReactTooltip id="activity-tracker-tooltip" anchorSelect="[data-tooltip-id='activity-tracker-tooltip']" /> */}
    </div>

  );
}
