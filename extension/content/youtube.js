// CommentFlow - YouTube Content Script
// Handles posting comments on YouTube via the extension

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "POST_COMMENT") {
    postYouTubeComment(msg.text)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function postYouTubeComment(text) {
  // Scroll down to load the comments section
  window.scrollBy(0, 500);
  await sleep(2000);

  // Find the comment input placeholder
  let placeholder = null;
  for (let i = 0; i < 15; i++) {
    placeholder =
      document.querySelector('#simplebox-placeholder') ||
      document.querySelector('ytd-comment-simplebox-renderer #placeholder-area');

    if (placeholder) break;
    window.scrollBy(0, 300);
    await sleep(1000);
  }

  if (!placeholder) {
    return { success: false, error: "Could not find YouTube comment box" };
  }

  // Click the placeholder to open the comment editor
  placeholder.click();
  await sleep(1500);

  // Find the actual editable area
  const commentBox =
    document.querySelector('#contenteditable-root[contenteditable="true"]') ||
    document.querySelector('div#contenteditable-root');

  if (!commentBox) {
    return { success: false, error: "Could not find YouTube comment editor" };
  }

  // Type the comment
  await simulateTyping(commentBox, text);
  await sleep(1000 + Math.random() * 2000);

  // Find and click the submit button
  const submitBtn =
    document.querySelector('#submit-button button') ||
    document.querySelector('ytd-button-renderer#submit-button button') ||
    findButtonByAriaLabel("Comment");

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

  for (const char of text) {
    element.dispatchEvent(
      new KeyboardEvent("keydown", { key: char, bubbles: true })
    );
    document.execCommand("insertText", false, char);
    element.dispatchEvent(
      new KeyboardEvent("keyup", { key: char, bubbles: true })
    );
    element.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(30 + Math.random() * 80);
  }
}

function findButtonByAriaLabel(label) {
  const buttons = document.querySelectorAll("button");
  for (const btn of buttons) {
    if (btn.getAttribute("aria-label")?.toLowerCase().includes(label.toLowerCase())) {
      return btn;
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
