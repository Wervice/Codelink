const electron = require("electron")
const { app, BrowserWindow } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { webviewTag:true }
  })
  win.loadFile('browser/browser.html')
}

app.whenReady().then(() => {
  createWindow()
})