# Wa-OpenAI

***WhatsApp OpenAI Create with NodeJS Using Library [Baileys](https://github.com/adiwajshing/Baileys)***

## BACA DULU
Terdapat 2 fitur yaitu ```ChatGPT(text)``` dan ```DALL-E(Text To Image)``` tipe yaitu <br>Untuk commandnya menggunakan ```/ai``` dan ```/img```

## Get & Change OpenAI ApiKey
- Silakan buat apikeynya terlebih dahulu [Disini](https://beta.openai.com/account/api-keys)
- Ganti ApiKey OpenAI pada file [key.json](https://github.com/Sansekai/Wa-OpenAI/blob/3bd55740764bcb30084277f6be82d15b6ee25b99/key.json#L2)

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

Silakan install manual ```node_modules``` terlebih dahulu, karena di termux saat install otomatis melalui ```npm install``` terjadi error.
<br>Link ```node_modules```: [Klik Disini](https://drive.google.com/file/d/1gKGjseRirX6mQ5LOFULpmnDs7q3Svm8y/view?usp=sharing)
```bash
$ pkg install git nodejs -y
$ git clone https://github.com/Sansekai/Wa-OpenAI
$ cd Wa-OpenAI
```
Sesudah menginstall file node_modules, silahkan extract file ```node_modules.zip``` dan taruh di folder Wa-OpenAI.

**Run**
```bash
$ node index.js
```

**Run with pm2**

PM2 dapat menjalankan program atau bot kita di background sehingga kita bisa menjalankan aktivitas lain tanpa harus khawatir program tersebut akan berhenti. PM2 juga dapat mengatur agar program atau bot kita akan dijalankan kembali secara otomatis saat sistem di restart atau dihidupkan kembali.
```bash
# Menginstall pm2 dan menjalankan bot.
$ npm install pm2@latest -g
$ pm2 start index.js

# Melihat list bot yang sedang berjalan.
$ pm2 list

# Agar membuat bot dijalankan kembali secara otomatis saat sistem direstart atau dihidupkan kembali.
$ pm2 startup
$ pm2 save
```


## Donate
<a href="https://saweria.co/Sansekai" target="_blank"><img src="https://user-images.githubusercontent.com/26188697/180601310-e82c63e4-412b-4c36-b7b5-7ba713c80380.png" alt="Donate For Yusril" height="41" width="174"></a>

## License
[MIT License](https://github.com/Sansekai/Wa-OpenAI/blob/main/LICENSE)

Copyright (c) 2022 M Yusril

