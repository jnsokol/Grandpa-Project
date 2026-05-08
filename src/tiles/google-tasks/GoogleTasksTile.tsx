import { useEffect, useRef, useState } from 'react';
import { useAuthStore, isTokenValid } from '../../lib/google/auth';
import {
  fetchTaskLists, fetchTasks, createTask, updateTask, deleteTask,
  type Task, type TaskList,
} from '../../lib/google/tasks-api';
import { useTileStore } from '../../lib/store/tile-store';
import type { TodoTile } from '../../lib/store/tiles';

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

  const connected = isTokenValid(token);
  const activeListId = tile.taskListId;

  useEffect(() => {
    if (!connected || !token) return;
    setLoading(true);
    fetchTaskLists(token.access_token)
      .then((lists) => {
        setTaskLists(lists);
        if (!activeListId && lists[0]?.id) updateTile({ ...tile, taskListId: lists[0].id });
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, token?.access_token]);

  useEffect(() => {
    if (!connected || !token || !activeListId) return;
    setLoading(true);
    fetchTasks(token.access_token, activeListId)
      .then(setTasks)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, token?.access_token, activeListId]);

  async function handleAdd() {
    if (!token || !activeListId || !newTitle.trim()) return;
    const task = await createTask(token.access_token, activeListId, newTitle.trim());
    setTasks((p) => [task, ...p]);
    setNewTitle('');
    setAdding(false);
  }

  async function handleToggle(task: Task) {
    if (!token || !activeListId) return;
    const updated = { ...task, status: task.status === 'completed' ? 'needsAction' : 'completed' } as Task;
    const result = await updateTask(token.access_token, activeListId, updated);
    setTasks((p) => p.map((t) => (t.id === task.id ? result : t)));
  }

  async function handleDelete(taskId: string) {
    if (!token || !activeListId) return;
    await deleteTask(token.access_token, activeListId, taskId);
    setTasks((p) => p.filter((t) => t.id !== taskId));
  }

  const activeTasks = tasks.filter((t) => t.status === 'needsAction');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div>
          <p className="text-base font-bold">✅ Tasks</p>
          {taskLists.length > 1 ? (
            <select
              value={activeListId ?? ''}
              onChange={(e) => updateTile({ ...tile, taskListId: e.target.value })}
              className="text-xs text-zinc-400 bg-transparent border-none outline-none cursor-pointer mt-0.5"
            >
              {taskLists.map((l) => <option key={l.id} value={l.id} className="text-slate-800">{l.title}</option>)}
            </select>
          ) : (
            <p className="text-zinc-400 text-xs">{taskLists[0]?.title ?? 'My Tasks'}</p>
          )}
        </div>
        <button
          onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 0); }}
          className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold text-lg transition-colors"
          aria-label="Add task"
        >+</button>
      </div>

      {/* Add task input */}
      {adding && (
        <div className="flex gap-1 mx-3 mb-2 shrink-0">
          <input
            ref={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNewTitle(''); } }}
            placeholder="New task…"
            className="flex-1 bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/50"
          />
          <button onClick={handleAdd} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold text-white transition-colors">Add</button>
        </div>
      )}

      {/* Tasks list */}
      <div className="flex-1 overflow-auto px-3 pb-3 min-h-0 flex flex-col gap-1">
        {loading && <p className="text-zinc-400 text-sm text-center mt-4">Loading…</p>}
        {error && <p className="text-red-300 text-xs">{error}</p>}

        {!loading && activeTasks.length === 0 && (
          <p className="text-zinc-400 text-sm text-center mt-4">No tasks — add one!</p>
        )}

        {activeTasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
        ))}

        {completedTasks.length > 0 && (
          <div className="mt-1">
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {showCompleted ? '▾' : '▸'} Completed ({completedTasks.length})
            </button>
            {showCompleted && completedTasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: (t: Task) => void; onDelete: (id: string) => void }) {
  const done = task.status === 'completed';
  return (
    <div className="flex items-center gap-2 group rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2 transition-colors">
      <button
        onClick={() => onToggle(task)}
        className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center text-xs transition-colors ${
          done ? 'bg-white border-white text-zinc-700' : 'border-white/50 hover:border-white'
        }`}
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
      >
        {done && '✓'}
      </button>
      <span className={`flex-1 text-sm truncate transition-colors ${done ? 'line-through text-white/40' : 'text-white'}`}>
        {task.title}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-300 transition-all text-base leading-none"
        aria-label="Delete task"
      >×</button>
    </div>
  );
}
