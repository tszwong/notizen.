import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { getUserNotes, deleteNote } from '../utils/notesFirestore';
import type { Note } from '../utils/notesFirestore';
import { useAuth } from './auth/AuthProvider';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import DeleteIcon from '@mui/icons-material/Delete';

const columns: GridColDef[] = [
  { field: 'title', headerName: 'Title', width: 200 },
  {
    field: 'createdAt',
    headerName: 'Created On',
    width: 200,
    renderCell: (params) => {
      const val = params.row?.createdAt;
      if (val && typeof val.toDate === 'function') {
        return val.toDate().toLocaleString();
      }
      return '';
    },
  },
  {
    field: 'updatedAt',
    headerName: 'Last Updated',
    width: 200,
    renderCell: (params) => {
      const val = params.row?.updatedAt;
      if (val && typeof val.toDate === 'function') {
        return val.toDate().toLocaleString();
      }
      return '';
    },
  },
];

interface DocumentsGridProps {
  onSelectNote: (note: { noteId: string; title: string; content: string }) => void;
  height?: string | number;
}

export default function DocumentsGrid({ onSelectNote, height }: DocumentsGridProps) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const fetchNotes = () => {
    if (!user) return;
    setLoading(true);
    getUserNotes(user.uid)
      .then(notes => setRows(addDefaultTitles(notes))) // Apply default titles
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  useEffect(() => {
    if (!loading) {
      // Add a delay before hiding the skeleton
      const timeout = setTimeout(() => setShowSkeleton(false), 50); // 300ms delay
      return () => clearTimeout(timeout);
    } else {
      setShowSkeleton(true);
    }
  }, [loading]);

  const handleRowClick = (params: any) => {
    onSelectNote({ noteId: params.row.id, title: params.row.title, content: params.row.content });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      await deleteNote(id);
      fetchNotes();
    }
  };

  const addDefaultTitles = (notes: Note[]) => {
    return notes.map(note => ({
      ...note,
      title: note.title?.trim() || 'Untitled Note', // Assign "Untitled Note" if the title is empty or null
    }));
  };

  return (
    <div className="note-editor-card" style={{ height: height ?? '900px', padding: '2rem' }}>
      <div style={{ transition: 'opacity 0.3s', opacity: showSkeleton ? 1 : 0, position: showSkeleton ? 'static' : 'absolute', width: '100%' }}>
        {showSkeleton && (
          <Box sx={{ width: '100%' }}>
            <Skeleton height={40} style={{ marginBottom: 8 }} />
            <Skeleton animation="wave" height={40} style={{ marginBottom: 8 }} />
            <Skeleton animation={false} height={40} />
          </Box>
        )}
      </div>
      <div style={{ transition: 'opacity 0.3s', opacity: showSkeleton ? 0 : 1 }}>
        {!showSkeleton && (
          <DataGrid
            rows={rows}
            columns={[
              ...columns,
              {
                field: 'actions',
                headerName: 'Actions',
                width: 120,
                renderCell: (params) => (
                  <div
                    style={{
                      display: 'flex',
                      // justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <button
                      style={{
                        background: '#e57373',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        padding: 0,
                        cursor: 'pointer',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        await handleDelete(params.row.id);
                      }}
                    >
                      <DeleteIcon style={{ fontSize: '20px' }} />
                    </button>
                  </div>
                ),
              },
            ]}
            loading={loading}
            getRowId={row => row.id}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
            onRowClick={handleRowClick}
          />
        )}
      </div>
    </div>
  );
}
