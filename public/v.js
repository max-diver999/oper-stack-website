/*! OperStack AI visit counter. One request, and only when the visitor arrived from an AI
    assistant. Nothing about the visitor is read or sent: the assistant's name is all that leaves
    this page. What you get back is how many people each assistant sent you.
    Free, and the code is open: https://oper-stack.com/visits/ */
(function () {
  try {
    var s = document.currentScript || document.querySelector('script[data-key]');
    var key = s && s.getAttribute('data-key');
    if (!key) return;
    var ref = document.referrer;
    if (!ref) return;
    var host = new URL(ref).hostname.replace(/^www\./, '').toLowerCase();
    var known = ["chatgpt.com","chat.openai.com","perplexity.ai","www.perplexity.ai","claude.ai","copilot.microsoft.com","copilot.com","m365.cloud.microsoft","gemini.google.com","aistudio.google.com","notebooklm.google.com","grok.com","duck.ai","you.com","chat.qwen.ai","chat.deepseek.com","doubao.com","alice.yandex.ru","chat.mistral.ai","meta.ai","phind.com"];
    if (known.indexOf(host) < 0) return;
    if (sessionStorage.getItem('op_visit')) return;
    sessionStorage.setItem('op_visit', '1');
    fetch("https://oper-stack.com/api/visits/hit", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key, from: host }),
      keepalive: true,
      mode: 'cors',
      credentials: 'omit'
    }).catch(function () {});
  } catch (e) {}
})();
