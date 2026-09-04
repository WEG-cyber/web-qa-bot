(function () {
  var script = document.currentScript;
  if (!script) return;
  var botId = script.getAttribute("data-bot-id");
  if (!botId) { console.error("Alice Widget: data-bot-id is required"); return; }
  var base = new URL(script.src).origin;
  var iframe = document.createElement("iframe");
  iframe.src = base + "/widget?botId=" + encodeURIComponent(botId) + "&origin=" + encodeURIComponent(location.hostname);
  iframe.title = "AI customer service";
  iframe.setAttribute("allow", "clipboard-write");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:96px;height:96px;border:0;background:transparent;z-index:2147483647;color-scheme:normal";
  document.body.appendChild(iframe);
  window.addEventListener("message", function (event) {
    if (event.source !== iframe.contentWindow || !event.data || event.data.type !== "alice-widget-resize" || event.data.botId !== botId) return;
    iframe.style.width = event.data.open ? "min(440px, 100vw)" : "96px";
    iframe.style.height = event.data.open ? "min(680px, 100vh)" : "96px";
  });
})();
