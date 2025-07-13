// import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';

const columns = [
//   { field: 'id', headerName: 'ID', width: 90 },
  { field: 'title', headerName: 'Title', width: 200 },
  { field: 'date', headerName: 'Created On', width: 200 },
  { field: 'lastUpdated', headerName: 'Last Updated', width: 200 },
];

const rows = [
  { id: 1, title: 'Sample Note 1', date: '2021-01-01', lastUpdated: '2021-01-01' },
  { id: 2, title: 'Sample Note 2', date: '2022-01-01', lastUpdated: '2023-01-01' },
  { id: 3, title: 'Sample Note 3', date: '2021-01-01', lastUpdated: '2021-01-01' },
  { id: 4, title: 'Sample Note 4', date: '2023-01-01', lastUpdated: '2024-01-01' },
  { id: 5, title: 'Sample Note 5', date: '2023-01-02', lastUpdated: '2024-01-01' },
  { id: 6, title: 'Sample Note 6', date: '2023-01-03', lastUpdated: '2024-01-02' },
];

export default function NotesGrid() {
  return (
    <div
        className={`note-editor-card`}
        style={{ 
            height: '100%',
            width: '100%',
            padding: '2rem'
        }}
    >
        <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
        />
    </div>
  );
}
