const startStopBtn = document.getElementById("startStopBtn");
const resetBtn = document.getElementById("resetBtn");
const activityInput = document.getElementById("activityInput");
const noteInput = document.getElementById("noteInput");
const sessionList = document.getElementById("sessionList");
const todayTotalEl = document.getElementById("todayTotal");
const weekTotalEl = document.getElementById("weekTotal");
const liveTimerEl = document.getElementById("liveTimer");
const calendarEl = document.getElementById("calendar");
const graph = document.getElementById("graph");
const ctx = graph.getContext("2d");

let sessions = JSON.parse(localStorage.getItem("sessions")) || [];
let currentSession = null;
let timerInterval = null;

/* ---------- Utils ---------- */
function formatTime(ms) {
  const s = ms / 1000;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toFixed(2).padStart(5, "0");
  return `${h}:${String(m).padStart(2,"0")}:${sec}`;
}

/* ---------- Live Timer ---------- */
function startLiveTimer() {
  timerInterval = setInterval(() => {
    liveTimerEl.textContent = formatTime(Date.now() - currentSession.start);
  }, 10);
}

function stopLiveTimer() {
  clearInterval(timerInterval);
  liveTimerEl.textContent = "0:00:00.00";
}

/* ---------- Start / Stop ---------- */
startStopBtn.onclick = () => {
  if (!currentSession) {
    currentSession = {
      id: crypto.randomUUID(),
      activity: activityInput.value || "Untitled",
      note: noteInput.value,
      start: Date.now()
    };
    startStopBtn.textContent = "Stop";
    startLiveTimer();
  } else {
    currentSession.end = Date.now();
    currentSession.duration = currentSession.end - currentSession.start;
    currentSession.date = new Date().toISOString().slice(0,10);

    sessions.push(currentSession);
    localStorage.setItem("sessions", JSON.stringify(sessions));

    currentSession = null;
    activityInput.value = "";
    noteInput.value = "";
    startStopBtn.textContent = "Start";
    stopLiveTimer();

    render();
  }
};

/* ---------- Reset ---------- */
resetBtn.onclick = () => {
  if (confirm("This will delete all sessions. Continue?")) {
    sessions = [];
    localStorage.removeItem("sessions");
    render();
  }
};

/* ---------- Render ---------- */
function render() {
  sessionList.innerHTML = "";

  sessions.slice().reverse().forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${s.activity}</strong> — ${formatTime(s.duration)}<br>
      <em>${s.note || ""}</em>
    `;
    sessionList.appendChild(li);
  });

  updateStats();
  drawGraph();
  drawCalendar();
}

/* ---------- Stats ---------- */
function updateStats() {
  const today = new Date().toISOString().slice(0,10);
  const weekAgo = Date.now() - 7 * 86400000;

  let todayMs = 0;
  let weekMs = 0;

  sessions.forEach(s => {
    if (s.date === today) todayMs += s.duration;
    if (s.start >= weekAgo) weekMs += s.duration;
  });

  todayTotalEl.textContent = formatTime(todayMs);
  weekTotalEl.textContent = formatTime(weekMs);
}

/* ---------- Graph ---------- */
function drawGraph() {
  ctx.clearRect(0,0,graph.width,graph.height);

  const recent = sessions.slice(-10);
  if (!recent.length) return;

  const max = Math.max(...recent.map(s => s.duration));
  const w = graph.width / recent.length;

  recent.forEach((s, i) => {
    const h = (s.duration / max) * graph.height;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(i * w + 6, graph.height - h, w - 12, h);
  });
}

/* ---------- Calendar ---------- */
function drawCalendar() {
  calendarEl.innerHTML = "";

  const days = {};
  sessions.forEach(s => {
    days[s.date] = (days[s.date] || 0) + s.duration;
  });

  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0,10);

    const div = document.createElement("div");
    div.className = "day";
    div.innerHTML = `
      ${d.toLocaleDateString(undefined,{weekday:"short"})}
      <strong>${formatTime(days[dateStr] || 0)}</strong>
    `;
    calendarEl.appendChild(div);
  }
}

render();
