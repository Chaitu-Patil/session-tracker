/* ------------------- AUTH ------------------- */
const authScreen=document.getElementById("authScreen");
const app=document.getElementById("app");
const appHeader=document.getElementById("appHeader");
const signInBtn=document.getElementById("signInBtn");
const usernameInput=document.getElementById("usernameInput");
const passwordInput=document.getElementById("passwordInput");

const profileBtn=document.getElementById("profileBtn");
const profileMenu=document.getElementById("profileMenu");
const profileName=document.getElementById("profileName");
const logoutBtn=document.getElementById("logoutBtn");

let currentUser=JSON.parse(localStorage.getItem("currentUser"));

function showApp(){
  authScreen.classList.add("hidden");
  app.classList.remove("hidden");
  appHeader.classList.remove("hidden");
  profileName.textContent=currentUser.username;
  loadSessions();
}

function showAuth(){
  authScreen.classList.remove("hidden");
  app.classList.add("hidden");
  appHeader.classList.add("hidden");
}

signInBtn.onclick=()=>{
  if(!usernameInput.value || !passwordInput.value) return;
  currentUser={username:usernameInput.value};
  localStorage.setItem("currentUser",JSON.stringify(currentUser));
  showApp();
};

logoutBtn.onclick=()=>{
  localStorage.removeItem("currentUser");
  location.reload();
};

profileBtn.onclick=()=>profileMenu.classList.toggle("hidden");

/* ------------------- SESSION DATA ------------------- */
let sessions=[];

function loadSessions(){
  sessions=JSON.parse(localStorage.getItem(`sessions_${currentUser.username}`))||[];
  renderSessions();
  renderDayGraph();
}

function saveSessions(){
  localStorage.setItem(`sessions_${currentUser.username}`,JSON.stringify(sessions));
}

/* ------------------- VARIABLES ------------------- */
const startStopBtn=document.getElementById("startStopBtn");
const resetBtn=document.getElementById("resetBtn");
const activityInput=document.getElementById("activityInput");
const noteInput=document.getElementById("noteInput");
const sessionList=document.getElementById("sessionList");
const todayTotalEl=document.getElementById("todayTotal");
const weekTotalEl=document.getElementById("weekTotal");
const liveTimerEl=document.getElementById("liveTimer");

const monthModal=document.getElementById("monthModal");
const monthGrid=document.getElementById("monthGrid");
const monthTitle=document.getElementById("monthTitle");
const monthWeekdays=document.getElementById("monthWeekdays");
const closeMonth=document.getElementById("closeMonth");
const monthGraph=document.getElementById("monthGraph");

const dayModal=document.getElementById("dayModal");
const dayTitle=document.getElementById("dayTitle");
const daySessions=document.getElementById("daySessions");
const closeDay=document.getElementById("closeDay");

const openMonthBtn=document.getElementById("openMonthBtn");

/* ------------------- STORAGE ------------------- */
let currentDate=new Date("2026-01-31"); 
let currentSession=null;
let interval;

/* ------------------- UTILS ------------------- */
function formatTime(ms){
  const s=ms/1000;
  const h=Math.floor(s/3600);
  const m=Math.floor((s%3600)/60);
  const sec=(s%60).toFixed(2).padStart(5,"0");
  return `${h}:${String(m).padStart(2,"0")}:${sec}`;
}

/* ------------------- TIMER ------------------- */
startStopBtn.onclick=()=>{
  if(!currentSession){
    currentSession={
      activity:activityInput.value||"Untitled",
      note:noteInput.value,
      start:Date.now()
    };
    startStopBtn.textContent="Stop";
    interval=setInterval(()=>{
      liveTimerEl.textContent=formatTime(Date.now()-currentSession.start);
      renderDayGraph();
    },10);
  }else{
    clearInterval(interval);
    currentSession.end=Date.now();
    currentSession.duration=currentSession.end-currentSession.start;
    currentSession.date=currentDate.toISOString().slice(0,10);
    sessions.push(currentSession);
    saveSessions();
    currentSession=null;
    liveTimerEl.textContent="0:00:00.00";
    startStopBtn.textContent="Start";
    renderSessions();
    renderDayGraph();
  }
};

/* ------------------- RESET ------------------- */
resetBtn.onclick=()=>{
  if(confirm("This will delete all sessions. Continue?")){
    sessions=[];
    saveSessions();
    renderSessions();
    renderDayGraph();
  }
};

/* ------------------- RENDER FUNCTIONS ------------------- */
function renderSessions(){
  sessionList.innerHTML="";
  const todayStr=currentDate.toISOString().slice(0,10);
  sessions.slice().reverse().forEach(s=>{
    if(s.date===todayStr){
      const li=document.createElement("li");
      li.innerHTML=`<strong>${s.activity}</strong> — ${formatTime(s.duration)}<br><em>${s.note||""}</em>`;
      sessionList.appendChild(li);
    }
  });
  updateStats();
}

function updateStats(){
  const todayStr=currentDate.toISOString().slice(0,10);
  const weekAgo=currentDate.getTime()-7*86400000;
  let todayMs=0, weekMs=0;
  sessions.forEach(s=>{
    if(s.date===todayStr) todayMs+=s.duration;
    if(s.start>=weekAgo) weekMs+=s.duration;
  });
  todayTotalEl.textContent=formatTime(todayMs);
  weekTotalEl.textContent=formatTime(weekMs);
}

/* ------------------- DAY GRAPH ------------------- */
function renderDayGraph(){
  const canvas=document.getElementById("dayGraph");
  const ctx=canvas.getContext("2d");
  canvas.width=canvas.offsetWidth;
  canvas.height=120;
  const todayStr=currentDate.toISOString().slice(0,10);
  const dayS=sessions.filter(s=>s.date===todayStr);
  const max=Math.max(...dayS.map(s=>s.duration),1);
  const barWidth=canvas.width/Math.max(dayS.length,1)-4;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  dayS.forEach((s,i)=>{
    const h=(s.duration/max)*canvas.height;
    ctx.fillStyle="#6366f1";
    ctx.fillRect(i*(barWidth+4),canvas.height-h,barWidth,h);
    canvas.addEventListener("mousemove",e=>{
      const rect=canvas.getBoundingClientRect();
      const x=e.clientX-rect.left;
      const index=Math.floor(x/(barWidth+4));
      if(index===i) canvas.title=`${s.activity}: ${formatTime(s.duration)}`;
    });
  });
}

/* ------------------- MONTH VIEW ------------------- */
openMonthBtn.onclick=()=>{
  const year=currentDate.getFullYear();
  const month=currentDate.getMonth();
  renderMonthView(year,month);
};

closeMonth.onclick=()=>monthModal.classList.add("hidden");
closeDay.onclick=()=>dayModal.classList.add("hidden");

function renderMonthView(year,month){
  monthModal.classList.remove("hidden");
  monthGrid.innerHTML="";
  monthTitle.textContent=new Date(year,month).toLocaleString("default",{month:"long",year:"numeric"});
  monthWeekdays.innerHTML="";
  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d=>{
    const w=document.createElement("div"); w.textContent=d; monthWeekdays.appendChild(w);
  });
  const monthSessions={};
  sessions.forEach(s=>{
    const d=new Date(s.date);
    if(d.getFullYear()===year && d.getMonth()===month) monthSessions[s.date]=(monthSessions[s.date]||0)+s.duration;
  });
  const firstDay=new Date(year,month,1).getDay();
  const totalDays=new Date(year,month+1,0).getDate();
  for(let i=0;i<firstDay;i++) monthGrid.appendChild(document.createElement("div"));
  for(let d=1;d<=totalDays;d++){
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const cell=document.createElement("div");
    cell.className="day"; cell.textContent=d;
    if(monthSessions[dateStr]){cell.classList.add("has-session");cell.title=formatTime(monthSessions[dateStr]);}
    if(currentDate.getFullYear()===year && currentDate.getMonth()===month && currentDate.getDate()===d) cell.classList.add("today");
    cell.onclick=()=>renderDayView(dateStr);
    monthGrid.appendChild(cell);
  }
  renderMonthGraph(year,month);
}

function renderMonthGraph(year,month){
  const ctx=monthGraph.getContext("2d");
  monthGraph.width=monthGraph.offsetWidth;
  monthGraph.height=120;
  const totalDays=new Date(year,month+1,0).getDate();
  const dailyTotals=Array(totalDays).fill(0);
  sessions.forEach(s=>{
    const d=new Date(s.date);
    if(d.getFullYear()===year && d.getMonth()===month) dailyTotals[d.getDate()-1]+=s.duration;
  });
  const max=Math.max(...dailyTotals,1);
  const barWidth=monthGraph.width/totalDays-4;
  ctx.clearRect(0,0,monthGraph.width,monthGraph.height);
  dailyTotals.forEach((val,i)=>{
    const h=(val/max)*monthGraph.height;
    ctx.fillStyle="#6366f1";
    ctx.fillRect(i*(barWidth+4),monthGraph.height-h,barWidth,h);
    monthGraph.addEventListener("click",e=>{
      const rect=monthGraph.getBoundingClientRect();
      const x=e.clientX-rect.left;
      const index=Math.floor(x/(barWidth+4));
      if(index===i && val>0){
        const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`;
        renderDayView(dateStr);
      }
    });
  });
}

/* ------------------- DAY VIEW ------------------- */
function renderDayView(dateStr){
  dayModal.classList.remove("hidden");
  dayTitle.textContent=`Sessions on ${dateStr}`;
  daySessions.innerHTML="";
  sessions.filter(s=>s.date===dateStr).forEach(s=>{
    const li=document.createElement("li");
    li.innerHTML=`<strong>${s.activity}</strong> — ${formatTime(s.duration)}<br><em>${s.note||""}</em>`;
    daySessions.appendChild(li);
  });
}

/* ------------------- INITIAL RENDER ------------------- */
currentUser?showApp():showAuth();
