# Wa-OpenAI

***WhatsApp OpenAI Create with NodeJS Using Library [Baileys](https://github.com/adiwajshing/Baileys)***
## BACA DULU
Terdapat 2 tipe yaitu menggunakan command dan tanpa menggunakan command (auto chat).
- Jika ingin menggunakan command silahkan ganti kata ```true``` menjadi ```false``` di file [key.json](https://github.com/Sansekai/Wa-OpenAI/blob/586dbf2e7bb182b3a649d560e50ef44911fb4db8/key.json#L3)<br>Untuk commandnya menggunakan ```.ai```
- Jika tidak ingin menggunakan command (auto chat) silahkan ganti kata ```false``` menjadi ```true``` di file [key.json](https://github.com/Sansekai/Wa-OpenAI/blob/586dbf2e7bb182b3a649d560e50ef44911fb4db8/key.json#L3)

## Get & Change OpenAI ApiKey
- Jika limit ApiKey OpenAI sudah habis silahkan buat apikey yang barunya [Disini](https://beta.openai.com/account/api-keys)
- Ganti ApiKey OpenAI pada file [key.json](https://github.com/Sansekai/Wa-OpenAI/blob/586dbf2e7bb182b3a649d560e50ef44911fb4db8/key.json#L2)

## Install
**Install on RDP/Windows ✅**

Install [NodeJS](https://nodejs.org/en/download/)
 dan [Git Bash](https://git-scm.com/downloads) terlebih dahulu
```bash
$ git clone https://github.com/Sansekai/Wa-OpenAI
$ cd Wa-OpenAI
$ npm install
$ node index.js
```
**Install on Termux ✅**

Silahkan install manual ```node_modules``` terlebih dahulu, karena di termux saat install otomatis melalui ```npm install``` terjadi error.
<br>Link ```node_modules```: [Klik Disini](https://drive.google.com/file/d/1gKGjseRirX6mQ5LOFULpmnDs7q3Svm8y/view?usp=sharing)
```bash
$ pkg install git nodejs -y
$ git clone https://github.com/Sansekai/Wa-OpenAI
$ cd Wa-OpenAI
```
Sesusah menginstall file node_modules, silahkan extract file ```node_modules.zip``` dan taruh di folder Wa-OpenAI.

**Run**
```bash
$ node index.js
```

## Donate
<a href="https://saweria.co/Sansekai" target="_blank"><img src="https://user-images.githubusercontent.com/26188697/180601310-e82c63e4-412b-4c36-b7b5-7ba713c80380.png" alt="Donate For Yusril" height="41" width="174"></a>

## License
[MIT License](https://github.com/Sansekai/Wa-OpenAI/blob/main/LICENSE)

Copyright (c) 2022 M Yusril

