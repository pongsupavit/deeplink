const input = document.getElementById('urlInput');
const output = document.getElementById('output');
const statusEl = document.getElementById('status');
const prettyBtn = document.getElementById('prettyBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');

const setStatus = (text, tone = '') => {
  statusEl.textContent = text;
  statusEl.classList.remove('is-ok', 'is-error');
  if (tone) statusEl.classList.add(tone);
};

const normalizeInput = (raw) => raw.trim();

const hasScheme = (value) => /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value);

const buildBase = (url) => {
  if (url.origin !== 'null') return `${url.origin}${url.pathname}`;
  const host = url.host || '';
  return `${url.protocol}//${host}${url.pathname}`;
};

const prettyPrint = (value) => {
  const trimmed = normalizeInput(value);
  if (!trimmed) throw new Error('Please paste a URL first.');

  let assumedScheme = false;
  let candidate = trimmed;
  if (!hasScheme(candidate)) {
    candidate = `https://${candidate}`;
    assumedScheme = true;
  }

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch (err) {
    throw new Error('Invalid URL. Please check the input.');
  }

  const lines = [];
  lines.push(buildBase(parsed));
  if (parsed.searchParams.toString()) lines.push('');

  const params = Array.from(parsed.searchParams.entries());
  params.forEach(([key, value]) => {
    const pair = value.length > 0 ? `${key}=${value}` : key;
    lines.push(pair);
  });

  if (parsed.hash) {
    lines.push(parsed.hash);
  }

  const statusNote = assumedScheme ? 'Assumed https:// because no scheme was provided.' : 'Done';
  return { text: lines.join('\n'), note: statusNote };
};

prettyBtn.addEventListener('click', () => {
  try {
    const result = prettyPrint(input.value);
    output.textContent = result.text;
    setStatus(result.note, 'is-ok');
  } catch (err) {
    output.textContent = '';
    setStatus(err.message, 'is-error');
  }
});

clearBtn.addEventListener('click', () => {
  input.value = '';
  output.textContent = '';
  setStatus('Ready');
  input.focus();
});

copyBtn.addEventListener('click', async () => {
  if (!output.textContent.trim()) {
    setStatus('Nothing to copy yet.', 'is-error');
    return;
  }
  try {
    await navigator.clipboard.writeText(output.textContent);
    setStatus('Copied to clipboard.', 'is-ok');
  } catch (err) {
    setStatus('Copy failed. Please try again.', 'is-error');
  }
});

input.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    prettyBtn.click();
  }
});
