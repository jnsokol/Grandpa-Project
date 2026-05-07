import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoogleTasksTile } from './GoogleTasksTile';
import * as auth from '../../lib/google/auth';
import * as tasksApi from '../../lib/google/tasks-api';

const tile = { kind: 'todo' as const, id: 'todo-test', provider: 'google-tasks' as const };

const validToken: auth.TokenData = {
  access_token: 'tok',
  scope: 'https://www.googleapis.com/auth/tasks',
  expires_at: Date.now() + 3_600_000,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GoogleTasksTile', () => {
  it('shows connect button when not authenticated', () => {
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token: null, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    render(<GoogleTasksTile tile={tile} />);
    expect(screen.getByText('Connect Google Tasks')).toBeInTheDocument();
  });

  it('shows loading state while fetching task lists', () => {
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token: validToken, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    vi.spyOn(tasksApi, 'fetchTaskLists').mockReturnValue(new Promise(() => {}));
    vi.spyOn(tasksApi, 'fetchTasks').mockReturnValue(new Promise(() => {}));
    render(<GoogleTasksTile tile={{ ...tile, taskListId: 'list-1' }} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders tasks from API', async () => {
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token: validToken, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    vi.spyOn(tasksApi, 'fetchTaskLists').mockResolvedValue([{ id: 'list-1', title: 'My Tasks' }]);
    vi.spyOn(tasksApi, 'fetchTasks').mockResolvedValue([
      { id: 't1', title: 'Buy milk', status: 'needsAction' },
    ]);
    render(<GoogleTasksTile tile={{ ...tile, taskListId: 'list-1' }} />);
    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
  });

  it('shows empty message when there are no active tasks', async () => {
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token: validToken, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    vi.spyOn(tasksApi, 'fetchTaskLists').mockResolvedValue([{ id: 'list-1', title: 'My Tasks' }]);
    vi.spyOn(tasksApi, 'fetchTasks').mockResolvedValue([]);
    render(<GoogleTasksTile tile={{ ...tile, taskListId: 'list-1' }} />);
    expect(await screen.findByText('No tasks — add one!')).toBeInTheDocument();
  });

  it('adds a new task via input', async () => {
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token: validToken, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    vi.spyOn(tasksApi, 'fetchTaskLists').mockResolvedValue([{ id: 'list-1', title: 'My Tasks' }]);
    vi.spyOn(tasksApi, 'fetchTasks').mockResolvedValue([]);
    const newTask = { id: 't2', title: 'Walk the dog', status: 'needsAction' as const };
    vi.spyOn(tasksApi, 'createTask').mockResolvedValue(newTask);

    render(<GoogleTasksTile tile={{ ...tile, taskListId: 'list-1' }} />);
    await screen.findByText('No tasks — add one!');

    fireEvent.click(screen.getByLabelText('Add task'));
    const input = screen.getByPlaceholderText('New task…');
    fireEvent.change(input, { target: { value: 'Walk the dog' } });
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => expect(screen.getByText('Walk the dog')).toBeInTheDocument());
  });
});
