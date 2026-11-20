document.addEventListener("DOMContentLoaded", () => {
  const tokenInput = document.getElementById("apiToken");
  const urlInput = document.getElementById("apiUrl");
  const saveBtn = document.getElementById("saveBtn");
  const statusDiv = document.getElementById("status");

  chrome.storage.local.get(["scopeguard_token", "scopeguard_host"], (data) => {
    if (data.scopeguard_token) tokenInput.value = data.scopeguard_token;
    if (data.scopeguard_host) urlInput.value = data.scopeguard_host;
  });

  saveBtn.addEventListener("click", () => {
    const token = tokenInput.value.trim();
    const host = urlInput.value.trim() || "http://localhost:3000";

    chrome.storage.local.set(
      {
        scopeguard_token: token,
        scopeguard_host: host,
      },
      () => {
        statusDiv.textContent = "Saved! Reload Gmail to activate.";
        statusDiv.style.color = "#0F7A4A";
        setTimeout(() => {
          statusDiv.textContent = "Connected and active.";
        }, 2000);
      }
    );
  });
});
