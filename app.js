const STORAGE_KEY = 'musicDiaryEntries';
const moodLabels = {
  happy: '快乐',
  sad: '悲伤',
};

const state = {
  selectedDate: formatDate(new Date()),
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
};

const elements = {
  form: document.getElementById('entryForm'),
  date: document.getElementById('entryDate'),
  songName: document.getElementById('songName'),
  artistName: document.getElementById('artistName'),
  moodSelect: document.getElementById('moodSelect'),
  notes: document.getElementById('notes'),
  monthLabel: document.getElementById('monthLabel'),
  prevMonth: document.getElementById('prevMonth'),
  nextMonth: document.getElementById('nextMonth'),
  calendar: document.getElementById('calendar'),
  entriesList: document.getElementById('entriesList'),
  selectedDateTitle: document.getElementById('selectedDateTitle'),
  currentMoodLabel: document.getElementById('currentMoodLabel'),
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function updateMoodTheme(mood) {
  document.body.setAttribute('data-mood', mood);
  elements.currentMoodLabel.textContent = moodLabels[mood] || '快乐';
}

function getEntriesForDate(date) {
  return readEntries().filter((entry) => entry.date === date);
}

function getAllDatesWithEntries() {
  const dates = {};
  readEntries().forEach((entry) => {
    dates[entry.date] = true;
  });
  return dates;
}

function renderEntries() {
  const dateEntries = getEntriesForDate(state.selectedDate);
  elements.selectedDateTitle.textContent = `${state.selectedDate} 的记录`;

  if (dateEntries.length === 0) {
    elements.entriesList.innerHTML = `
      <div class="empty-state">
        这一天还没有记录音乐，快来写下你今天听到的那首歌吧。
      </div>
    `;
    return;
  }

  const entries = [...dateEntries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  elements.entriesList.innerHTML = entries
    .map(
      (entry) => `
        <article class="entry-card">
          <div class="entry-top">
            <h3>${escapeHtml(entry.songName)}</h3>
            <button class="delete-button" data-id="${entry.id}" type="button">删除</button>
          </div>
          <div class="song-meta">${escapeHtml(entry.artistName)}</div>
          <span class="entry-mood">${moodLabels[entry.mood] || '快乐'}</span>
          <p class="entry-notes">${escapeHtml(entry.notes)}</p>
        </article>
      `
    )
    .join('');
}

function buildCalendar() {
  const firstDay = new Date(state.currentYear, state.currentMonth, 1);
  const lastDay = new Date(state.currentYear, state.currentMonth + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const monthLabel = `${state.currentYear} 年 ${state.currentMonth + 1} 月`;
  elements.monthLabel.textContent = monthLabel;

  const datesWithEntries = getAllDatesWithEntries();
  const cells = [];

  for (let i = 0; i < 42; i += 1) {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + i);

    const isCurrentMonth = cellDate.getMonth() === state.currentMonth;
    const dateKey = formatDate(cellDate);
    const isSelected = dateKey === state.selectedDate;
    const hasEntry = Boolean(datesWithEntries[dateKey]);

    cells.push(`
      <button
        type="button"
        class="calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isSelected ? 'selected' : ''} ${hasEntry ? 'has-entry' : ''}"
        data-date="${dateKey}"
        aria-label="${dateKey}"
      >
        <span class="day-number">${cellDate.getDate()}</span>
        <span class="day-dot"></span>
      </button>
    `);
  }

  elements.calendar.innerHTML = cells.join('');

  elements.calendar.querySelectorAll('.calendar-day').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedDate = button.dataset.date;
      renderEntries();
      buildCalendar();
    });
  });
}

function handleSubmit(event) {
  event.preventDefault();

  const entry = {
    id: crypto.randomUUID(),
    date: elements.date.value,
    songName: elements.songName.value.trim(),
    artistName: elements.artistName.value.trim(),
    mood: elements.moodSelect.value,
    notes: elements.notes.value.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!entry.date || !entry.songName || !entry.artistName || !entry.notes) {
    return;
  }

  const entries = readEntries();
  entries.push(entry);
  saveEntries(entries);

  state.selectedDate = entry.date;
  updateMoodTheme(entry.mood);
  renderEntries();
  buildCalendar();
  elements.form.reset();
  elements.date.value = state.selectedDate;
  elements.moodSelect.value = 'happy';
}

function handleDelete(event) {
  const deleteButton = event.target.closest('.delete-button');
  if (!deleteButton) {
    return;
  }

  const { id } = deleteButton.dataset;
  const entries = readEntries().filter((entry) => entry.id !== id);
  saveEntries(entries);
  renderEntries();
  buildCalendar();
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setupInitialView() {
  elements.date.value = state.selectedDate;
  updateMoodTheme(elements.moodSelect.value);
  renderEntries();
  buildCalendar();
}

elements.form.addEventListener('submit', handleSubmit);
elements.prevMonth.addEventListener('click', () => {
  const nextDate = new Date(state.currentYear, state.currentMonth - 1, 1);
  state.currentMonth = nextDate.getMonth();
  state.currentYear = nextDate.getFullYear();
  buildCalendar();
});

elements.nextMonth.addEventListener('click', () => {
  const nextDate = new Date(state.currentYear, state.currentMonth + 1, 1);
  state.currentMonth = nextDate.getMonth();
  state.currentYear = nextDate.getFullYear();
  buildCalendar();
});

elements.moodSelect.addEventListener('change', (event) => {
  updateMoodTheme(event.target.value);
});

elements.entriesList.addEventListener('click', handleDelete);

setupInitialView();
