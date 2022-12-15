require('./config')
const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require('@adiwajshing/baileys')
const fs = require('fs')
const util = require('util')
const chalk = require('chalk')
const path = require('path')
const moment = require('moment-timezone')
const { sleep, getGroupAdmins, smsg } = require('./lib/myfunc')
const fetch = require('node-fetch')
const { Configuration, OpenAIApi } = require("openai")

const createReadFileSync = (path) => {
    if (fs.existsSync(path)) {
        return fs.readFileSync(path)
    }
    else {
        fs.writeFileSync(path, '[]')
        return fs.readFileSync(path)
    }
}

function getRandomText(id) {
    var raNdText = id[Math.floor(Math.random() * id.length)];
    return raNdText;
}

module.exports = sansekai = async (client, m, chatUpdate, store) => {
    try {
        var body = (m.mtype === 'conversation') ? m.message.conversation : (m.mtype == 'imageMessage') ? m.message.imageMessage.caption : (m.mtype == 'videoMessage') ? m.message.videoMessage.caption : (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (m.mtype === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : ''
        var budy = (typeof m.text == 'string' ? m.text : '')
        // var prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi) : "/"
        var prefix2 = prefa ? /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi)[0] : "" : prefa ?? global.prefix
        var prefix = /^[\\/!#.]/gi.test(body) ? body.match(/^[\\/!#.]/gi) : "/"
        const isCmd = body.startsWith(prefix2)
        const isCmd2 = body.startsWith(prefix)
        const command = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase()
        const args = body.trim().split(/ +/).slice(1)
        const pushname = m.pushName || "No Name"
        const botNumber = await client.decodeJid(client.user.id)
        const isCreator = [botNumber, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const itsMe = m.sender == botNumber ? true : false
        let text = q = args.join(" ")
        const arg = budy.trim().substring(budy.indexOf(' ') + 1 )
        const arg1 = arg.trim().substring(arg.indexOf(' ') + 1 )
        const fatkuns = (m.quoted || m)
        const quoted = (fatkuns.mtype == 'buttonsMessage') ? fatkuns[Object.keys(fatkuns)[1]] : (fatkuns.mtype == 'templateMessage') ? fatkuns.hydratedTemplate[Object.keys(fatkuns.hydratedTemplate)[1]] : (fatkuns.mtype == 'product') ? fatkuns[Object.keys(fatkuns)[0]] : m.quoted ? m.quoted : m
        const mime = (quoted.msg || quoted).mimetype || ''
        const qmsg = (quoted.msg || quoted)
        const isMedia = /image|video|sticker|audio/.test(mime)

        const from = m.chat
        const reply = m.reply
        const sender = m.sender
        const mek = chatUpdate.messages[0]
	
        // Group
        const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat).catch(e => {}) : ''
        const groupName = m.isGroup ? groupMetadata.subject : ''
        const participants = m.isGroup ? await groupMetadata.participants : ''
        const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : ''
    	const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
    	const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
    	// const isPremium = isCreator || global.premium.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender) || false

        if (budy) {
            try {
            // Jika apikey limit silahkan ganti apikey openainya di bawah ini 
            const keyopenai = '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'
            const configuration = new Configuration({
              apiKey: keyopenai, 
            });
            const openai = new OpenAIApi(configuration);
            
            const response = await openai.createCompletion({
              model: "text-davinci-003",
              prompt: budy,
              temperature: 0.3,
              max_tokens: 2000,
              top_p: 1.0,
              frequency_penalty: 0.0,
              presence_penalty: 0.0,
            });
            m.reply(`${response.data.choices[0].text}\n\n`)
            } catch(err) {
                console.log(err)
                m.reply('Maaf, sepertinya ada yang error')
            }
        }

        // Push Message To Console
        let argsLog = (budy.length > 30) ? `${q.substring(0, 30)}...` : budy

        // Push Message To Console && Auto Read
        if (argsLog && !m.isGroup) {
            // client.sendReadReceipt(m.chat, m.sender, [m.key.id])
            console.log(chalk.black(chalk.bgWhite('[ LOGS ]')), color(argsLog, 'turquoise'), chalk.magenta('From'), chalk.green(pushname), chalk.yellow(`[ ${m.sender.replace('@s.whatsapp.net', '')} ]`))
        } else if (argsLog && m.isGroup) {
            // client.sendReadReceipt(m.chat, m.sender, [m.key.id])
            console.log(chalk.black(chalk.bgWhite('[ LOGS ]')), color(argsLog, 'turquoise'), chalk.magenta('From'), chalk.green(pushname), chalk.yellow(`[ ${m.sender.replace('@s.whatsapp.net', '')} ]`), chalk.blueBright('IN'), chalk.green(groupName))
        }
        
    } catch (err) {
        m.reply(util.format(err))
    }
}


let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})
