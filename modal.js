cssCode = fs.readFileSync("modal.css", {
    "encoding": "utf-8"
}) // * Read the CSS code

code = `
        <div id='modalMain' hidden>
            <div id='modalTitle'></div>
            <div id='modalMessage'></div>
            <br>
            <button id='buttonConfirm' class='cta'>Ok</button> <button id='buttonConfirm' class='grey' onclick=killModalPopup()>Cancel</button>
        </div>
` // * The HTML Code for a popup 

popupDataIsThere = false

function dataInit() {
    if (!popupDataIsThere) {
        this.document.head.innerHTML += "<style>"+cssCode+"</style>"
        this.document.body.innerHTML += code
        popupDataIsThere = true
    }
}

function killModalPopup() {
    document.getElementById('modalMain').classList.remove('red')
    setTimeout(function () {document.getElementById('modalMain').hidden = true}, 510)
    flyOut('modalMain', 500)
}

function errorModal(title, message, command) {
    document.getElementById('modalMain').hidden = false
    document.getElementById('modalMain').classList.add('red')
    document.getElementById('modalTitle').innerHTML = title
    document.getElementById('modalMessage').innerHTML = message
    document.getElementById('buttonConfirm').onclick = function () {
        command()
        killModalPopup()
    }
}

function confirmModal(title, message, command) {
    document.getElementById('modalMain').hidden = false
    document.getElementById('modalTitle').innerHTML = title
    document.getElementById('modalMessage').innerHTML = message
    document.getElementById('buttonConfirm').onclick = function () {
        command()
        killModalPopup()
    }
}