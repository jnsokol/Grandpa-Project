import { useEffect, useRef, useState } from 'react';
import { useAuthStore, requestToken, isTokenValid, tokenHasScope } from '../../lib/google/auth';
import { googleScopes } from '../../lib/google/scopes';
import {
  fetchTaskLists,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  type Task,
  type TaskList,
} from '../../lib/google/tasks-api';
import { useTileStore } from '../../lib/store/tile-store';
import type { TodoTile } from '../../lib/store/tiles';

const SCOPE = googleScopes.tasks;

type Props = { tile: TodoTile };

export function GoogleTasksTile({ tile }: Props) {
  const token = useAuthStore((s) => s.token);
  const updateTile = useTileStore((s) => s.updateTile);

  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const connected = isTokenValid(token) && tokenHasScope(token, SCOPE);
  const activeListId = tile.taskListId;

  useEffect(() => {
    if (!connected || !token) return;
    setLoading(true);
    setError(null);
    fetchTaskLists(token.access_token)
      .then((lists) => {
        setTaskLists(lists);
        const firstId = lists[0]?.id;
        if (!activeListId && firstId) {
          updateTile({ ...tile, taskListId: firstId });
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load task lists'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, token?.access_token]);

  useEffect(() => {
    if (!connected || !token || !activeListId) return;
    setLoading(true);
    setError(null);
    fetchTasks(token.access_token, activeListId)
      .then(setTasks)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load tasks'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, token?.access_token, activeListId]);

  async function handleAdd() {
    if (!token || !activeListId || !newTitle.trim()) return;
    try {
      const task = await createTask(token.access_token, activeListId, newTitle.trim());
      setTasks((prev) => [task, ...prev]);
      setNewTitle('');
      setAdding(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add task');
    }
  }

  async function handleToggle(task: Task) {
    if (!token || !activeListId) return;
    const updated: Task = {
      ...task,
      status: task.status === 'completed' ? 'needsAction' : 'completed',
    };
    try {
      const result = await updateTask(token.access_token, activeListId, updated);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? result : t)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update task');
    }
  }

  async function handleDelete(taskId: string) {
    if (!token || !activeListId) return;
    try {
      await deleteTask(token.access_token, activeListId, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete task');
    }
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-slate-500">Connect your Google account to manage tasks.</p>
        <button
          onClick={() => requestToken(SCOPE).catch(() => {})}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Connect Google Tasks
        </button>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => t.status === 'needsAction');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header row */}
      <div className="flex items-center justify-between shrink-0 gap-2">
        {taskLists.length > 1 ? (
          <select
            value={activeListId ?? ''}
            onChange={(e) => updateTile({ ...tile, taskListId: e.target.value })}
            className="text-sm text-slate-700 bg-transparent border-none outline-none cursor-pointer max-w-[120px] truncate"
          >
            {taskLists.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
        ) : (
          <span className="text-sm font-semibold text-slate-700 truncate">
            {taskLists[0]?.title ?? 'Tasks'}
          </span>
        )}
        <button
          onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 0); }}
          className="text-slate-400 hover:text-blue-600 transition-colors text-xl leading-none font-light shrink-0"
          aria-label="Add task"
        >
          +
        </button>
      </div>

      {/* Add task input */}
      {adding && (
        <div className="flex gap-1 shrink-0">
          <input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }}}
            placeholder="New task…"
            className="flex-1 text-sm border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-400"
          />
          <button onClick={handleAdd} className="text-sm px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
          <button onClick={() => { setAdding(false); setNewTitle(''); }} className="text-sm px-2 py-1 text-slate-500 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Status */}
      {loading && <p className="text-sm text-slate-400 text-center">Loading…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Active tasks */}
      {!loading && (
        <ul className="flex flex-col gap-1 overflow-auto flex-1 min-h-0">
          {activeTasks.length === 0 && (
            <li className="text-sm text-slate-400 text-center py-2">No tasks — add one!</li>
          )}
          {activeTasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
          ))}

          {/* Completed section */}
          {completedTasks.length > 0 && (
            <li className="mt-1">
              <button
                onClick={() => setShowCompleted((v) => !v)}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showCompleted ? '▾' : '▸'} Completed ({completedTasks.length})
              </button>
              {showCompleted && (
                <ul className="flex flex-col gap-1 mt-1">
                  {completedTasks.map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
                  ))}
                </ul>
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

type TaskRowProps = {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
};

function TaskRow({ task, onToggle, onDelete }: TaskRowProps) {
  const done = task.status === 'completed';
  return (
    <li className="flex items-center gap-2 group rounded px-1 py-0.5 hover:bg-slate-50">
      <button
        onClick={() => onToggle(task)}
        className={`w-4 h-4 shrink-0 rounded border ${done ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-400'} flex items-center justify-center text-xs transition-colors`}
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
      >
        {done && '✓'}
      </button>
      <span className={`flex-1 text-sm truncate ${done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
        {task.title}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all text-sm leading-none"
        aria-label="Delete task"
      >
        ×
      </button>
    </li>
  );
}
