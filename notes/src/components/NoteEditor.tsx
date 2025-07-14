import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import html2pdf from 'html2pdf.js';

interface NoteEditorProps {
  onContentChange?: (content: string) => void;
  className?: string;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ onContentChange, className = '' }) => {
    const [content, setContent] = useState<string>("");

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

  const handleChange = (value: string) => {
    setContent(value);
    if (onContentChange) {
      onContentChange(value);
    }
  };

  const downloadPDF = () => {
    const editor = document.querySelector('.ql-editor');
    if (editor) {
      html2pdf().from(editor).save('notes.pdf');
    }
  };

  return (
    <div className={`note-editor-container ${className}`}>
      <div 
        className="note-editor-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '2rem',
        }}
      >
    <ReactQuill
        theme="snow"
        value={content}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder="Start typing your notes..."
        style={{ 
        height: '800px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        overflow: 'hidden'
        }}
    />
    </div>
    <button onClick={downloadPDF} className="button" 
        style={{ marginTop: '1rem' }}>
            Download PDF
    </button>
    </div>
  );
};

export default NoteEditor;