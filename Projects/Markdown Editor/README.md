# Markdown Editor

A beautiful, real-time Markdown editor with glass morphism UI design. Write Markdown on the left, see the formatted preview on the right — instantly.

## ✨ Features

- **Real-time Preview**: See your Markdown rendered instantly as you type
- **Glass Morphism UI**: Modern, frosted glass aesthetic with gradient background
- **Markdown Support**: Full support for headers, bold, italic, lists, links, images, code blocks, tables, and more
- **Keyboard Shortcuts**: 
  - `Ctrl+S` / `Cmd+S` - Save to browser storage
  - `Ctrl+E` / `Cmd+E` - Export to HTML file
  - `Tab` - Insert tabs in editor
- **Export to HTML**: Download your Markdown as a complete, styled HTML file
- **Copy HTML**: Copy the rendered HTML to clipboard
- **Auto-Save**: Automatically saves every 3 seconds
- **Character & Word Count**: Live statistics
- **localStorage Persistence**: Your work is saved in the browser
- **Responsive Design**: Works beautifully on desktop and tablet
- **Dark Mode Support**: Adapts to system color scheme
- **No Dependencies**: Pure vanilla JavaScript, HTML, and CSS

## 🎯 What It Shows

- **Glass Morphism Design**: Modern UI with backdrop filters and gradients
- **Markdown Parsing**: Build your own parser with regex and DOM manipulation
- **Real-time DOM Updates**: Instant rendering on input changes
- **localStorage API**: Persist data in the browser
- **File Export**: Generate and download HTML dynamically
- **Clipboard API**: Copy content to clipboard programmatically
- **Keyboard Event Handling**: Capture and respond to keyboard shortcuts
- **Responsive CSS Grid**: Flexible two-pane layout

## 🚀 Run It

Open `index.html` in any modern browser. Start typing Markdown in the left pane!

### Markdown Syntax Supported

```markdown
# Heading 1
## Heading 2
### Heading 3

**bold text**
*italic text*
***bold and italic***

`inline code`

[Link text](https://example.com)
![Alt text](https://example.com/image.png)

> Blockquote text

- Unordered list item
- Another item

1. Ordered list item
2. Another item

---

```code block```

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

## 💾 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` / `Cmd+S` | Save to localStorage |
| `Ctrl+E` / `Cmd+E` | Export to HTML file |
| `Tab` | Insert tab in editor |

## 🎨 Features in Detail

### Glass UI
- Frosted glass effect with backdrop blur
- Gradient purple background
- Smooth transitions and hover effects
- Beautiful shadows and depth

### Editor Panel
- Line-number ready monospace font
- Character count display
- Tab support for indentation
- Smooth scrolling
- Syntax highlighting in preview

### Preview Panel
- Styled Markdown rendering
- Automatic scroll sync capability
- Code block syntax styling
- Responsive image handling
- Link target="_blank" support

### Export Options
- **Export to HTML**: Download a complete HTML file with styling
- **Copy HTML**: Copy the rendered HTML to clipboard
- **Clear Content**: Wipe the editor and storage

## 📊 Statistics

The editor displays:
- **Character Count**: Total characters in the Markdown
- **Word Count**: Total words in the content

## 💡 Learning Path

By building this project, you'll learn:
1. **Regex Mastery**: Pattern matching for Markdown parsing
2. **DOM Manipulation**: Creating and updating HTML elements
3. **localStorage**: Browser persistence layer
4. **CSS Modern Features**: Glass morphism, gradients, backdrop filters
5. **Event Handling**: Keyboard shortcuts and real-time updates
6. **Clipboard API**: Copy content programmatically
7. **Blob & File Download**: Generate downloadable files
8. **Responsive Design**: Mobile-first CSS Grid layout

## 🌐 Browser Support

Works in all modern browsers:
- Chrome/Chromium
- Firefox
- Safari
- Edge

Note: Some CSS features (backdrop-filter) may have limited support in older browsers.

## 💬 Tips

- **Save Frequently**: Use Ctrl+S to ensure your work is saved
- **Export When Done**: Download your work as HTML for backup
- **Keyboard Shortcuts**: Master them for faster workflow
- **Markdown Reference**: Use the placeholder text in the editor as a guide

## 📝 Next Steps

After building this project:
- Add syntax highlighting library (highlight.js)
- Add table of contents generation
- Add search/replace functionality
- Add theme customization
- Add collaborative editing with WebSockets
- Add Markdown preset templates
