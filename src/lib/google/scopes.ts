export const googleScopes = {
  calendarEventsReadonly: 'https://www.googleapis.com/auth/calendar.events.readonly',
  calendarReadonly: 'https://www.googleapis.com/auth/calendar.readonly',
  tasks: 'https://www.googleapis.com/auth/tasks',
  driveReadonly: 'https://www.googleapis.com/auth/drive.readonly',
  gmailReadonly: 'https://www.googleapis.com/auth/gmail.readonly',
  gmailSend: 'https://www.googleapis.com/auth/gmail.send',
} as const;

export const ALL_GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  googleScopes.calendarReadonly,
  googleScopes.tasks,
  googleScopes.driveReadonly,
  googleScopes.gmailReadonly,
  googleScopes.gmailSend,
].join(' ');
