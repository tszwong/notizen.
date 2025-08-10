import React, { useState } from "react";
import { Trash2, Plus, GripVertical, Check } from "lucide-react";
import { ChecklistItem } from "../types/todo";

interface ToDoListProps {
  title: string;
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  onDelete?: () => void;
  defaultMinimized?: boolean; // Add this
}

const ToDoList: React.FC<ToDoListProps> = ({
  title, items, onChange, onDelete, defaultMinimized = true
}) => {
    const [input, setInput] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
    const [description, setDescription] = useState("");
    const [holdingItem, setHoldingItem] = useState<string | null>(null);
    const [holdAction, setHoldAction] = useState<'complete' | 'delete' | null>(null);
    const [holdProgress, setHoldProgress] = useState(0);
    const [holdTimer, setHoldTimer] = useState<number | null>(null);
    const [showError, setShowError] = useState<string | null>(null);
    const [minimized, setMinimized] = useState(defaultMinimized);

    const handleAdd = () => {
        console.log('handleAdd called with:', { input, dueDate, priority, description });
        
        // Only check if task name is provided
        if (!input.trim()) {
            setShowError("Task name is required.");
            return;
        }

        // Create new item with proper handling of optional fields
        const newItem: ChecklistItem = {
            id: Date.now().toString(),
            task: input.trim(),
            completed: false,
            priority, // This will always have a value since it defaults to "medium"
        };

        // Only add dueDate if it has a value
        if (dueDate && dueDate.trim()) {
            newItem.dueDate = dueDate;
        }

        // Only add description if it has content after trimming
        if (description && description.trim()) {
            newItem.description = description.trim();
        }

        // Add the new item to the list
        console.log('Adding new item:', newItem);
        console.log('Current items:', items);
        onChange([...items, newItem]);
        
        // Reset form fields
        setInput("");
        setDueDate("");
        setPriority("medium");
        setDescription("");
        setShowError(null);
    };

    const handleToggle = (id: string) => {
        onChange(
        items.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        )
        );
    };

  const handleDelete = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const startHold = (itemId: string, action: 'complete' | 'delete') => {
    if (holdingItem) return;
    
    setHoldingItem(itemId);
    setHoldAction(action);
    setHoldProgress(0);
    
    const duration = 1500;
    const interval = 16;
    const increment = (interval / duration) * 100;
    
    let progress = 0;
    const timer = setInterval(() => {
      progress += increment;
      setHoldProgress(progress);
      
      if (progress >= 100) {
        clearInterval(timer);
        if (action === 'complete') {
          handleToggle(itemId);
        } else if (action === 'delete') {
          handleDelete(itemId);
        }
        setHoldingItem(null);
        setHoldAction(null);
        setHoldProgress(0);
      }
    }, interval);
    
    setHoldTimer(timer);
  };

  const cancelHold = () => {
    if (holdTimer) {
      clearInterval(holdTimer);
      setHoldTimer(null);
    }
    setHoldingItem(null);
    setHoldAction(null);
    setHoldProgress(0);
  };

  const reorderItems = (startIndex: number, endIndex: number) => {
    const result = Array.from(items);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    onChange(result);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== dropIndex) {
      reorderItems(dragIndex, dropIndex);
    }
  };

  return (
    <div className="bg-white rounded-lg todo-list-card">
      {/* Error popup */}
      {showError && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white rounded p-6 max-w-xs w-full">
            <div className="mb-4 text-red-600 font-medium">
              {showError}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowError(null)}
                className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with title and delete button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-gray-800">
            {title}
            {minimized && (
              <span className="ml-3 text-base text-gray-500 font-normal align-middle">
                ({items.length} item{items.length !== 1 ? "s" : ""})
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized((m) => !m)}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
            title={minimized ? "Expand list" : "Minimize list"}
          >
            {minimized ? (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Delete this list"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
      
      {/* Add new item form */}
      {!minimized && (
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add new item..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
                onClick={handleAdd}
                style={{
                    backgroundColor: '#1a659e',
                    cursor: 'pointer',
                }}
                className="px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as "high" | "medium" | "low")}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
        </div>
      )}

      {/* Items list */}
      {!minimized && (
        <div className="space-y-2">
          {/* Header row */}
          <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr] gap-3 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div>Task</div>
            <div>Description</div>
            <div>Priority</div>
            <div>Due</div>
            <div className="text-center">Actions</div>
          </div>

          {items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                relative cursor-move select-none rounded-lg overflow-hidden
                ${item.completed ? 'opacity-60' : ''}
                transition-all duration-200 ease-out
              `}
            >
              {/* Progress bar background - now covers full width */}
              {holdingItem === item.id && (
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    width: `${holdProgress}%`,
                    background: holdAction === 'complete'
                      ? 'rgba(34,197,94,0.3)'
                      : 'rgba(239,68,68,0.3)',
                    transition: 'width 0.016s linear',
                  }}
                />
              )}

              {/* Content grid - positioned above progress bar */}
              <div className={`grid grid-cols-[2fr_3fr_1fr_1fr_1fr] gap-3 items-center p-3 relative z-10 ${
                holdingItem === item.id ? 'bg-transparent' : 'bg-gray-50'
              }`}>
                {/* Task */}
                <div className="flex items-center gap-2 break-words whitespace-pre-wrap" style={{ minHeight: 32 }}>
                    <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggle(item.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {item.task}
                    </span>
                </div>

                {/* Description */}
                <div className="break-words whitespace-pre-wrap text-sm text-gray-500">{item.description}</div>
                
                {/* Priority */}
                <div>
                    {item.priority && (
                        <span className={`text-xs font-semibold rounded px-2 py-1
                            ${item.priority === "high" ? "bg-red-100 text-red-700" : ""}
                            ${item.priority === "medium" ? "bg-yellow-100 text-yellow-700" : ""}
                            ${item.priority === "low" ? "bg-green-100 text-green-700" : ""}
                            `}>
                            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                        </span>
                    )}
                </div>
                
                {/* Due */}
                <div className="text-sm text-gray-500">
                  {item.dueDate && new Date(item.dueDate).toLocaleDateString()}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 justify-center">
                    <button
                        onMouseDown={() => startHold(item.id, 'complete')}
                        onMouseUp={cancelHold}
                        onMouseLeave={cancelHold}
                        onTouchStart={() => startHold(item.id, 'complete')}
                        onTouchEnd={cancelHold}
                        className={`
                            p-2 rounded-full transition-all duration-200
                            ${item.completed 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-green-100 text-green-600 hover:bg-green-200 active:bg-green-300'
                            }
                            ${holdingItem === item.id && holdAction === 'complete' ? 'scale-110 shadow-lg' : ''}
                        `}
                        disabled={item.completed}
                        title="Hold to complete"
                    >
                        <Check size={16} />
                    </button>
                    <button
                        onMouseDown={() => startHold(item.id, 'delete')}
                        onMouseUp={cancelHold}
                        onMouseLeave={cancelHold}
                        onTouchStart={() => startHold(item.id, 'delete')}
                        onTouchEnd={cancelHold}
                        className={`
                        p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300 transition-all duration-200
                        ${holdingItem === item.id && holdAction === 'delete' ? 'scale-110 shadow-lg' : ''}
                        `}
                        title="Hold to delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
              </div>
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No items yet
            </div>
          )}
        </div>
      )}

      {/* Usage hint */}
      {!minimized && (
        <div className="mt-4 text-xs text-gray-400 text-center">
          Drag items to reorder • Hold ✓ to complete • Hold 🗑️ to delete
        </div>
      )}
    </div>
  );
};

export default ToDoList;