import React, { useState, useRef, useEffect } from "react";
import NoteEditor from "../components/NoteEditor";
import Timer from "../components/Timer";
import DocumentGrid from "../components/DocumentsGrid";
import CalendarHeatMap from "../components/CalendarHeatMap";
import UserAvatar from "../components/User";
import PressableButton from '../components/PressableButton';

import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayLessonIcon from '@mui/icons-material/PlayLesson';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import { Tooltip as ReactTooltip } from 'react-tooltip';
import { recordActivity } from '../utils/activityTracker';

export default function Home() {
  const [showTimer, setShowTimer] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [focusMode, setfocusMode] = useState(false);
  const appRef = useRef<HTMLDivElement>(null);

  const toggleTimer = () => {
    setShowTimer(!showTimer);
  };

  const toggleHeatmap = () => {
    setShowHeatmap((prev) => !prev);
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

  // Handler for creating a new note
  const handleNewNote = async () => {
    // Only save if there is content or title
    if ((noteState.title.trim() || noteState.content.trim()) && noteState.noteId) {
      // Save the current note (autosave will handle it, but force update to be sure)
      // Optionally, you could call updateNote here directly, but autosave should handle it
      setNoteState({ ...noteState }); // trigger autosave effect
      await new Promise(resolve => setTimeout(resolve, 200)); // give autosave a moment
    }
    recordActivity(); // Track activity when user creates a new note
    setNoteState({ noteId: null, title: '', content: '' });
  };

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
        maxWidth: isEditorExpanded ? '1200px' : '1200px', 
        margin: '0 auto',
        transition: 'max-width 0.3s ease'
      }}>
      <div style={{ 
        flex: isEditorExpanded ? 1 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        maxWidth: isEditorExpanded ? '100%' : showGrid ? '60%' : '70%',
        height: isEditorExpanded ? '1000px' : '950px',
        transition: 'max-width 0.3s ease'
      }}>
        <UserAvatar size={50}/>
        <div 
          className={`button-group${focusMode ? ' focusMode-active' : ''}`}
          style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem', position: 'relative' }}
        >
          <PressableButton
            onClick={() => setfocusMode((prev) => !prev)}
            className="key-effect focus-mode-btn button-corner-anim"
            aria-label={focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
            data-tooltip-id="focus-mode-tooltip"
            data-tooltip-content={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            style={{
              background: focusMode ? '#232323' : 'rgb(255,139,125)',
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

          <PressableButton
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
          </PressableButton>
        </div>
        {!focusMode && showGrid ? (
          <DocumentGrid onSelectNote={(note) => { 
            recordActivity(); // Track activity when user selects a note from grid
            setNoteState(note); 
            setShowGrid(false); 
          }} />
        ) : (
          <NoteEditor
            noteId={noteState.noteId}
            title={noteState.title}
            content={noteState.content}
            onNoteChange={setNoteState}
            onNewNote={handleNewNote}
          />
        )}
      </div>
      
      {!focusMode && showTimer && (
        <div style={{ 
          flex: timerRunning ? 0 : 0, 
          minWidth: timerRunning ? '200px' : '330px',
          opacity: 1,
          transform: 'translateX(0)',
          transition: 'all 0.3s ease'
        }}>
          <Timer onStateChange={handleTimerStateChange} />
        </div>
      )}

      {!focusMode && showHeatmap && (
        <div>
          <CalendarHeatMap />
          <ReactTooltip id="heatmap-tooltip" anchorSelect="rect[data-tooltip-id='heatmap-tooltip']" />
        </div>
      )}

      {/* tool tips for the menu buttons */}
      <ReactTooltip id="focus-mode-tooltip" anchorSelect="[data-tooltip-id='focus-mode-tooltip']" />
      <ReactTooltip id="document-grid-tooltip" anchorSelect="[data-tooltip-id='document-grid-tooltip']" />
      <ReactTooltip id="timer-tooltip" anchorSelect="[data-tooltip-id='timer-tooltip']" />
      <ReactTooltip id="activity-tracker-tooltip" anchorSelect="[data-tooltip-id='activity-tracker-tooltip']" />
    </div>
    
  );
}
