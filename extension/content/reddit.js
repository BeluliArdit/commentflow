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
  // Try new Reddit first
  const result = await tryNewReddit(text);
  return result;
}

async function tryNewReddit(text) {
  // Wait for the comment box to appear
  let commentBox = null;
  for (let i = 0; i < 10; i++) {
    // New Reddit uses a contenteditable div or textarea
    commentBox =
      document.querySelector('[data-test-id="comment-submission-form-richtext"] [contenteditable="true"]') ||
      document.querySelector('div[contenteditable="true"][data-lexical-editor]') ||
      document.querySelector('shreddit-composer textarea') ||
      document.querySelector('textarea[name="body"]') ||
      document.querySelector('[slot="comment"] textarea');

    if (commentBox) break;
    await sleep(1000);
  }

  if (!commentBox) {
    // Try clicking "Add a comment" button first
    const addCommentBtn = document.querySelector(
      'button[aria-label="Add a comment"], [placeholder*="Add a comment"], div[data-click-id="text"]'
    );
    if (addCommentBtn) {
      addCommentBtn.click();
      await sleep(2000);

      commentBox =
        document.querySelector('div[contenteditable="true"]') ||
        document.querySelector('textarea[name="body"]');
    }
  }

  if (!commentBox) {
    return { success: false, error: "Could not find comment box" };
  }

  // Simulate human-like typing
  await simulateTyping(commentBox, text);

  // Wait a bit before submitting
  await sleep(1000 + Math.random() * 2000);

  // Find and click submit button
  const submitBtn =
    document.querySelector('button[type="submit"][slot="submit-button"]') ||
    document.querySelector('button[data-testid="comment-submission-form-submit"]') ||
    findButtonByText("Comment") ||
    findButtonByText("Reply");

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

async function simulateTyping(element, text) {
  element.focus();
  await sleep(500);

  if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
    // For textarea/input elements
    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(30 + Math.random() * 80);
    }
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    // For contenteditable elements
    for (const char of text) {
      // Dispatch keydown
      element.dispatchEvent(
        new KeyboardEvent("keydown", { key: char, bubbles: true })
      );

      // Insert the character
      document.execCommand("insertText", false, char);

      // Dispatch keyup
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
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
