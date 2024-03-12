# Zentrox

Zentrox helps you manage and set up a NAS and collaboration applications on your server or computer.
<div align=center>
<img src="https://raw.githubusercontent.com/Wervice/Codelink/main/zentrox/static/Zentrox.png" width="200">
</div>

## Requirements

- NodeJS >=v20
- OpenSSL
- NPM
- Git

## Installation

You can use this script to install Zentrox on your system. It will auto generate a .key and .crt file for HTTPS support.

If you already have a .key and .crt, please copy it to the folder and call it selfsigned.crt / selfsigned.key.

```bash
git clone https://github.com/Wervice/Codelink/ # Clones Codelink repo to current folder
mv Codelink/zentrox ~/zentrox_server # Moves zentrox to ~/zentrox_server. This folder includes the zentrox code
cd ~/zentrox_server # Got to zentrox_server folder
npm install express body-parser cookie-parser express-session node-os-utils ejs # Install node_packages
openssl genrsa -out selfsigned.key 2048
openssl req -new -key selfsigned.key -out csr.pem
openssl x509 -req -days 365 -in csr.pem -signkey selfsigned.key -out selfsigned.crt
clear
node index.js # Run zentrox main JS
```

> [!NOTE]
> You can remove the Codelink folder after installing Zentrox. It doesn't contain anything important anymore

Zentrox will now be hosted on `localhost:3000`. You can continue with a GUI setup from there.

## Usage
After rebooting the server or closing Zentrox, please restart it using:
```bash
cd ~/zentrox_server # Go to Zentrox code folder
node index.js # Start zentrox
```
You can now login to Zentrox using your admin credentials.

## Features
Zentrox offers many features for different purposes:
### Administration & Management
- File sharing protocols
- Package manager
- Storage & Files overview
- System resource measurement
- Web shell

## Removing
You can remove Zentrox by deleting the zentrox_server folder. If you also want to erase all user & admin data, you can remove zentrox_data.
> [!IMPORTANT]
> You can not restore your data after removing it once.

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

## Legal

Codelink is released under [Apache 2.0](https://github.com/Wervice/Codelink?tab=Apache-2.0-1-ov-file#readme)

Codelink uses/requires the following resources:   
Icons8 Icons [icons8.com](https://icons8.com)   
VSFTPD as an FTP server [https://security.appspot.com/vsftpd.html](https://security.appspot.com/vsftpd.html) (Has not been modified)