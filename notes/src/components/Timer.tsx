import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  className?: string;
  onStateChange?: (isRunning: boolean) => void;
}

const Timer: React.FC<TimerProps> = ({ className = '', onStateChange }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [customTime, setCustomTime] = useState(25);
  const [mode, setMode] = useState<'work' | 'break' | 'longBreak'>('work');
  
  const timerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);

  const workTime = 25 * 60;
  const breakTime = 5 * 60;
  const longBreakTime = 15 * 60;

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(isRunning);
    }
  }, [isRunning, onStateChange]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgress = (): number => {
    const totalTime = mode === 'work' ? workTime : mode === 'break' ? breakTime : longBreakTime;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  // Start timer
  const startTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
    updateProgress();
  };

  // Pause timer
  const pauseTimer = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  // Reset timer to original time
  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(mode === 'work' ? workTime : mode === 'break' ? breakTime : longBreakTime);
    resetProgress();
  };

  // Reset to custom time
  const resetToCustom = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(customTime * 60);
    resetProgress();
  };

  // Set custom time
  const handleCustomTimeChange = (minutes: number) => {
    setCustomTime(minutes);
    if (!isRunning && !isPaused) {
      setTimeLeft(minutes * 60);
    }
  };

  // Switch modes
  const switchMode = (newMode: 'work' | 'break' | 'longBreak') => {
    setMode(newMode);
    setIsRunning(false);
    setIsPaused(false);
    const newTime = newMode === 'work' ? workTime : newMode === 'break' ? breakTime : longBreakTime;
    setTimeLeft(newTime);
    resetProgress();
  };

  // Update progress circle
  const updateProgress = () => {
    if (progressRef.current) {
      const progress = getProgress();
      progressRef.current.style.strokeDashoffset = `${283 - (283 * progress) / 100}`;
    }
  };

  // Reset progress circle
  const resetProgress = () => {
    if (progressRef.current) {
      progressRef.current.style.strokeDashoffset = '0';
    }
  };

  // Timer countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer finished
            setIsRunning(false);
            setIsPaused(false);
            
            // Timer completed
            if (timerRef.current) {
              // Add a simple CSS animation class
              timerRef.current.style.transform = 'scale(1.05)';
              setTimeout(() => {
                if (timerRef.current) {
                  timerRef.current.style.transform = 'scale(1)';
                }
              }, 200);
            }

            // Switch to next mode
            if (mode === 'work') {
              switchMode('break');
            } else {
              switchMode('work');
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, mode]);

  // Update progress when time changes
  useEffect(() => {
    updateProgress();
  }, [timeLeft]);

  // Minimized timer view when running
  if (isRunning) {
    return (
      <div className={`timer-container ${className}`}>
        <div 
          ref={timerRef}
          className="timer-card minimized"
          style={{
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            maxWidth: '200px',
            margin: '0 auto',
            padding: '1rem',
          }}
        >
          {/* Mode indicator */}
          <div style={{ 
            fontSize: '0.8rem', 
            opacity: 0.8, 
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            fontWeight: '500'
          }}>
            {mode === 'work' ? 'Work' : mode === 'break' ? 'Break' : 'Long Break'}
          </div>

          {/* Timer display - smaller */}
          <div style={{ position: 'relative', margin: '0.5rem 0' }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)', display: 'inline-block' }}>
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="6"
              />
              <circle
                ref={progressRef}
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="6"
                strokeDasharray="157"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Controls - minimized */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={pauseTimer}
              className="button"
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', margin: '0 0.25rem' }}
            >
              Pause
            </button>
            
            <button
              onClick={resetTimer}
              className="button"
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', margin: '0 0.25rem' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full timer view when not running
  return (
    <div className={`timer-container ${className}`}>
      <div 
        ref={timerRef}
        className="timer-card"
        style={{
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '2rem 0.5rem',
          height: '520px'
        }}
      >
        {/* Mode indicator */}
        <div className="mode-indicator" style={{ marginBottom: '1rem' }}>
          <div className="mode-buttons" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={() => switchMode('work')}
              style={{
                background: mode === 'work' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                color: '#232323',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Work
            </button>
            <button
              onClick={() => switchMode('break')}
              style={{
                background: mode === 'break' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                color: '#232323',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Break
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              style={{
                background: mode === 'longBreak' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                color: '#232323',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Long Break
            </button>
          </div>
        </div>

        {/* Timer display */}
        <div className="timer-display" style={{ position: 'relative', margin: '2rem 0' }}>
          <svg width="200" height="200" style={{ transform: 'rotate(-90deg)', display: 'inline-block' }}>
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="8"
            />
            <circle
              ref={progressRef}
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset="0"
              strokeLinecap="round"
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '2.5rem',
            fontWeight: 'bold'
          }}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Controls */}
        <div className="timer-controls" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="button"
              style={{ fontSize: '1rem', padding: '0.75rem 2rem', margin: '0 0.25rem' }}
            >
              Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="button"
              style={{ fontSize: '1rem', padding: '0.75rem 2rem', margin: '0 0.25rem' }}
            >
              Pause
            </button>
          )}
          
          <button
            onClick={resetTimer}
            className="button"
            style={{ fontSize: '1rem', padding: '0.75rem 1.5rem', margin: '0 0.25rem' }}
          >
            Reset
          </button>
        </div>

        {/* Custom time input */}
        <div className="custom-time" style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Custom Time (minutes):
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={customTime}
            onChange={(e) => handleCustomTimeChange(parseInt(e.target.value) || 25)}
            style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              padding: '0.5rem',
              color: '#232323',
              width: '80px',
              textAlign: 'center'
            }}
          />
          <button
            onClick={resetToCustom}
            className="button"
            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
          >
            Set
          </button>
        </div>


      </div>
    </div>
  );
};

export default Timer; 