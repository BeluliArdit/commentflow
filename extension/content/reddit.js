// CommentFlow - Reddit Content Script (targets old.reddit.com)
// Two-tier approach: API first, DOM fallback

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "POST_COMMENT") {
    postRedditComment(msg.text)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function postRedditComment(text) {
  // Extract post ID from URL: /comments/POST_ID/
  const match = window.location.pathname.match(/\/comments\/([a-z0-9]+)/i);
  if (!match) {
    return { success: false, error: "Could not extract post ID from URL" };
  }
  const postId = match[1];
  const thingId = `t3_${postId}`;

  // Simulate a human browsing the page before commenting
  await simulateReading();

  // Try API approach first, fall back to DOM
  const apiResult = await tryRedditAPI(thingId, text);
  if (apiResult.success) return apiResult;

  console.log("[CommentFlow] API approach failed, trying DOM approach:", apiResult.error);

  const domResult = await tryDOMApproach(text);
  return domResult;
}

// Scroll around the page like a person reading the post
async function simulateReading() {
  // Scroll down a bit to read the post
  const scrollAmount = 200 + Math.random() * 400;
  window.scrollBy({ top: scrollAmount, behavior: "smooth" });
  await sleep(1500 + Math.random() * 2000);

  // Maybe scroll a bit more
  if (Math.random() > 0.4) {
    window.scrollBy({ top: 150 + Math.random() * 300, behavior: "smooth" });
    await sleep(1000 + Math.random() * 1500);
  }

  // Scroll back up to the comment area
  window.scrollTo({ top: 0, behavior: "smooth" });
  await sleep(800 + Math.random() * 500);
}

// Return a clean www.reddit.com URL for dashboard display
function cleanPlatformUrl() {
  return window.location.href.replace("old.reddit.com", "www.reddit.com");
}

// ---- Primary: Old Reddit API ----

async function tryRedditAPI(thingId, text) {
  try {
    const modhash = await getModhash();
    if (!modhash) {
      return { success: false, error: "Could not get modhash - user may not be logged in" };
    }

    const res = await fetch("https://old.reddit.com/api/comment", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Modhash": modhash,
      },
      body: `thing_id=${thingId}&text=${encodeURIComponent(text)}&api_type=json`,
    });

    if (!res.ok) {
      return { success: false, error: `Reddit API returned ${res.status}` };
    }

    const data = await res.json();

    if (data.json?.errors?.length > 0) {
      const errMsg = data.json.errors.map((e) => e.join(": ")).join(", ");
      return { success: false, error: `Reddit error: ${errMsg}` };
    }

    return { success: true, platformUrl: cleanPlatformUrl() };
  } catch (err) {
    return { success: false, error: `API error: ${err.message}` };
  }
}

async function getModhash() {
  // Method 1: Hidden input field on old Reddit pages
  const uhInput = document.querySelector('input[name="uh"]');
  if (uhInput && uhInput.value) {
    return uhInput.value;
  }

  // Method 2: Extract from inline script tags
  const scripts = document.querySelectorAll("script");
  for (const script of scripts) {
    const content = script.textContent;
    if (content) {
      const match = content.match(/modhash['":\s]+['"]([a-z0-9]+)['"]/i);
      if (match) return match[1];
    }
  }

  // Method 3: Fetch from API endpoint
  try {
    const res = await fetch("https://old.reddit.com/api/me.json", {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.modhash || null;
  } catch {
    return null;
  }
}

// ---- Fallback: Old Reddit DOM ----

async function tryDOMApproach(text) {
  // Scroll to the comment area
  const commentArea = document.querySelector("div.commentarea");
  if (commentArea) {
    commentArea.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(800);
  }

  // Find the textarea (old Reddit uses a simple <textarea name="text">)
  let textarea = null;
  for (let i = 0; i < 15; i++) {
    textarea = document.querySelector('textarea[name="text"]');
    if (textarea) break;
    await sleep(500);
  }

  if (!textarea) {
    return { success: false, error: "Could not find comment textarea (DOM fallback)" };
  }

  textarea.scrollIntoView({ behavior: "smooth", block: "center" });
  await sleep(500);

  // Simulate human-like typing
  await simulateTyping(textarea, text);
  await sleep(1000 + Math.random() * 2000);

  // Find the submit button
  const form = textarea.closest("form");
  const submitBtn =
    (form && form.querySelector('button[type="submit"]')) ||
    (form && form.querySelector("button.save")) ||
    document.querySelector('button[type="submit"].save') ||
    document.querySelector("button.save");

  if (!submitBtn) {
    return { success: false, error: "Could not find submit button (DOM fallback)" };
  }

  submitBtn.scrollIntoView({ behavior: "smooth", block: "center" });
  await sleep(300);
  submitBtn.click();
  await sleep(3000);

  return { success: true, platformUrl: cleanPlatformUrl() };
}

async function simulateTyping(textarea, text) {
  textarea.focus();
  await sleep(500);

  for (const char of text) {
    textarea.value += char;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(30 + Math.random() * 90);
  }
  textarea.dispatchEvent(new Event("change", { bubbles: true }));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
