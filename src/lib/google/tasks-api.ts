export type TaskList = {
  id: string;
  title: string;
};

export type Task = {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  due?: string;
  notes?: string;
};

const BASE = 'https://tasks.googleapis.com/tasks/v1';

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function fetchTaskLists(token: string): Promise<TaskList[]> {
  const r = await fetch(`${BASE}/users/@me/lists?maxResults=20`, { headers: headers(token) });
  if (!r.ok) throw new Error(`Tasks API ${r.status}`);
  const data = await r.json() as { items?: TaskList[] };
  return data.items ?? [];
}

export async function fetchTasks(token: string, taskListId: string): Promise<Task[]> {
  const r = await fetch(
    `${BASE}/lists/${encodeURIComponent(taskListId)}/tasks?showCompleted=true&showHidden=false&maxResults=50`,
    { headers: headers(token) },
  );
  if (!r.ok) throw new Error(`Tasks API ${r.status}`);
  const data = await r.json() as { items?: Task[] };
  return data.items ?? [];
}

export async function createTask(token: string, taskListId: string, title: string): Promise<Task> {
  const r = await fetch(
    `${BASE}/lists/${encodeURIComponent(taskListId)}/tasks`,
    { method: 'POST', headers: headers(token), body: JSON.stringify({ title }) },
  );
  if (!r.ok) throw new Error(`Tasks API ${r.status}`);
  return r.json() as Promise<Task>;
}

export async function updateTask(token: string, taskListId: string, task: Task): Promise<Task> {
  const r = await fetch(
    `${BASE}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(task.id)}`,
    { method: 'PUT', headers: headers(token), body: JSON.stringify(task) },
  );
  if (!r.ok) throw new Error(`Tasks API ${r.status}`);
  return r.json() as Promise<Task>;
}

export async function deleteTask(token: string, taskListId: string, taskId: string): Promise<void> {
  const r = await fetch(
    `${BASE}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: 'DELETE', headers: headers(token) },
  );
  if (!r.ok) throw new Error(`Tasks API ${r.status}`);
}
