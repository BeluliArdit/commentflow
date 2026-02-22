const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const tokenInput = document.getElementById("tokenInput");
const serverUrlInput = document.getElementById("serverUrl");
const connectBtn = document.getElementById("connectBtn");
const loginMsg = document.getElementById("loginMsg");
const toggleBtn = document.getElementById("toggleBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const activityText = document.getElementById("activityText");
const postedCount = document.getElementById("postedCount");
const failedCount = document.getElementById("failedCount");
const queueCount = document.getElementById("queueCount");
const advancedToggle = document.getElementById("advancedToggle");
const advancedSection = document.getElementById("advancedSection");

// Toggle server URL field
advancedToggle.addEventListener("click", () => {
  advancedSection.classList.toggle("show");
});

async function init() {
  const { token, serverUrl } = await chrome.storage.local.get(["token", "serverUrl"]);
  if (token && serverUrl) {
    showMain();
  } else {
    loginSection.style.display = "block";
  }
}

function showMain() {
  loginSection.style.display = "none";
  mainSection.style.display = "block";
  refresh();
}

// Single function to refresh everything from storage
async function refresh() {
  const { paused, todayStats, activity } = await chrome.storage.local.get([
    "paused",
    "todayStats",
    "activity",
  ]);

  // Stats
  const s = todayStats || { posted: 0, failed: 0, queued: 0 };
  postedCount.textContent = s.posted;
  failedCount.textContent = s.failed;
  queueCount.textContent = s.queued;

  // Activity
  const act = activity || { status: "Idle", detail: "" };
  const isBusy = act.status === "Posting" || act.status === "Processing" || act.status === "Checking for new comments...";

  if (paused) {
    statusDot.className = "status-dot off";
    statusText.textContent = "Paused";
    toggleBtn.textContent = "Resume";
    toggleBtn.className = "btn-main stopped";
    activityText.textContent = "Paused";
    activityText.className = "activity";
  } else {
    statusDot.className = isBusy ? "status-dot busy" : "status-dot on";
    statusText.textContent = isBusy ? act.status : "Running";
    toggleBtn.textContent = "Pause";
    toggleBtn.className = "btn-main running";
    activityText.textContent = act.detail || act.status || "Idle";
    activityText.className = isBusy ? "activity active" : "activity";
  }
}

// Live updates — refresh whenever background.js writes to storage
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.todayStats || changes.activity || changes.paused)) {
    refresh();
  }
});

// Connect
connectBtn.addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  const serverUrl = serverUrlInput.value.trim().replace(/\/$/, "");

  if (!token) {
    loginMsg.innerHTML = '<span class="msg-error">Paste your token first</span>';
    return;
  }

  connectBtn.textContent = "Connecting...";

  try {
    const res = await fetch(`${serverUrl}/api/extension/auth`, {
      headers: { "x-extension-token": token },
    });

    if (!res.ok) {
      loginMsg.innerHTML = '<span class="msg-error">Bad token — copy it again from the dashboard</span>';
      connectBtn.textContent = "Connect";
      return;
    }

    await chrome.storage.local.set({ token, serverUrl, paused: false });
    chrome.runtime.sendMessage({ type: "START_POLLING" });

    loginMsg.innerHTML = '<span class="msg-success">Connected!</span>';
    setTimeout(showMain, 400);
  } catch {
    loginMsg.innerHTML = '<span class="msg-error">Can\'t reach server — is it running?</span>';
    connectBtn.textContent = "Connect";
  }
});

// Pause / Resume
toggleBtn.addEventListener("click", async () => {
  const { paused } = await chrome.storage.local.get(["paused"]);
  await chrome.storage.local.set({ paused: !paused });

  if (!paused) {
    chrome.runtime.sendMessage({ type: "STOP_POLLING" });
  } else {
    chrome.runtime.sendMessage({ type: "START_POLLING" });
  }

  refresh();
});

// Disconnect
disconnectBtn.addEventListener("click", async () => {
  await chrome.storage.local.clear();
  chrome.runtime.sendMessage({ type: "STOP_POLLING" });
  mainSection.style.display = "none";
  loginSection.style.display = "block";
  tokenInput.value = "";
  loginMsg.innerHTML = "";
});

init();
