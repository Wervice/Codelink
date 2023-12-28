const webview = document.getElementById('your-webview-element');

// <webview> Content is loaded
function contentload() {
  // The following will be injected in the webview
  const webviewInjectScript = `
      var data = {
        webPage: document.title,
      };

      function respond(event) {
        event.source.postMessage(data, '*');
      }

      window.addEventListener("message", respond, false);
  `;

  webview.executeScript({
    code: webviewInjectScript
  });
}

// <webview> Loading has finished
function loadstop() {
  webview.contentWindow.postMessage("webPageReq", "*"); // Send a request to the webview
}

// Bind events
webview.addEventListener("contentload", contentload);
webview.addEventListener("loadstop", loadstop);
window.addEventListener("message", receiveHandshake, false); // Listen for response

function receiveHandshake(event) {
  // Data is accessible as event.data.*
  // This is the custom object that was injected during contentload()
  // i.e. event.data.title, event.data.url
  console.log(event.data)

  // Unbind EventListeners
  removeListeners();
}

// Remove all event listeners
function removeListeners() {
  webview.removeEventListener("contentload", contentload);
  webview.removeEventListener("loadstop", loadstop);
  window.removeEventListener("message", receiveHandshake);
}
