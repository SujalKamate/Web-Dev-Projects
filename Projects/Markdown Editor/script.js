// Simple Markdown Parser
class MarkdownParser {
  static parse(markdown) {
    let html = markdown;

    // Escape HTML special characters (except those we'll add)
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks (```...```)
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      const lang = code.split('\n')[0].trim();
      const content = code.substring(code.indexOf('\n') + 1);
      return `<pre><code class="language-${lang}">${content.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');

    // Bold and italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Images
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px; margin: 12px 0;">');

    // Unordered lists
    html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/(<\/li>)\n(?!<li>)/g, '$1</ul>');

    // Ordered lists
    html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');

    // Blockquotes
    html = html.replace(/^&gt; (.*?)$/gm, '<blockquote>$1</blockquote>');

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;
    html = html.replace(/<p><\/p>/g, '');

    // Clean up
    html = html.replace(/<p>(<h[1-6]|<ul|<ol|<blockquote|<pre|<hr)/g, '$1');
    html = html.replace(/(<\/h[1-6]|<\/ul|<\/ol|<\/blockquote|<\/pre|<hr)><\/p>/g, '$1');

    return html;
  }
}

// DOM Elements
const markdown = document.getElementById('markdown');
const preview = document.getElementById('preview');
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');
const status = document.getElementById('status');
const exportBtn = document.getElementById('exportBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

// Storage Key
const STORAGE_KEY = 'markdown-editor-content';
const AUTO_SAVE_INTERVAL = 3000; // 3 seconds

// Initialize
function init() {
  loadFromStorage();
  updatePreview();
  updateStats();
  setupEventListeners();
  setupAutoSave();
}

// Event Listeners
function setupEventListeners() {
  markdown.addEventListener('input', () => {
    updatePreview();
    updateStats();
    showStatus('Editing...', 2000);
  });

  markdown.addEventListener('keydown', (e) => {
    handleKeyboardShortcuts(e);
  });

  exportBtn.addEventListener('click', exportToHTML);
  copyBtn.addEventListener('click', copyToClipboard);
  clearBtn.addEventListener('click', clearContent);
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
  // Ctrl+S or Cmd+S - Save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveToStorage();
    showStatus('✓ Saved to browser storage', 3000);
  }

  // Ctrl+E or Cmd+E - Export
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    exportToHTML();
  }

  // Tab support in textarea
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = markdown.selectionStart;
    const end = markdown.selectionEnd;
    const value = markdown.value;
    markdown.value = value.substring(0, start) + '\t' + value.substring(end);
    markdown.selectionStart = markdown.selectionEnd = start + 1;
    updatePreview();
    updateStats();
  }
}

// Update Preview
function updatePreview() {
  const html = MarkdownParser.parse(markdown.value);
  preview.innerHTML = html;
}

// Update Stats
function updateStats() {
  const text = markdown.value;
  charCount.textContent = `${text.length} chars`;
  const words = text.trim().split(/\s+/).filter(w => w).length;
  wordCount.textContent = `${words} words`;
}

// Save to Storage
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, markdown.value);
}

// Load from Storage
function loadFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    markdown.value = saved;
  }
}

// Auto Save
function setupAutoSave() {
  setInterval(() => {
    if (markdown.value) {
      saveToStorage();
    }
  }, AUTO_SAVE_INTERVAL);
}

// Export to HTML
function exportToHTML() {
  const html = preview.innerHTML;
  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.8;
      color: #333;
      background: #fff;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #667eea;
      margin-top: 24px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    h1 { font-size: 28px; border-bottom: 2px solid #667eea; padding-bottom: 8px; }
    h2 { font-size: 24px; }
    h3 { font-size: 20px; }
    p { margin-bottom: 12px; }
    strong { font-weight: 700; color: #8b5cf6; }
    em { font-style: italic; color: #ec4899; }
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }
    pre {
      background: #2d2d2d;
      color: #f0f0f0;
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 12px 0;
    }
    pre code {
      background: none;
      padding: 0;
      color: #f0f0f0;
    }
    ul, ol { margin-left: 20px; margin-bottom: 12px; }
    li { margin-bottom: 6px; }
    blockquote {
      border-left: 4px solid #667eea;
      padding-left: 12px;
      color: #666;
      font-style: italic;
      margin: 12px 0;
    }
    a { color: #667eea; text-decoration: none; }
    a:hover { text-decoration: underline; }
    hr {
      border: none;
      height: 2px;
      background: linear-gradient(90deg, transparent, #667eea, transparent);
      margin: 24px 0;
    }
    img { max-width: 100%; border-radius: 8px; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    table th, table td { padding: 8px; border: 1px solid #ddd; }
    table th { background: #f5f5f5; font-weight: 700; }
  </style>
</head>
<body>
${html}
</body>
</html>`;

  const blob = new Blob([fullHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `markdown-export-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showStatus('✓ Exported to HTML', 3000);
}

// Copy to Clipboard
function copyToClipboard() {
  const html = preview.innerHTML;
  navigator.clipboard.writeText(html)
    .then(() => showStatus('✓ HTML copied to clipboard!', 3000))
    .catch(() => showStatus('✗ Failed to copy', 3000));
}

// Clear Content
function clearContent() {
  if (markdown.value && confirm('Are you sure? This will clear all content.')) {
    markdown.value = '';
    localStorage.removeItem(STORAGE_KEY);
    updatePreview();
    updateStats();
    showStatus('✓ Content cleared', 2000);
  }
}

// Show Status Message
function showStatus(message, duration = 2000) {
  status.textContent = message;
  if (duration) {
    setTimeout(() => {
      status.textContent = 'Ready • Press Ctrl+S to save • Ctrl+E to export';
    }, duration);
  }
}

// Start the app
init();
