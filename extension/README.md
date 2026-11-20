# ScopeGuard AI — Gmail Chrome Extension (Manifest V3)

Micro-SaaS companion extension for digital agencies and freelancers using **ScopeGuard AI**.

## Capabilities
- Injects an **"Analyze scope"** button into Gmail email thread toolbars.
- Reads only the opened message text (DOM) with zero cookie access.
- Automatically selects or matches the project by client email.
- Displays the verdict (`IN_SCOPE`, `GREY_AREA`, `OUT_OF_SCOPE`), clause references, billable hours, and drafted reply in a 400px Calm Ledger sidebar.
- 1-click **"Insert reply + create change order"**: creates the change order, generates the public `/approve/[token]` link, replaces the placeholder, and pastes the reply directly into Gmail's reply editor!

## Installation Instructions
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top right corner.
3. Click **Load unpacked** and select this `extension/` folder.
4. Click the ScopeGuard puzzle icon in your Chrome toolbar.
5. Paste your API token from **Settings → Gmail Extension** in ScopeGuard AI (default: `sg_live_a89f2b740e69123c4a20b9e847cd9`).
6. Navigate to `mail.google.com` and open any client thread!
