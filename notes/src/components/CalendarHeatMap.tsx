import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import '../index.css'; // Ensure your color classes are loaded

export default function CalendarHeatMap() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    // const fullMonthName = today.toLocaleString('default', { month: 'long' });

    const startDate = new Date(year, month, 1);
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const endDate = new Date(year, month + 1, 0);
    const endDay = endDate.getDay();
    endDate.setDate(endDate.getDate() + (6 - endDay));
    // const daysInMonth = endDate.getDate();

    // Demo data
    const values: { date: string; count: number }[] = [];
    const current = new Date(startDate);

    // while (current <= endDate) {
    //     values.push({
    //         date: current.toISOString().split('T')[0],
    //         count: Math.floor(Math.random() * 5) // 0–4 for demo
    //     });
    //     current.setDate(current.getDate() + 1);
    // }

    return (
        <div
            style={{
                background: 'rgb(207,199,181)',
                borderRadius: '24px',
                boxShadow: '0 4px 24px rgba(207,199,181,0.25)',
                padding: '2rem 1.5rem',
                width: '170px',
                height: '240px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 auto',
                justifyContent: 'center',
            }}
        >
            <p
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                color: '#232323',
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: '0.02em',
                padding: '8px 15px',
                display: 'inline-block',
                borderRadius: '30px',
                marginTop: '10px'
            }}
            >
                Activity
            </p>
            <div
                style={{
                    // background: 'white',
                    borderRadius: '16px',
                    // boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    padding: '0.8rem 1rem 0.5rem',
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
                        if (value.count >= 4) return 'color-scale-4';
                        if (value.count >= 3) return 'color-scale-3';
                        if (value.count >= 2) return 'color-scale-2';
                        if (value.count >= 1) return 'color-scale-1';
                        return 'color-empty';
                    }}
                    // showWeekdayLabels={true}
                    tooltipDataAttrs={(value: { date?: string; count?: number }) => {
                        // if (!value?.date) return null;
                        return {
                            'data-tooltip-id': 'heatmap-tooltip',
                            // 'data-tooltip-content': `Date: ${value.date}, Count: ${value.count ?? 0}`
                            'data-tooltip-content': `Date: ${value.date}`
                        };
                    }}
                />
            </div>
        </div>
    );
}