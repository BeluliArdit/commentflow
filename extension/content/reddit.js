// CommentFlow - Reddit Content Script
// Handles posting comments on Reddit via the extension

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "POST_COMMENT") {
    postRedditComment(msg.text)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep the message channel open for async response
  }
});

async function postRedditComment(text) {
  const result = await tryNewReddit(text);
  return result;
}

async function tryNewReddit(text) {
  // Step 1: Click the "Join the conversation" / comment area to open the editor
  await activateCommentEditor();

  // Step 2: Wait for the actual editable comment box to appear
  let commentBox = null;
  for (let i = 0; i < 20; i++) {
    commentBox = deepQuery('div[contenteditable="true"]')
      || deepQuery('textarea[name="body"]')
      || deepQuery('[role="textbox"]')
      || document.querySelector('div[contenteditable="true"]')
      || document.querySelector('textarea[name="body"]');

    if (commentBox) break;
    await sleep(500);
  }

  if (!commentBox) {
    return { success: false, error: "Could not find comment box" };
  }

  // Step 3: Type the comment
  await simulateTyping(commentBox, text);

  // Step 4: Wait before submitting
  await sleep(1000 + Math.random() * 2000);

  // Step 5: Find and click submit button
  const submitBtn =
    deepQuery('button[type="submit"]')
    || deepQuery('button[slot="submit-button"]')
    || document.querySelector('button[type="submit"][slot="submit-button"]')
    || document.querySelector('shreddit-composer button[type="submit"]')
    || document.querySelector('button[data-testid="comment-submission-form-submit"]')
    || findButtonByText("Comment")
    || findButtonByText("Reply");

  if (!submitBtn) {
    return { success: false, error: "Could not find submit button" };
  }

  submitBtn.click();
  await sleep(3000);

  return {
    success: true,
    platformUrl: window.location.href,
  };
}

async function activateCommentEditor() {
  // Strategy 1: Find the "Join the conversation" element anywhere (including shadow DOM)
  const joinEl = findByText("Join the conversation") || findByText("Add a comment");
  if (joinEl) {
    joinEl.click();
    await sleep(2000);
    // Check if editor opened
    if (deepQuery('div[contenteditable="true"]') || deepQuery('textarea')) return;
  }

  // Strategy 2: Click on shreddit-comment-composer-button (Reddit's web component for the collapsed comment input)
  const composerBtn = document.querySelector('shreddit-comment-composer-button');
  if (composerBtn) {
    composerBtn.click();
    // Also try clicking inside its shadow root
    if (composerBtn.shadowRoot) {
      const inner = composerBtn.shadowRoot.querySelector('button, div, input');
      if (inner) inner.click();
    }
    await sleep(2000);
    if (deepQuery('div[contenteditable="true"]') || deepQuery('textarea')) return;
  }

  // Strategy 3: Click on shreddit-composer itself
  const composer = document.querySelector('shreddit-composer');
  if (composer) {
    composer.click();
    if (composer.shadowRoot) {
      const inner = composer.shadowRoot.querySelector('div[contenteditable="true"], textarea, button, input');
      if (inner) { inner.click(); inner.focus(); }
    }
    await sleep(2000);
    if (deepQuery('div[contenteditable="true"]') || deepQuery('textarea')) return;
  }

  // Strategy 4: Try clicking any element with placeholder containing "conversation" or "comment"
  const placeholderEls = document.querySelectorAll('[placeholder]');
  for (const el of placeholderEls) {
    const ph = el.placeholder.toLowerCase();
    if (ph.includes("conversation") || ph.includes("comment")) {
      el.click();
      el.focus();
      await sleep(2000);
      if (deepQuery('div[contenteditable="true"]') || deepQuery('textarea')) return;
    }
  }

  // Strategy 5: Brute force - find ALL custom elements and search their shadow roots
  const allCustomEls = document.querySelectorAll('*');
  for (const el of allCustomEls) {
    if (el.shadowRoot) {
      const match = el.shadowRoot.querySelector(
        '[placeholder*="conversation" i], [placeholder*="comment" i], [aria-label*="comment" i]'
      );
      if (match) {
        match.click();
        match.focus();
        await sleep(2000);
        if (deepQuery('div[contenteditable="true"]') || deepQuery('textarea')) return;
      }
    }
  }

  // Strategy 6: Legacy Reddit selectors
  const legacyBtn = document.querySelector(
    'button[aria-label="Add a comment"], div[data-click-id="text"]'
  );
  if (legacyBtn) {
    legacyBtn.click();
    await sleep(2000);
  }
}

// Deep query: search the regular DOM AND inside all shadow roots recursively
function deepQuery(selector) {
  // First try regular DOM
  const regular = document.querySelector(selector);
  if (regular) return regular;

  // Then search shadow DOMs
  return queryShadowDom(document.body, selector);
}

function queryShadowDom(root, selector) {
  const els = root.querySelectorAll('*');
  for (const el of els) {
    if (el.shadowRoot) {
      const match = el.shadowRoot.querySelector(selector);
      if (match) return match;
      // Recurse into shadow root's children
      const nested = queryShadowDom(el.shadowRoot, selector);
      if (nested) return nested;
    }
  }
  return null;
}

// Find any visible element containing specific text (searches shadow DOMs too)
function findByText(text) {
  const lower = text.toLowerCase();

  // Search regular DOM first
  const found = searchDomForText(document.body, lower);
  if (found) return found;

  return null;
}

function searchDomForText(root, text) {
  // Check placeholders, aria-labels, and text content
  const candidates = root.querySelectorAll('input, button, div[tabindex], span, div[role], a, label, p');
  for (const el of candidates) {
    const ph = (el.placeholder || '').toLowerCase();
    const aria = (el.getAttribute('aria-label') || '').toLowerCase();
    const tc = (el.textContent || '').toLowerCase().trim();

    if (ph.includes(text) || aria.includes(text) || tc === text) {
      return el;
    }
  }

  // Search shadow DOMs
  const allEls = root.querySelectorAll('*');
  for (const el of allEls) {
    if (el.shadowRoot) {
      const found = searchDomForText(el.shadowRoot, text);
      if (found) return found;
    }
  }

  return null;
}

async function simulateTyping(element, text) {
  element.focus();
  await sleep(500);

  if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(30 + Math.random() * 80);
    }
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    // For contenteditable elements
    for (const char of text) {
      element.dispatchEvent(
        new KeyboardEvent("keydown", { key: char, bubbles: true })
      );

      document.execCommand("insertText", false, char);

      element.dispatchEvent(
        new KeyboardEvent("keyup", { key: char, bubbles: true })
      );

      await sleep(30 + Math.random() * 80);
    }
  }
}

function findButtonByText(text) {
  const buttons = document.querySelectorAll("button");
  for (const btn of buttons) {
    if (btn.textContent.trim().toLowerCase() === text.toLowerCase()) {
      return btn;
    }
  }
  // Also check shadow DOMs for buttons
  return deepQuery(`button`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
