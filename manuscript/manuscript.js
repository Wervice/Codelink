const fs = require("fs");
const path = require("path");
const os = require("os");
const marked = require("marked");
const hljs = require("highlight.js");
const { exec } = require("child_process");
const { cursorTo } = require("readline");
win = nw.Window.get();
const manuDir = path.join(os.homedir(), "manuscript");

win.setMinimumSize(790, 500);
function renderNotesList() {
  notes_list = fs.readdirSync(path.join(os.homedir(), "manuscript"));
  notes_list_html = `<button id=newNoteButton><img src='../images/new.png'></button><br>`;
  for (note of notes_list) {
    try {
      if (fs.statSync(path.join(manuDir, note)).isFile()) {
        if (note.split(".")[1] == "md") {
          notes_list_html +=
            "<button onclick=openNote('" +
            encodeURIComponent(note) +
            "');selectButtonHighlight(this) class=noteButton>" +
            note.split(".")[0].replace("<", "&lt;").replace(">", "&gt;") +
            "</button><img src='../images/delete_white.svg' onclick=deleteNote('" +
            encodeURIComponent(note) +
            "')>";
        } else {
          notes_list_html +=
            "<button onclick=openExternalFile('" +
            encodeURIComponent(note) +
            "');selectButtonHighlight(this) class=noteButton>" +
            note.replace("<", "&lt;").replace(">", "&gt;") +
            "</button><img src='../images/delete_white.svg' onclick=deleteNote('" +
            encodeURIComponent(note) +
            "')>";
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  document.getElementById("notes_list").innerHTML = notes_list_html;
  this.document
    .getElementById("newNoteButton")
    .addEventListener("click", function () {
      currentDate = new Date();
      formattedDate = currentDate.toISOString().split("T")[0];
      noteString = `Note @ ${formattedDate}`;
      fs.writeFileSync(
        path.join(manuDir, noteString + ".md"),
        "# " + noteString
      );
      renderNotesList();
    });
}

function openInBrowser(url) {
  url = decodeURIComponent(url);
  if (os.platform() == "win32") {
    exec('explorer ""' + url + '""');
  } else {
    exec('xdg-open "' + url + '"');
  }
}

function selectButtonHighlight(e) {
  for (button of document.querySelectorAll("#notes_list button")) {
    button.classList.remove("selected");
  }
  e.classList.add("selected");
}

function openExternalFile(fpath) {
  fpath = decodeURIComponent(fpath);
  if (os.platform() == "linux") {
    exec('xdg-open "' + path.join(manuDir, fpath) + '"');
  } else {
    if (
      [
        "exe",
        "elf",
        "msi",
        "dll",
        "bat",
        "sh",
        "batch",
        "bash",
        "txt",
        "py",
        "pyw",
        "c",
        "csharp",
        "cpp",
        "js",
        "html",
        "css",
        "bin",
      ].includes(fpath.split(".")[1])
    ) {
      exec('notepad "' + path.join(manuDir, fpath) + '"');
    } else {
      exec('"' + path.join(manuDir, fpath) + '"');
    }
  }
}

codeFilesExt = [
  "py",
  "js",
  "json",
  "cpp",
  "csharp",
  "c",
  "java",
  "html",
  "css",
  "mojo",
  "svg",
  "xml",
  "txt",
  "gitignore",
];

imageFilesExt = ["png", "jpg", "jpeg", "gif", "tiff", "webp", "svg"];

function replaceNoteLinks(inputString) {
  return inputString.replace(
    /(?<!<code>.*)(\[\[([^[\]]+)\]\])(?!.*<\/code>)/g,
    function (match, noteName) {
      if (noteName.replace("[[", "").replace("]]", "")[0] != "@") {
        if (localStorage.getItem("enableLinkedNotes") != "false") {
          var encodedNoteName = encodeURIComponent(
            noteName.replace("[[", "").replace("]]", "")
          );
          return (
            "<button class='noteLink' onclick=\"openNote('" +
            encodedNoteName +
            ".md" +
            "')\">" +
            noteName.replace("[[", "").replace("]]", "") +
            "</button>"
          );
        } else {
          return noteName.replace("[[", "").replace("]]", "");
        }
      } else {
        if (localStorage.getItem("enableEmbeddedFiles") != "false") {
          noteName = noteName.replace("[[", "").replace("]]", "");
          noteName = noteName.replace("@", "");
          var encodedNoteName = encodeURIComponent(noteName);
          if (codeFilesExt.includes(noteName.split(".")[1])) {
            try {
              return (
                "<pre><button class='noteLink' onclick=\"openExternalFile('" +
                encodeURIComponent(noteName) +
                "')\" style='margin:5px;color:white !important;'>File from " +
                noteName +
                ": </button><code>" +
                fs.readFileSync(path.join(manuDir, noteName)).toString() +
                "</code></pre>"
              );
            } catch {
              return "File not found (" + noteName + ")";
            }
          } else if (imageFilesExt.includes(noteName.split(".")[1])) {
            // ! Embedd image
            try {
              return `<img src='${`data:image/${
                noteName.split(".")[1]
              };base64,${fs
                .readFileSync(path.join(manuDir, noteName))
                .toString("base64")}`}' style=max-width:60vw;>`;
            } catch {
              return " File not found <br>";
            }
            // ! Image stuff ends
          } else if (
            // ! Show video in Markdown
            ["mp4", "webv", "heiv", "wmv", "mkv"].includes(
              noteName.split(".")[1]
            )
          ) {
            try {
              return `<video src='${`data:video/${
                noteName.split(".")[1]
              };base64,${fs
                .readFileSync(path.join(manuDir, noteName))
                .toString("base64")}`}' controls></video>`;
            } catch {
              return " File not found <br>";
            }
            // ! Video thing ends
          } else {
            noteName = noteName.replace("[[", "").replace("]]", "");
            noteName = noteName.replace("@", "");
            return "Type not supported (" + noteName + ")";
          }
        } else {
          return "";
        }
      }
    }
  );
}

function openNote(name) {
  if (
    fs.existsSync(path.join(manuDir, decodeURIComponent(name))) ||
    fs.existsSync(path.join(manuDir, decodeURIComponent(name) + ".md"))
  ) {
    name = decodeURIComponent(name);
    currentNote = name.split(".")[0];
    for (button of document.querySelectorAll("#notes_list button")) {
      if (button.innerHTML == name.split(".")[0]) {
        selectButtonHighlight(button);
      }
    }
    document.getElementById("noteName").value = name.split(".")[0];
    document.getElementById("notes_view_source").value = fs
      .readFileSync(path.join(os.homedir(), "manuscript", name))
      .toString();
    d_parser_o = new DOMParser();
    d_parser = d_parser_o.parseFromString(
      marked.marked(
        fs.readFileSync(path.join(os.homedir(), "manuscript", name)).toString()
      ),
      "text/html"
    );
    d_parser.querySelectorAll("*").forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        if (attribute.name.startsWith("on")) {
          element.removeAttribute(attribute.name);
          contained_js = true;
        }
      });
    });
    d_parser.body.innerHTML = replaceNoteLinks(d_parser.body.innerHTML);
    for (e of d_parser.querySelectorAll("code")) {
      if (localStorage.getItem("enableSyntaxHighlighting") != "false") {
        e.innerHTML = hljs.highlightAuto(
          e.innerHTML
            .replaceAll("&amp;", "&")
            .replaceAll("&lt;", "<")
            .replaceAll("&gt;", ">")
        ).value;
      }
    }
    for (e of d_parser.querySelectorAll("a")) {
      if (e.href.includes("javascript:")) {
        alert("This link tries to run JavaScript. It was blocked.");
      }
      // ! DO NOT COMBINE
      if (new URL(e).protocol == "http:" || new URL(e).protocol == "https:") {
        e.href = "javascript:openInBrowser('" + encodeURIComponent(e) + "')";
      } else {
        e.href = "javascript:openNote('" + encodeURIComponent(e) + "')";
      }
    }

    html_code_prepared = d_parser.body.innerHTML;
    document.getElementById("notes_view_rendered").innerHTML =
      html_code_prepared;
    document.getElementById("notes_view_source").hidden = true;
    document.getElementById("notes_view_rendered").hidden = false;
  } else {
    confirmModal(
      "Create note",
      "This note doesn't exist yet. Do you want to create it?",
      function () {
        fs.writeFileSync(path.join(manuDir, decodeURIComponent(name)), "");
        renderNotesList();
      }
    );
  }
}

function openSettings() {
  setTimeout(function () {
    document.getElementById("settings").hidden = false;
  }, 125);
}

function deleteNote(name) {
  name = decodeURIComponent(name);
  if (localStorage.getItem("enableDeleteConformation") != "false") {
    confirmModalWarning(
      "Delete note",
      "Do you want to delete this note?",
      function () {
        fs.unlinkSync(path.join(manuDir, name));
        renderNotesList();
      }
    );
  } else {
    fs.unlinkSync(path.join(manuDir, name));
    renderNotesList();
  }
  document.getElementById("notes_view_source").value = "";
  document.getElementById("notes_view_rendered").innerHTML = "";
  document.getElementById("noteName").value = "";
}

function saveNote() {
  currentNote = document.getElementById("noteName").value;
  if (
    document.getElementById("noteName").value != "" &&
    document.getElementById("noteName").value != null
  ) {
    fs.writeFileSync(
      path.join(
        os.homedir(),
        "manuscript",
        document.getElementById("noteName").value + ".md"
      ),
      document.getElementById("notes_view_source").value
    );
  }
  renderNotesList();
  for (button of document.querySelectorAll("#notes_list button")) {
    if (button.innerHTML == currentNote) {
      selectButtonHighlight(button);
    }
  }
}

const colorsHexLib = {
  red: "#FF2525",
  orange: "#E76E0C",
  yellow: "#E0AC0F",
  green: "#15C629",
  blue: "#0B94D4",
  purple: "#B940FF",
  white: "#FFFFFF",
};

function setAccentColor(e) {
  for (button of document.querySelectorAll("#settings button.color_picker")) {
    button.classList.remove("selected");
  }
  e.classList.add("selected");
  document.documentElement.style.setProperty(
    "--accent-color",
    colorsHexLib[e.classList[1]]
  );
  localStorage.setItem("accentColor", e.classList[1]);
}

window.addEventListener("load", function () {
  dataInit();
  this.window.addEventListener("click", function (event) {
    if (
      event.target == this.document.getElementById("settings") ||
      this.document.getElementById("settings").contains(event.target)
    ) {
      return;
    } else {
      this.document.getElementById("settings").hidden = true;
    }
  });
  // ! Font
  // ? Monospace
  if (this.localStorage.getItem("fontFamilyText") != null) {
    document.querySelector("#fontNameText").value =
      this.localStorage.getItem("fontFamilyText");
    document.documentElement.style.setProperty(
      "--font-monospace",
      localStorage.getItem("fontFamilyText")
    );
    document.querySelector("#fontNameText").style.fontFamily =
      '"' + document.querySelector("#fontNameText").value + "\", 'Work Sans'";
  }
  document.querySelector("#fontNameText").onchange = function () {
    localStorage.setItem(
      "fontFamilyText",
      document.querySelector("#fontNameText").value
    );
    document.documentElement.style.setProperty(
      "--font-monospace",
      localStorage.getItem("fontFamilyText")
    );
    document.querySelector("#fontNameText").style.fontFamily =
      '"' + localStorage.getItem("fontFamilyText") + "\", 'Work Sans'";
  };
  // ? Interface
  if (this.localStorage.getItem("fontFamilyInterface") != null) {
    document.querySelector("#fontNameInterface").value =
      this.localStorage.getItem("fontFamilyInterface");
    document.documentElement.style.setProperty(
      "--font-sans",
      localStorage.getItem("fontFamilyInterface")
    );
    document.querySelector("#fontNameInterface").style.fontFamily =
      '"' +
      document.querySelector("#fontNameInterface").value +
      "\", 'Work Sans'";
  }
  document.querySelector("#fontNameInterface").onchange = function () {
    localStorage.setItem(
      "fontFamilyInterface",
      document.querySelector("#fontNameInterface").value
    );
    document.documentElement.style.setProperty(
      "--font-sans",
      localStorage.getItem("fontFamilyInterface")
    );
    document.querySelector("#fontNameInterface").style.fontFamily =
      '"' + localStorage.getItem("fontFamilyInterface") + "\", 'Work Sans'";
  };
  // ! Accent Color
  if (localStorage.getItem("accentColor") != null) {
    for (button of document.querySelectorAll("#settings button.color_picker")) {
      if (button.classList[1] == localStorage.getItem("accentColor")) {
        button.classList.add("selected");
        document.documentElement.style.setProperty(
          "--accent-color",
          colorsHexLib[button.classList[1]]
        );
      } else {
        button.classList.remove("selected");
      }
    }
  }

  if (fs.existsSync(path.join(os.homedir(), "manuscript"))) {
    renderNotesList();
  } else {
    fs.mkdirSync(path.join(os.homedir(), "manuscript"));
    renderNotesList();
  }
  this.document
    .getElementById("notes_view_source")
    .addEventListener("blur", function () {
      saveNote();
      if (currentNote != "" && currentNote != null) {
        openNote(currentNote + ".md");
      }
    });
  this.document
    .getElementById("notes_view_source")
    .addEventListener("keyup", function (e) {
      if (e.key == "Escape") {
        saveNote();
        if (currentNote != "" && currentNote != null) {
          openNote(currentNote + ".md");
        }
      }
    });
  this.document
    .getElementById("notes_view_rendered")
    .addEventListener("click", function (e) {
      if (
        e.target.tagName === "BUTTON" ||
        e.target.tagName === "button" ||
        e.target.tagName === "A" ||
        e.target.tagName === "a"
      ) {
        try {
          if (new URL(e.target.href).protocol in ["https:", "http:"]) {
            openNote(encodeURIComponent(e.target.innerHTML + ".md"));
          } else {
            window.body.style.cursor = "wait";
            setTimeout(function () {
              window.body.style.cursor = "default";
            }, 2000);
          }
        } catch (e) {
          console.error("Unimportant fail " + e);
        }
        return;
      }
      document.getElementById("notes_view_source").hidden = false;
      document.getElementById("notes_view_rendered").hidden = true;
      document.getElementById("notes_view_source").focus();
    });
  this.document
    .getElementById("notes_view_source")
    .addEventListener("keydown", saveNote);
  this.document
    .getElementById("noteName")
    .addEventListener("change", function () {
      saveNote();
      if (currentNote != "" && currentNote != null) {
        openNote(currentNote + ".md");
      }
    });
  document
    .getElementById("notes_view_source")
    .addEventListener("keydown", function (e) {
      if (e.key == "Tab") {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;
        this.value =
          this.value.substring(0, start) + "\t" + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 1;
      }
    });

  // ! Settings check boxes

  // * Syntax HL
  this.document.getElementById("enableSyntaxHighlighting").onchange =
    function () {
      localStorage.setItem(
        "enableSyntaxHighlighting",
        document.getElementById("enableSyntaxHighlighting").checked
      );
    };
  this.document.getElementById("enableSyntaxHighlighting").checked =
    localStorage.getItem("enableSyntaxHighlighting") != "false";

  // * LINKED NOTES !! NOT EMBEDDED FILES !!
  this.document.getElementById("enableLinkedNotes").onchange = function () {
    localStorage.setItem(
      "enableLinkedNotes",
      document.getElementById("enableLinkedNotes").checked
    );
  };
  this.document.getElementById("enableLinkedNotes").checked =
    localStorage.getItem("enableLinkedNotes") != "false";

  // * Embedded files
  this.document.getElementById("enableEmbeddedFiles").onchange = function () {
    localStorage.setItem(
      "enableEmbeddedFiles",
      document.getElementById("enableEmbeddedFiles").checked
    );
  };
  this.document.getElementById("enableEmbeddedFiles").checked =
    localStorage.getItem("enableEmbeddedFiles") != "false";

  // * Confirm Delition
  this.document.getElementById("enableDeleteConformation").onchange =
    function () {
      localStorage.setItem(
        "enableDeleteConformation",
        document.getElementById("enableDeleteConformation").checked
      );
    };
  this.document.getElementById("enableDeleteConformation").checked =
    localStorage.getItem("enableDeleteConformation") != "false";
});
