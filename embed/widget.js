/**
 * Vimala Bot – Embeddable Chat Widget
 *
 * Usage: Add this to any website:
 *   <script src="https://your-domain.com/widget.js" data-api="http://localhost:8000"></script>
 *
 * Options (via data- attributes on the script tag):
 *   data-api        – Backend URL (default: http://localhost:8000)
 *   data-title      – Widget title (default: Vimala Bot)
 *   data-collection – ChromaDB collection (default: default)
 *   data-position   – "right" or "left" (default: right)
 *   data-color      – Primary color hex (default: #8B0000)
 */

(function () {
  "use strict";

  // ── Read config from script tag ──
  const scriptTag = document.currentScript;
  const API_BASE = (scriptTag?.getAttribute("data-api") || "http://localhost:8000").replace(/\/+$/, "");
  const TITLE = scriptTag?.getAttribute("data-title") || "Vimala Bot";
  const COLLECTION = scriptTag?.getAttribute("data-collection") || "default";
  const POSITION = scriptTag?.getAttribute("data-position") || "right";
  const COLOR = scriptTag?.getAttribute("data-color") || "#8B0000";

  // ── State ──
  let sessionId = null;
  let isOpen = false;
  let sidebarOpen = true;
  let activeView = "chat";
  let messages = [];
  let loading = false;

  // ── API helpers ──
  async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}/api/v1${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function createSession() {
    try {
      const data = await apiPost("/chat/session", {});
      sessionId = data.session_id;
    } catch (e) {
      console.error("[VimalaBot] Session creation failed:", e);
    }
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    messages.push({ sender: "user", text });
    renderMessages();

    if (!sessionId) {
      messages.push({ sender: "bot", text: "Connecting... please try again in a moment." });
      renderMessages();
      await createSession();
      return;
    }

    loading = true;
    renderMessages();

    try {
      const data = await apiPost("/chat/", {
        message: text,
        session_id: sessionId,
        collection_name: COLLECTION,
      });
      messages.push({ sender: "bot", text: data.response || data.answer || "No response." });
    } catch (e) {
      messages.push({ sender: "bot", text: "Error getting response. Please try again." });
    } finally {
      loading = false;
      renderMessages();
    }
  }

  // ── Inject styles ──
  function injectStyles() {
    const posLeft = POSITION === "left";
    const style = document.createElement("style");
    style.textContent = `
      #vbot-fab{position:fixed;bottom:24px;${posLeft?"left":"right"}:24px;width:60px;height:60px;border-radius:50%;background:${COLOR};color:#fff;font-size:26px;border:none;cursor:pointer;z-index:10000;box-shadow:0 4px 15px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;transition:.3s}
      #vbot-fab:hover{transform:scale(1.08)}
      #vbot-widget{position:fixed;bottom:100px;${posLeft?"left":"right"}:24px;width:460px;height:540px;background:#F8F5F2;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;z-index:10000;font-family:'Segoe UI',system-ui,sans-serif}
      #vbot-widget.open{display:flex}
      #vbot-header{background:${COLOR};color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
      #vbot-header span{font-weight:700;font-size:16px}
      #vbot-header button{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:4px 8px}
      #vbot-body{flex:1;display:flex;overflow:hidden}
      #vbot-sidebar{width:160px;background:#F1EDEA;padding:12px;flex-shrink:0;border-right:1px solid #E5E5E5;display:flex;flex-direction:column;align-items:center}
      #vbot-sidebar.hidden{display:none}
      #vbot-sidebar button{width:90%;margin-bottom:10px;padding:8px;border:none;border-radius:6px;background:${COLOR.replace("#8B0000","#A11212")};color:#fff;cursor:pointer;font-size:13px;transition:.3s}
      #vbot-sidebar button:hover{opacity:.85}
      #vbot-sidebar button.active{background:#fff;color:${COLOR};border:1px solid ${COLOR}}
      #vbot-content{flex:1;display:flex;flex-direction:column;overflow:hidden}
      #vbot-messages{flex:1;padding:16px;overflow-y:auto;background:#F8F5F2;display:flex;flex-direction:column}
      .vbot-msg{max-width:75%;margin-bottom:10px;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word}
      .vbot-msg.bot{background:#fff;color:#222;align-self:flex-start;border:1px solid #E5E5E5}
      .vbot-msg.user{background:${COLOR};color:#fff;align-self:flex-end}
      .vbot-msg.loading{opacity:.6;font-style:italic}
      #vbot-input-area{display:flex;align-items:center;gap:8px;padding:12px;border-top:1px solid #E5E5E5;background:#fff}
      #vbot-input{flex:1;padding:10px 14px;border-radius:20px;border:1px solid #ccc;outline:none;font-size:14px}
      #vbot-input:focus{border-color:${COLOR};box-shadow:0 0 0 2px ${COLOR}22}
      #vbot-send{background:${COLOR};color:#fff;border:none;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
      #vbot-send:hover{opacity:.9;transform:scale(1.05)}
      #vbot-info{padding:20px;overflow-y:auto;background:#F8F5F2;flex:1}
      #vbot-info h1{text-align:center;color:${COLOR};font-size:20px;margin-bottom:6px}
      #vbot-info .subtitle{text-align:center;color:#666;font-size:13px;margin-bottom:20px}
      #vbot-info p{color:#444;font-size:13px;line-height:1.6}
      #vbot-info details{background:#fff;border-radius:10px;padding:12px 14px;margin-bottom:12px;cursor:pointer;border:1px solid #E5E5E5}
      #vbot-info summary{font-size:14px;font-weight:500;color:${COLOR};list-style:none;display:flex;justify-content:space-between;align-items:center}
      #vbot-info summary::after{content:"⌄";font-size:16px;color:${COLOR}}
      #vbot-info details[open] summary::after{transform:rotate(180deg)}
      #vbot-info summary::-webkit-details-marker{display:none}
      .vbot-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
      .vbot-card{background:#fff;border-radius:12px;padding:14px;text-align:center;border:1px solid #E5E5E5}
      .vbot-card h3{color:${COLOR};font-size:13px;margin:0 0 6px}
      .vbot-card p{font-size:12px;margin:0}
      @media(max-width:520px){#vbot-widget{width:calc(100vw - 16px);${posLeft?"left":"right"}:8px;bottom:90px;height:70vh}#vbot-sidebar{width:120px}.vbot-cards{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  // ── Build DOM ──
  function buildWidget() {
    // FAB
    const fab = document.createElement("button");
    fab.id = "vbot-fab";
    fab.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    fab.onclick = () => toggleWidget();
    document.body.appendChild(fab);

    // Widget
    const widget = document.createElement("div");
    widget.id = "vbot-widget";
    widget.innerHTML = `
      <div id="vbot-header">
        <button id="vbot-menu">☰</button>
        <span>${TITLE}</span>
        <button id="vbot-close">✕</button>
      </div>
      <div id="vbot-body">
        <div id="vbot-sidebar">
          <button data-view="chat" class="active">New Chat</button>
          <button data-view="faq">FAQ</button>
          <button data-view="about">About</button>
        </div>
        <div id="vbot-content">
          <div id="vbot-chat-view">
            <div id="vbot-messages"></div>
            <div id="vbot-input-area">
              <input id="vbot-input" type="text" placeholder="Type a message..." />
              <button id="vbot-send">▶</button>
            </div>
          </div>
          <div id="vbot-info" style="display:none"></div>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    // Events
    document.getElementById("vbot-close").onclick = () => toggleWidget();
    document.getElementById("vbot-menu").onclick = () => {
      sidebarOpen = !sidebarOpen;
      document.getElementById("vbot-sidebar").classList.toggle("hidden", !sidebarOpen);
    };

    document.querySelectorAll("#vbot-sidebar button").forEach((btn) => {
      btn.onclick = () => switchView(btn.getAttribute("data-view"));
    });

    const input = document.getElementById("vbot-input");
    const sendBtn = document.getElementById("vbot-send");
    sendBtn.onclick = () => { sendMessage(input.value); input.value = ""; };
    input.onkeydown = (e) => { if (e.key === "Enter") { sendMessage(input.value); input.value = ""; } };
  }

  function toggleWidget() {
    isOpen = !isOpen;
    document.getElementById("vbot-widget").classList.toggle("open", isOpen);
    if (isOpen && !sessionId) createSession();
  }

  function switchView(view) {
    activeView = view;
    document.querySelectorAll("#vbot-sidebar button").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-view") === view);
    });

    const chatView = document.getElementById("vbot-chat-view");
    const infoView = document.getElementById("vbot-info");

    if (view === "chat") {
      chatView.style.display = "flex";
      chatView.style.flexDirection = "column";
      chatView.style.height = "100%";
      infoView.style.display = "none";
    } else if (view === "faq") {
      chatView.style.display = "none";
      infoView.style.display = "block";
      infoView.innerHTML = `
        <h1>Frequently Asked Questions</h1>
        <p class="subtitle">Find quick answers to common questions</p>
        <details><summary>What is the College Chatbot?</summary><p>The College Chatbot is a virtual assistant designed to help students get instant information about admissions, courses, fees, academic schedules, and campus services.</p></details>
        <details><summary>Is the chatbot available 24/7?</summary><p>Yes, the chatbot is available 24/7 to assist students anytime without depending on office hours.</p></details>
        <details><summary>Can I check admission details through the chatbot?</summary><p>Yes, you can check admission-related information such as eligibility, important dates, and procedures.</p></details>
        <details><summary>Is my data safe with the chatbot?</summary><p>Absolutely. The chatbot follows secure practices to protect student data and ensures privacy and reliability.</p></details>
        <details><summary>Can I use the chatbot on mobile?</summary><p>Yes, the chatbot is fully responsive and works on mobile, tablet, and desktop devices.</p></details>
      `;
    } else if (view === "about") {
      chatView.style.display = "none";
      infoView.style.display = "block";
      infoView.innerHTML = `
        <h1>About Our College Chatbot</h1>
        <p class="subtitle">Smart · Secure · Student Friendly</p>
        <p>Our College Chatbot is a smart digital assistant designed to provide instant information to students regarding admissions, courses, fees, academic schedules and campus services.</p>
        <div class="vbot-cards">
          <div class="vbot-card"><h3>AI Powered</h3><p>Intelligent automation for instant, accurate answers.</p></div>
          <div class="vbot-card"><h3>Student Friendly</h3><p>Simple, clean interface for easy interaction.</p></div>
          <div class="vbot-card"><h3>Secure & Reliable</h3><p>Protects student information at all times.</p></div>
          <div class="vbot-card"><h3>24/7 Available</h3><p>Access information anytime, anywhere.</p></div>
        </div>
      `;
    }
  }

  function renderMessages() {
    const container = document.getElementById("vbot-messages");
    if (!container) return;
    let html = messages.map((m) =>
      `<div class="vbot-msg ${m.sender}">${escapeHtml(m.text)}</div>`
    ).join("");
    if (loading) html += `<div class="vbot-msg bot loading">Thinking…</div>`;
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Init ──
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    injectStyles();
    buildWidget();
  }
})();
