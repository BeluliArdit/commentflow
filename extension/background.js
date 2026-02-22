const POLL_INTERVAL_MINUTES = 3;
const ALARM_NAME = "commentflow-poll";

// On install/startup, check if we should be polling
chrome.runtime.onInstalled.addListener(() => {
  checkAndStartPolling();
});

chrome.runtime.onStartup.addListener(() => {
  checkAndStartPolling();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "START_POLLING") {
    startPolling();
  } else if (msg.type === "STOP_POLLING") {
    stopPolling();
  }
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    pollQueue();
  }
});

async function checkAndStartPolling() {
  const { token, serverUrl, paused } = await chrome.storage.local.get([
    "token",
    "serverUrl",
    "paused",
  ]);
  if (token && serverUrl && !paused) {
    startPolling();
  }
}

function startPolling() {
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: 0.1, // First poll soon
    periodInMinutes: POLL_INTERVAL_MINUTES,
  });
  console.log("[CommentFlow] Polling started");
}

function stopPolling() {
  chrome.alarms.clear(ALARM_NAME);
  updateActivity("Paused");
  console.log("[CommentFlow] Polling stopped");
}

// Helper to update activity status (popup listens via storage.onChanged)
async function updateActivity(status, detail) {
  await chrome.storage.local.set({
    activity: { status, detail: detail || "", updatedAt: Date.now() },
  });
}

// Helper to update stats
async function updateStats(fn) {
  const { todayStats = { posted: 0, failed: 0, queued: 0 } } =
    await chrome.storage.local.get(["todayStats"]);
  fn(todayStats);
  await chrome.storage.local.set({ todayStats });
}

async function pollQueue() {
  const { token, serverUrl, paused } = await chrome.storage.local.get([
    "token",
    "serverUrl",
    "paused",
  ]);

  if (!token || !serverUrl || paused) return;

  console.log("[CommentFlow] Polling queue...");
  await updateActivity("Checking for new comments...");

  try {
    const res = await fetch(`${serverUrl}/api/extension/queue`, {
      headers: { "x-extension-token": token },
    });

    if (!res.ok) {
      console.error("[CommentFlow] Queue fetch failed:", res.status);
      await updateActivity("Idle", "Queue fetch failed");
      return;
    }

    const data = await res.json();
    const comments = data.comments || [];

    // Update queue count
    await updateStats((s) => { s.queued = comments.length; });

    if (comments.length === 0) {
      await updateActivity("Idle", "No comments in queue");
      return;
    }

    await updateActivity("Processing", `${comments.length} comment${comments.length !== 1 ? "s" : ""} in queue`);

    // Process each comment
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      await updateActivity("Posting", `Comment ${i + 1} of ${comments.length}`);
      await updateStats((s) => { s.queued = comments.length - i; });

      await processComment(comment, token, serverUrl);

      // Random delay between posts (30-90 seconds)
      if (i < comments.length - 1) {
        const delay = 30000 + Math.random() * 60000;
        const delaySec = Math.round(delay / 1000);
        await updateActivity("Waiting", `Next comment in ~${delaySec}s (${i + 2} of ${comments.length})`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    await updateStats((s) => { s.queued = 0; });
    await updateActivity("Idle", "All comments processed");
  } catch (err) {
    console.error("[CommentFlow] Poll error:", err);
    await updateActivity("Idle", `Error: ${err.message}`);
  }
}

async function processComment(comment, token, serverUrl) {
  console.log(`[CommentFlow] Processing comment ${comment.id} for ${comment.url}`);

  let previousTab = null;
  try {
    // Remember the currently active tab so we can switch back
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) previousTab = activeTab.id;

    // Route Reddit through old.reddit.com (plain HTML, supports modhash API)
    let targetUrl = comment.url;
    if (comment.platform === "reddit") {
      targetUrl = targetUrl.replace("www.reddit.com", "old.reddit.com");
    }

    // Open the post URL in an active tab so the page fully renders
    const tab = await chrome.tabs.create({
      url: targetUrl,
      active: true,
    });

    // Wait for the page to load
    await waitForTabLoad(tab.id);

    // Simulate reading the post before commenting (3-6s)
    await new Promise((r) => setTimeout(r, 3000 + Math.random() * 3000));

    // Send message to content script (retry until it's ready)
    let result;
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        result = await chrome.tabs.sendMessage(tab.id, {
          type: "POST_COMMENT",
          text: comment.text,
          platform: comment.platform,
        });
        break;
      } catch (e) {
        console.log(`[CommentFlow] Content script not ready, attempt ${attempt + 1}/10`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    if (!result) {
      throw new Error("Content script never responded after 10 attempts");
    }

    // Linger on the page after posting like a real user (4-8s)
    await new Promise((r) => setTimeout(r, 4000 + Math.random() * 4000));

    // Close the tab and refocus the original tab
    await chrome.tabs.remove(tab.id);
    if (previousTab) {
      try { await chrome.tabs.update(previousTab, { active: true }); } catch {}
    }

    // Report result to server
    await fetch(`${serverUrl}/api/extension/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-extension-token": token,
      },
      body: JSON.stringify({
        commentId: comment.id,
        success: result.success,
        platformUrl: result.platformUrl || undefined,
        error: result.error || undefined,
      }),
    });

    // Update stats
    if (result.success) {
      await updateStats((s) => { s.posted++; s.queued = Math.max(0, s.queued - 1); });
    } else {
      await updateStats((s) => { s.failed++; s.queued = Math.max(0, s.queued - 1); });
    }

    console.log(
      `[CommentFlow] Comment ${comment.id}: ${result.success ? "posted" : "failed"}`
    );
  } catch (err) {
    console.error(`[CommentFlow] Error processing comment ${comment.id}:`, err);

    // Refocus original tab on error too
    if (previousTab) {
      try { await chrome.tabs.update(previousTab, { active: true }); } catch {}
    }

    // Report failure
    try {
      await fetch(`${serverUrl}/api/extension/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-extension-token": token,
        },
        body: JSON.stringify({
          commentId: comment.id,
          success: false,
          error: err.message || "Unknown error",
        }),
      });
    } catch {}

    await updateStats((s) => { s.failed++; s.queued = Math.max(0, s.queued - 1); });
  }
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
    // Timeout after 30 seconds
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 30000);
  });
}

// Reset daily stats at midnight
chrome.alarms.create("reset-stats", {
  when: getNextMidnight(),
  periodInMinutes: 24 * 60,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "reset-stats") {
    chrome.storage.local.set({ todayStats: { posted: 0, failed: 0, queued: 0 } });
  }
});

function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}
