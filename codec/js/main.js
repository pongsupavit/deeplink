const inputEl = document.getElementById('inputText');
const outputEl = document.getElementById('outputText');
const statusEl = document.getElementById('status');
const encodeBtn = document.getElementById('encodeBtn');
const decodeBtn = document.getElementById('decodeBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');

const setStatus = (text, tone = '') => {
  statusEl.textContent = text;
  statusEl.classList.remove('is-ok', 'is-error');
  if (tone) statusEl.classList.add(tone);
};

const getInput = () => inputEl.value.trim();

encodeBtn.addEventListener('click', () => {
  const value = getInput();
  if (!value) {
    setStatus('Please enter text to encode.', 'is-error');
    outputEl.value = '';
    return;
  }
  outputEl.value = encodeURIComponent(value);
  setStatus('Encoded', 'is-ok');
});

decodeBtn.addEventListener('click', () => {
  const value = getInput();
  if (!value) {
    setStatus('Please enter text to decode.', 'is-error');
    outputEl.value = '';
    return;
  }
  try {
    outputEl.value = decodeURIComponent(value.replace(/\+/g, '%20'));
    setStatus('Decoded', 'is-ok');
  } catch (err) {
    outputEl.value = '';
    setStatus('Invalid encoding.', 'is-error');
  }
});

clearBtn.addEventListener('click', () => {
  inputEl.value = '';
  outputEl.value = '';
  setStatus('Ready');
  inputEl.focus();
});

copyBtn.addEventListener('click', async () => {
  if (!outputEl.value.trim()) {
    setStatus('Nothing to copy yet.', 'is-error');
    return;
  }
  try {
    await navigator.clipboard.writeText(outputEl.value);
    setStatus('Copied to clipboard.', 'is-ok');
  } catch (err) {
    setStatus('Copy failed. Please try again.', 'is-error');
  }
});

inputEl.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    encodeBtn.click();
  }
});
