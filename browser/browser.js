const { exec } = require("child_process");
const { exitCode } = require("process");
const fs = require("fs");
const { urlToHttpOptions } = require("url");
const { hostname } = require("os");
win = nw.Window.get();
win.width = 700;
win.height = 600;
window.onload = function () {
  setTimeout(function () {
    document.body.hidden = false;
    document.getElementById("url").value =
      document.getElementById("webview").src;
  }, 250);
  document
    .getElementById("url").onchange = function() {
      document.getElementById("webview").src = document
      .getElementById("url").value
    }
  document.getElementById("webview").addEventListener("change", function () {});
  document
    .getElementById("webview")
    .addEventListener("newwindow", function (e) {
      document.getElementById("webview").src = e.targetUrl;
      document.getElementById("url").value =
        document.getElementById("webview").src;
    });
  urla = "";
  urlb = "";
  setInterval(function () {
    urla = document.getElementById("webview").src;
    if (urla != urlb) {
      curl = document.getElementById("webview").src;
    }
    urlb = document.getElementById("webview").src;
  }, 100);
};