import React from 'react';
import { X } from 'lucide-react';

interface NewListModalProps {
    open: boolean;
    title?: string;
    isCreating?: boolean;
    value: string;
    onChange: (value: string) => void;
    onCancel: () => void;
    onCreate: () => void;
}

const NewListModal: React.FC<NewListModalProps> = ({
    open,
    title = "New List",
    isCreating = false,
    value,
    onChange,
    onCancel,
    onCreate,
}) => {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(2px)',
            }}
        >
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h2
                        className="text-xl font-semibold text-gray-900"
                        style={{
                            fontFamily: "'Nunito Sans', sans-serif",
                            color: 'black',
                            fontWeight: '900'
                        }}
                    >
                        {title}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                    </label>
                    <input
                        type="text"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && onCreate()}
                        placeholder="Enter list name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                    />
                </div>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onCreate}
                        disabled={!value.trim() || isCreating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewListModal;