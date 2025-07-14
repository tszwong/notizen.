import React, { useState, useRef, useEffect } from "react";
import NoteEditor from "../components/NoteEditor";
import Timer from "../components/Timer";
import DocumentGrid from "../components/DocumentsGrid";
import CalendarHeatMap from "../components/CalendarHeatMap";

import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayLessonIcon from '@mui/icons-material/PlayLesson';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import { Tooltip as ReactTooltip } from 'react-tooltip';

export default function Home() {
  const [showTimer, setShowTimer] = useState(true);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [studyMode, setStudyMode] = useState(false);
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

  // Determine if editor should be expanded
  const isEditorExpanded = studyMode || !showTimer || timerRunning;

  // Check if we need to enter or exit fullscreen mode
  useEffect(() => {
    const el = appRef.current;
    if (studyMode && el && !document.fullscreenElement) {
      el.requestFullscreen?.();
    } else if (!studyMode && document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }, [studyMode]);

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
        <div 
          className={`button-group${studyMode ? ' study-mode-active' : ''}`}
          style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem', position: 'relative' }}
        >
          <button
            className="study-mode-btn"
            onClick={() => setStudyMode((prev) => !prev)}
            data-tooltip-id="study-mode-tooltip"
            data-tooltip-content={studyMode ? "Exit Study Mode" : "Enter Study Mode"}
            style={{
              background: studyMode ? '#232323' : 'rgb(207,199,181)',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.2rem',
              fontWeight: '500',
              boxShadow: '0 4px 15px rgb(207,199,181)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50px',
              height: '50px',
              marginRight: '1rem',
              zIndex: 2
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgb(207,199,181)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgb(207,199,181)';
            }}
          >
            {studyMode ? "⏹" : <PlayLessonIcon />}
          </button>

          <button
            className="hide-when-study"
            onClick={() => setShowGrid((prev) => !prev)}
            data-tooltip-id="document-grid-tooltip"
            data-tooltip-content="Documents"
            style={{
              background: 'rgb(207,199,181)',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.2rem',
              fontWeight: '500',
              boxShadow: '0 4px 15px rgb(207,199,181)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50px',
              height: '50px',
              marginRight: '1rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgb(207,199,181)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgb(207,199,181)';
            }}
          >
            {showGrid ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </button>

          <button
            className="hide-when-study"
            onClick={toggleTimer}
            data-tooltip-id="timer-tooltip"
            data-tooltip-content="Pomodoro Timer"
            style={{
              background: 'rgb(207,199,181)',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.2rem',
              fontWeight: '500',
              boxShadow: '0 4px 15px rgb(207,199,181)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50px',
              height: '50px',
              marginRight: '1rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgb(207,199,181)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgb(207,199,181)';
            }}
          >
            <AccessAlarmIcon />
          </button>

          <button
            className="hide-when-study"
            onClick={toggleHeatmap}
            data-tooltip-id="activity-tracker-tooltip"
            data-tooltip-content="Activity Tracker"
            style={{
              background: 'rgb(207,199,181)',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '50%',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.2rem',
              fontWeight: '500',
              boxShadow: '0 4px 15px rgb(207,199,181)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50px',
              height: '50px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgb(207,199,181)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgb(207,199,181)';
            }}
          >
            <CalendarTodayIcon />
          </button>
        </div>
        {!studyMode && showGrid ? (
          <DocumentGrid />
        ) : (
          <NoteEditor />
        )}
      </div>
      
      {!studyMode && showTimer && (
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

      {!studyMode && showHeatmap && (
        <div>
          <CalendarHeatMap />
          <ReactTooltip id="heatmap-tooltip" anchorSelect="rect[data-tooltip-id='heatmap-tooltip']" />
        </div>
      )}

      {/* tool tips for the menu buttons */}
      <ReactTooltip id="study-mode-tooltip" />
      <ReactTooltip id="document-grid-tooltip" />
      <ReactTooltip id="timer-tooltip" />
      <ReactTooltip id="activity-tracker-tooltip" />
    </div>
    
  );
}
