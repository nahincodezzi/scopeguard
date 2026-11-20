/**
 * ScopeGuard AI — Gmail Content Script (Manifest V3)
 * Injects "Analyze scope" button and renders 400px Calm Ledger sidebar
 */

(function () {
  let sidebarEl = null;
  let currentProject = null;
  let allProjects = [];
  let currentAnalysis = null;

  function init() {
    createSidebar();
    injectToolbarButton();
    setInterval(injectToolbarButton, 2000); // Poll for Gmail dynamic route navigation
  }

  function injectToolbarButton() {
    // Look for Gmail thread toolbar actions
    const toolbars = document.querySelectorAll("div[role='toolbar'], div.G-Ni, div.G-atb");
    toolbars.forEach((tb) => {
      if (tb.querySelector(".scopeguard-gmail-btn")) return;

      const btn = document.createElement("button");
      btn.className = "scopeguard-gmail-btn";
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>Analyze scope</span>
      `;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAnalyzeScopeClick();
      });
      tb.appendChild(btn);
    });
  }

  function createSidebar() {
    if (document.getElementById("scopeguard-sidebar-container")) return;

    sidebarEl = document.createElement("div");
    sidebarEl.id = "scopeguard-sidebar-container";
    sidebarEl.innerHTML = `
      <div class="sg-sidebar-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <strong style="font-size:14px; font-weight:700;">ScopeGuard AI</strong>
          <span class="sg-badge sg-badge-grey">Gmail</span>
        </div>
        <button id="sg-close-btn" style="background:none; border:none; cursor:pointer; font-size:18px; color:#5F6672;">✕</button>
      </div>

      <div class="sg-sidebar-body" id="sg-sidebar-body">
        <div style="padding:12px; background:#FAFAF9; border:1px solid #E7E8EB; border-radius:8px; margin-bottom:14px; font-size:12px; color:#5F6672;">
          <strong>Privacy first:</strong> Only this email's text is sent for SOW analysis.
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:11.5px; font-weight:600; text-transform:uppercase; color:#5F6672; display:block; margin-bottom:4px;">Target Project</label>
          <select id="sg-project-select" style="width:100%; padding:8px; border-radius:8px; border:1px solid #E7E8EB; font-size:13px; background:#fff;"></select>
        </div>

        <div id="sg-analysis-container" style="display:none; space-y:12px;">
          <!-- Dynamically populated analysis results -->
        </div>

        <div id="sg-empty-state" style="text-align:center; padding:24px 8px; color:#5F6672; font-size:13px;">
          Click "Analyze scope" on an opened email thread to check deliverables and exclusions.
        </div>
      </div>
    `;

    document.body.appendChild(sidebarEl);

    document.getElementById("sg-close-btn").addEventListener("click", () => {
      sidebarEl.classList.remove("open");
    });
  }

  async function handleAnalyzeScopeClick() {
    sidebarEl.classList.add("open");
    const bodyEl = document.getElementById("sg-sidebar-body");
    const container = document.getElementById("sg-analysis-container");
    const emptyState = document.getElementById("sg-empty-state");

    // Extract message body and sender email from Gmail DOM
    let emailText = "";
    let senderEmail = "";

    const emailBodies = document.querySelectorAll(".ii.gt .a3s.aiL, div[role='listitem'] .ii.gt");
    if (emailBodies.length > 0) {
      emailText = emailBodies[emailBodies.length - 1].innerText;
    }

    const emailHeaders = document.querySelectorAll("span.gD, span[email]");
    if (emailHeaders.length > 0) {
      senderEmail = emailHeaders[emailHeaders.length - 1].getAttribute("email") || "";
    }

    if (!emailText.trim()) {
      alert("Please open an email message before analyzing.");
      return;
    }

    emptyState.style.display = "none";
    container.style.display = "block";
    container.innerHTML = `
      <div style="text-align:center; padding:32px 0;">
        <div style="font-size:13.5px; font-weight:600; color:#14161B; margin-bottom:4px;">Reading SOW & Comparing Scope...</div>
        <div style="font-size:12px; color:#5F6672;">Checking deliverables, exclusions, and revision limits.</div>
      </div>
    `;

    chrome.storage.local.get(["scopeguard_token", "scopeguard_host"], async (storage) => {
      const token = storage.scopeguard_token || "sg_live_a89f2b740e69123c4a20b9e847cd9";
      const host = storage.scopeguard_host || "http://localhost:3000";

      try {
        // Fetch projects
        const projRes = await fetch(`${host}/api/extension/projects?email=${encodeURIComponent(senderEmail)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const projData = await projRes.json();
        allProjects = projData.projects || [];

        const selectEl = document.getElementById("sg-project-select");
        selectEl.innerHTML = "";
        allProjects.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = `${p.title} (${p.client_company || p.client_name})`;
          selectEl.appendChild(opt);
        });

        if (allProjects.length === 0) {
          container.innerHTML = `<div style="color:#B42318; font-size:13px;">No projects found in ScopeGuard. Create a project in the dashboard first.</div>`;
          return;
        }

        currentProject = allProjects[0];

        // Call analyze API
        const analyzeRes = await fetch(`${host}/api/extension/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            project_id: currentProject.id,
            message: emailText,
            source: "email",
          }),
        });

        const result = await analyzeRes.json();
        if (!analyzeRes.ok) {
          throw new Error(result.error || "Analysis failed");
        }

        currentAnalysis = result;
        renderAnalysisResult(result, host, token);
      } catch (err) {
        container.innerHTML = `
          <div style="padding:12px; border-radius:8px; background:#FEF0EE; border:1px solid #F8C9C2; color:#B42318; font-size:13px;">
            ${err.message}
          </div>
        `;
      }
    });
  }

  function renderAnalysisResult(result, host, token) {
    const container = document.getElementById("sg-analysis-container");

    let badgeClass = "sg-badge-out";
    let badgeText = "Out of Scope";
    if (result.verdict === "IN_SCOPE") {
      badgeClass = "sg-badge-in";
      badgeText = "In Scope";
    } else if (result.verdict === "GREY_AREA") {
      badgeClass = "sg-badge-grey";
      badgeText = "Grey Area / Revision";
    }

    container.innerHTML = `
      <div style="padding:12px; border-radius:10px; border:1px solid #E7E8EB; background:#fff; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span class="sg-badge ${badgeClass}">${badgeText}</span>
          <span style="font-size:12px; font-weight:700; font-family:monospace; color:#14161B;">$${result.suggested_price || 0}</span>
        </div>
        <div style="font-size:14px; font-weight:600; color:#14161B; margin-bottom:4px;">${result.change_order_title}</div>
        <div style="font-size:12.5px; color:#3D424C; line-height:1.4;">${result.reasoning}</div>
      </div>

      <div style="margin-bottom:12px;">
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:#5F6672; margin-bottom:6px;">Line Items</div>
        <div style="border:1px solid #E7E8EB; border-radius:8px; overflow:hidden; font-size:12px;">
          ${(result.line_items || [])
            .map(
              (li) => `
            <div style="padding:8px 10px; border-bottom:1px solid #EFEFED; display:flex; justify-content:space-between;">
              <div>
                <strong style="color:#14161B;">${li.request}</strong>
                <div style="color:#5F6672; font-size:11px;">${li.work_description}</div>
              </div>
              <div style="text-align:right; font-family:monospace; font-weight:600;">${li.estimated_hours}h</div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>

      <div style="margin-bottom:12px;">
        <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:#5F6672; margin-bottom:6px;">Drafted Reply</div>
        <div id="sg-reply-box" style="padding:10px; border-radius:8px; background:#FAFAF9; border:1px solid #E7E8EB; font-size:12.5px; white-space:pre-wrap; max-height:140px; overflow-y:auto;">
          ${result.reply_draft}
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:8px;">
        <button id="sg-insert-btn" class="sg-btn-primary">
          Insert reply + create change order
        </button>
        <button id="sg-open-app-btn" class="sg-btn-secondary">
          Open in ScopeGuard App
        </button>
      </div>
    `;

    document.getElementById("sg-insert-btn").addEventListener("click", async () => {
      const btn = document.getElementById("sg-insert-btn");
      btn.textContent = "Creating Change Order...";

      try {
        const coRes = await fetch(`${host}/api/extension/create-change-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            project_id: currentProject.id,
            title: result.change_order_title,
            line_items: result.line_items,
            total_hours: result.estimated_hours,
            total_fee: result.suggested_price,
            reply_draft: result.reply_draft,
          }),
        });

        const coData = await coRes.json();
        if (!coRes.ok) throw new Error(coData.error || "Failed to create CO");

        // Insert final reply with real link into Gmail compose box
        const composeBox = document.querySelector("div[role='textbox'][aria-label*='Message Body']");
        if (composeBox) {
          composeBox.innerText = coData.finalReply;
          btn.textContent = "Inserted into Gmail ✓";
        } else {
          navigator.clipboard.writeText(coData.finalReply);
          btn.textContent = "Reply Copied to Clipboard ✓";
        }
      } catch (e) {
        alert(e.message);
        btn.textContent = "Insert reply + create change order";
      }
    });

    document.getElementById("sg-open-app-btn").addEventListener("click", () => {
      window.open(`${host}/projects/${currentProject.id}`, "_blank");
    });
  }

  // Run on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
