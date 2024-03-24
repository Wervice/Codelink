/*
This library lets you manage file using sudo permissions.
! This library is in no way secure, you can easily escape the command
! Only use this on the admin front end with little to no user interaction
*/

function sudoWriteFileSync(path, content, sudo) {
    chpr.execSync(`echo ${sudo
    .replace('"', '\\"')
    .replace("'", "\\'")
    .replace("`", "\\`")} | sudo -S bash -c "echo '${content}' > '${path}'"`)
}

function sudoAppendFileSync(path, content, sudo) {
    chpr.execSync(`echo ${sudo
    .replace('"', '\\"')
    .replace("'", "\\'")
    .replace("`", "\\`")} | sudo -S bash -c "echo '${content}' >> '${path}'"`)
}