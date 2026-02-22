const POLL_INTERVAL_MINUTES = 0.5; // Poll every 30 seconds
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
  console.log("[CommentFlow] Polling stopped");
}

async function pollQueue() {
  const { token, serverUrl, paused } = await chrome.storage.local.get([
    "token",
    "serverUrl",
    "paused",
  ]);

  if (!token || !serverUrl || paused) return;

  console.log("[CommentFlow] Polling queue...");

  try {
    const res = await fetch(`${serverUrl}/api/extension/queue`, {
      headers: { "x-extension-token": token },
    });

    if (!res.ok) {
      console.error("[CommentFlow] Queue fetch failed:", res.status);
      return;
    }

    const data = await res.json();
    const comments = data.comments || [];

    // Update queue count
    const { todayStats = { posted: 0, failed: 0, queued: 0 } } =
      await chrome.storage.local.get(["todayStats"]);
    todayStats.queued = comments.length;
    await chrome.storage.local.set({ todayStats });

    // Process each comment
    for (const comment of comments) {
      await processComment(comment, token, serverUrl);

      // Random delay between posts (5-15 seconds)
      const delay = 5000 + Math.random() * 10000;
      await new Promise((r) => setTimeout(r, delay));
    }
  } catch (err) {
    console.error("[CommentFlow] Poll error:", err);
  }
}

async function processComment(comment, token, serverUrl) {
  console.log(`[CommentFlow] Processing comment ${comment.id} for ${comment.url}`);

  let previousTab = null;
  try {
    // Remember the currently active tab so we can switch back
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) previousTab = activeTab.id;

    // Open the post URL in an active tab so the page fully renders
    const tab = await chrome.tabs.create({
      url: comment.url,
      active: true,
    });

    // Wait for the page to load
    await waitForTabLoad(tab.id);

    // Additional wait for dynamic content (SPAs like Reddit/YouTube need this)
    await new Promise((r) => setTimeout(r, 4000 + Math.random() * 3000));

    // Send message to content script to post the comment
    const result = await chrome.tabs.sendMessage(tab.id, {
      type: "POST_COMMENT",
      text: comment.text,
      platform: comment.platform,
    });

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
    const { todayStats = { posted: 0, failed: 0, queued: 0 } } =
      await chrome.storage.local.get(["todayStats"]);
    if (result.success) {
      todayStats.posted++;
    } else {
      todayStats.failed++;
    }
    todayStats.queued = Math.max(0, todayStats.queued - 1);
    await chrome.storage.local.set({ todayStats });

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

    const { todayStats = { posted: 0, failed: 0, queued: 0 } } =
      await chrome.storage.local.get(["todayStats"]);
    todayStats.failed++;
    todayStats.queued = Math.max(0, todayStats.queued - 1);
    await chrome.storage.local.set({ todayStats });
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
