const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const tokenInput = document.getElementById("tokenInput");
const serverUrlInput = document.getElementById("serverUrl");
const connectBtn = document.getElementById("connectBtn");
const loginMsg = document.getElementById("loginMsg");
const toggleBtn = document.getElementById("toggleBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const posterStatus = document.getElementById("posterStatus");
const postedCount = document.getElementById("postedCount");
const failedCount = document.getElementById("failedCount");
const queueCount = document.getElementById("queueCount");

async function init() {
  const { token, serverUrl } = await chrome.storage.local.get(["token", "serverUrl"]);
  if (token && serverUrl) {
    showMain();
    loadStats();
  } else {
    loginSection.style.display = "block";
  }
}

function showMain() {
  loginSection.style.display = "none";
  mainSection.style.display = "block";
  updateToggleButton();
}

async function updateToggleButton() {
  const { paused } = await chrome.storage.local.get(["paused"]);
  if (paused) {
    posterStatus.textContent = "Paused";
    posterStatus.className = "status-value paused";
    toggleBtn.textContent = "Resume Poster";
  } else {
    posterStatus.textContent = "Active";
    posterStatus.className = "status-value active";
    toggleBtn.textContent = "Pause Poster";
  }
}

async function loadStats() {
  const { todayStats } = await chrome.storage.local.get(["todayStats"]);
  const stats = todayStats || { posted: 0, failed: 0, queued: 0 };
  postedCount.textContent = stats.posted;
  failedCount.textContent = stats.failed;
  queueCount.textContent = stats.queued;
}

connectBtn.addEventListener("click", async () => {
  const token = tokenInput.value.trim();
  const serverUrl = serverUrlInput.value.trim().replace(/\/$/, "");

  if (!token) {
    loginMsg.innerHTML = '<div class="msg error">Please enter your token</div>';
    return;
  }
  if (!serverUrl) {
    loginMsg.innerHTML = '<div class="msg error">Please enter server URL</div>';
    return;
  }

  connectBtn.textContent = "Connecting...";

  try {
    const res = await fetch(`${serverUrl}/api/extension/auth`, {
      headers: { "x-extension-token": token },
    });

    if (!res.ok) {
      loginMsg.innerHTML = '<div class="msg error">Invalid token. Check your token and try again.</div>';
      connectBtn.textContent = "Connect";
      return;
    }

    await chrome.storage.local.set({ token, serverUrl, paused: false });
    loginMsg.innerHTML = '<div class="msg success">Connected!</div>';

    // Start the background polling
    chrome.runtime.sendMessage({ type: "START_POLLING" });

    setTimeout(() => {
      showMain();
      loadStats();
    }, 500);
  } catch (e) {
    loginMsg.innerHTML = '<div class="msg error">Could not reach server. Check URL.</div>';
    connectBtn.textContent = "Connect";
  }
});

toggleBtn.addEventListener("click", async () => {
  const { paused } = await chrome.storage.local.get(["paused"]);
  await chrome.storage.local.set({ paused: !paused });
  updateToggleButton();

  if (!paused) {
    chrome.runtime.sendMessage({ type: "STOP_POLLING" });
  } else {
    chrome.runtime.sendMessage({ type: "START_POLLING" });
  }
});

disconnectBtn.addEventListener("click", async () => {
  await chrome.storage.local.clear();
  chrome.runtime.sendMessage({ type: "STOP_POLLING" });
  mainSection.style.display = "none";
  loginSection.style.display = "block";
  tokenInput.value = "";
  loginMsg.innerHTML = "";
});

init();
