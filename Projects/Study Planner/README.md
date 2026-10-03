# Study Planner

Study Planner is a small dashboard for students to list what they need to study, tag each task with a subject and priority, and check tasks off as they go. A progress bar and live counts show how much of the list is done, and everything is saved in the browser so tasks are still there after a refresh.

## Features

- Add tasks with a title, subject, and priority (Low, Medium, High)
- Form validation with clear messages, whitespace trimming, and duplicate-task protection
- Mark tasks complete or pending, or delete them
- Filter by All, Pending, or Completed
- Total, completed, and pending counts with a percentage progress bar
- Priority badges that use markers and text as well as color
- Empty states for no tasks and for empty filter results
- Automatic saving with localStorage, with safe handling of missing or corrupted data
- Responsive layout, keyboard-friendly controls, and reduced-motion support

## Run It

Open `index.html` in any modern browser.

No server or installation should be required.

## What I Learned

- Building the interface with DOM manipulation, using `textContent` instead of `innerHTML` for user input
- Event handling, including event delegation on the task list
- Persisting data with localStorage, `JSON.stringify()`, and `JSON.parse()`
- Keeping state logic separate from rendering
- Form validation and accessible error messages
- Responsive CSS with grid, flexbox, and media queries