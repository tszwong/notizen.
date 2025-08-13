import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import '../index.css'; // Ensure your color classes are loaded
import { useAuth } from './auth/AuthProvider';
import { getHeatmapData } from '../utils/activityTracker';

export default function CalendarHeatMap() {
    const { user } = useAuth();
    const [values, setValues] = useState<{ date: string; count: number }[]>([]);
    
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const startDate = new Date(year, month, 1);
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const endDate = new Date(year, month + 1, 0);
    const endDay = endDate.getDay();
    endDate.setDate(endDate.getDate() + (6 - endDay));

    // Load activity data
    useEffect(() => {
        if (!user) return;
        getHeatmapData(user, startDate, endDate).then(setValues);
    }, [user, startDate, endDate]);

    if (!user) return null;

    return (
        <div
            className='border-t border-gray-400'
            style={{
                // background: 'rgb(207,199,181)',
                backgroundColor: 'transparent',
                // boxShadow: '0 4px 24px rgba(207,199,181,0.25)',
                // padding: '2rem 1.5rem',
                width: '80%',
                maxWidth: '2250px',
                // height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 auto',
                marginTop: '1.25rem',
                justifyContent: 'center',
            }}
        >
            <p
                style={{
                    // backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    color: '#232323',
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    letterSpacing: '0.02em',
                    // padding: '8px 10px',
                    display: 'block',
                    borderRadius: '30px',
                    marginTop: '18px',
                    textAlign: 'left',
                    width: '100%',
                }}
            >
                Activity
            </p>
            <div
                style={{
                    borderRadius: '16px',
                    marginTop: '1rem',
                    padding: '0.25rem 1rem 0.5rem',
                    width: '95%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <CalendarHeatmap
                    startDate={startDate}
                    endDate={endDate}
                    values={values}
                    classForValue={(value: { date?: string; count?: number }) => {
                        if (!value || !value.count) return 'color-empty';
                        return 'color-scale-1'; // Any activity = active day
                    }}
                    tooltipDataAttrs={(value: { date?: string; count?: number }) => {
                        return {
                            'data-tooltip-id': 'heatmap-tooltip',
                            'data-tooltip-content': value?.date ? 
                                `${value.date}: ${value.count ? 'Active' : 'No activity'}` : 
                                'No activity'
                        };
                    }}
                />
            </div>
        </div>
    );
}