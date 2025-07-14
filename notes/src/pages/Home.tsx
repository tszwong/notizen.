import React, { useState } from "react";
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import NoteEditor from "../components/NoteEditor";
import Timer from "../components/Timer";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DocumentGrid from "../components/DocumentsGrid";
import CalendarHeatMap from "../components/CalendarHeatMap";
import { Tooltip as ReactTooltip } from 'react-tooltip';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

export default function Home() {
  const [showTimer, setShowTimer] = useState(true);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);

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
  const isEditorExpanded = !showTimer || timerRunning;

  return (
    <div style={{ 
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
        alignItems: isEditorExpanded ? 'stretch' : 'stretch',
        maxWidth: isEditorExpanded
          ? '100%'
          : showGrid
            ? '60%'
            : '70%',
        height: isEditorExpanded ? '1000px' : '950px',
        transition: 'max-width 0.3s ease'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          marginBottom: '1rem' 
        }}>
          <button
            onClick={() => setShowGrid((prev) => !prev)}
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
            onClick={toggleTimer}
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
            onClick={toggleHeatmap}
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
        {showGrid ? (
          <DocumentGrid />
        ) : (
          <NoteEditor />
        )}
      </div>
      
      {showTimer && (
        <div style={{ 
          flex: timerRunning ? 0 : 0, 
          minWidth: timerRunning ? '200px' : '400px',
          opacity: 1,
          transform: 'translateX(0)',
          transition: 'all 0.3s ease'
        }}>
          <Timer onStateChange={handleTimerStateChange} />
        </div>
      )}

      {showHeatmap && (
        <div>
          <CalendarHeatMap />
          <ReactTooltip id="heatmap-tooltip" anchorSelect="rect[data-tooltip-id='heatmap-tooltip']" />
        </div>
      )}
    </div>
    
  );
}
