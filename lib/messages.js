const { 
    getContentType,
    jidNormalizedUser,
    downloadContentFromMessage
} = require("@whiskeysockets/baileys");
const fs = require("fs");

const mimeMap = {
    imageMessage: "image",
    videoMessage: "video",
    stickerMessage: "sticker",
    documentMessage: "document",
    audioMessage: "audio",
    pttMessage: "audio"
};

/**
 * Download the media from the message.
 * @param {import("@whiskeysockets/baileys").proto.IMessage} message - The message object.
 * @param {string} type - The media type.
 * @returns {Promise<Buffer>} - The media buffer.
 */
const downloadMedia = async (message, pathFile) => {
    const type = Object.keys(message)[0];
    try {
        const stream = await downloadContentFromMessage(message[type], mimeMap[type]);
        const buffer = [];
        for await (const chunk of stream) {
            buffer.push(chunk);
		}
        if (pathFile) {
            await fs.promises.writeFile(pathFile, Buffer.concat(buffer));
            return pathFile;
        } else {
            return Buffer.concat(buffer);
        }
    } catch (e) {
        console.log(message)
        throw e;
    }
};

/**
 * Process an incoming message and return an extended WAMessage object.
 *
 * @param {import("@whiskeysockets/baileys").BaileysEventMap["messages.upsert"]} upsert - The upsert event object.
 * @param {import("@whiskeysockets/baileys").WASocket} sock - The WASocket object.
 * @returns {import("@whiskeysockets/baileys").WAMessage & ExtendedWAMessage | null} - The extended WAMessage object or null if invalid.
 */
function Messages(upsert, sock) {
    const m = Serialize(upsert, sock);
    if (m.quoted) {
        m.quoted.react = (emoji) =>
            sock.sendMessage(m.chat, {
                react: {
                    text: String(emoji),
                    key: m.quoted.key,
                },
            });

        m.quoted.delete = () => sock.sendMessage(m.chat, { delete: m.quoted.key });
        m.quoted.download = (pathFile) => downloadMedia(m.quoted.message, pathFile);
    }

    m.react = (emoji) =>
        sock.sendMessage(m.chat, {
            react: {
                text: String(emoji),
                key: m.key,
            },
        });

    m.reply = (text) =>
        sock.sendMessage(
            m.chat,
            {
                text: text,
            },
            { quoted: m, ephemeralExpiration: m.contextInfo.expiration }
        );

    /**
     * Represents a function that updates a message with new text.
     * @typedef {function(string | null): Promise<void>} UpdateCallback
     * @param {string | null} n_text - The new text to set (or null to keep the original text).
     * @returns {Promise<void>} - A Promise that resolves when the update is complete.
     */

    /**
     *
     * @param {string} text - The initial text to send.
     * @param {undefined | (function(UpdateCallback): void)} cb - A callback function that receives an update function.
     * @returns {function(UpdateCallback): void} - The update function.
     */
    const replyUpdate = async (text, cb) => {
        const response = await sock.sendMessage(
            m.chat,
            { text: String(text) },
            { quoted: m }
        );
        if (typeof cb === "function") {
            await cb(async (n_text) =>
                sock.sendMessage(m.chat, { text: n_text || "", edit: response.key })
            ).catch(() => {});
        }
        async function update(n_text) {
            await sock.sendMessage(m.chat, { text: String(n_text), edit: response.key });
        }
        return update;
    };
    m.replyUpdate = replyUpdate;

    m.delete = () => sock.sendMessage(m.chat, { delete: m.key });
    m.download = (pathFile) => downloadMedia(m.message, pathFile);

    sock.user.id = jidNormalizedUser(sock.user.id);
    return m;
}

function Serialize(upsert, sock) {
    const { messages } = upsert;
    const m = messages[0];
    if (m.key) {
        const { id, remoteJid } = m.key;
        m.id = id;
        m.isGroup = remoteJid.endsWith("@g.us");
        m.chat = jidNormalizedUser(remoteJid);
        m.sender = jidNormalizedUser(
            m.isGroup ? m.key.participant : m.key.fromMe ? sock.user.id : remoteJid
        );
    }

    if (!m.message) {
        return m;
    }

    m.mtype = getContentType(m.message);

    if (m.mtype === "ephemeralMessage") {
        m.message = m.message[m.mtype].message;
        m.mtype = getContentType(m.message);
    }

    if (
        m.mtype === "viewOnceMessageV2" ||
        m.mtype === "documentWithCaptionMessage"
    ) {
        m.message = m.message[m.mtype].message;
    }

    m.mtype = getContentType(m.message);

    try {
        m.contextInfo = m.message[m.mtype]?.contextInfo || {};
        m.mentionedJid = m.contextInfo?.mentionedJid || [];
        m.mentionMe = m.mentionedJid[0] === sock.user.id;
        const quoted = m.contextInfo.quotedMessage || null;
        if (quoted) {
            if (quoted.ephemeralMessage) {
                const type = Object.keys(quoted.ephemeralMessage.message)[0];
                const message =
                    type === "documentMessage"
                        ? quoted.ephemeralMessage.message.documentMessage
                        : quoted.ephemeralMessage.message[type]?.message;

                m.quoted = {
                    participant: jidNormalizedUser(m.contextInfo.participant),
                    message: message || quoted.ephemeralMessage.message,
                };
            } else {
                const type = Object.keys(quoted)[0];
                const message = quoted[type]?.message;

                m.quoted = {
                    participant: jidNormalizedUser(m.contextInfo.participant),
                    message: message || quoted,
                };
            }
            m.quoted.sender = m.quoted.participant;
            m.quoted.mtype = Object.keys(m.quoted.message)[0];
            m.quoted.mentionedJid =
                m.quoted.message[m.quoted.mtype].contextInfo?.mentionedJid || [];

            m.quoted.text =
                m.quoted.message?.conversation ||
                m.quoted.message[m.quoted.mtype]?.text ||
                m.quoted.message[m.quoted.mtype]?.description ||
                m.quoted.message[m.quoted.mtype]?.caption ||
                m.quoted.message[m.quoted.mtype]?.hydratedTemplate?.hydratedContentText ||
                "";
            m.quoted.key = {
                id: m.contextInfo.stanzaId,
                fromMe: m.quoted.sender === jidNormalizedUser(sock.user.id),
                remoteJid: m.chat,
                ...(m.isGroup ? { participant: m.contextInfo.participant } : {}),
            };
            m.quoted.mtype =
                m.quoted.message[m.quoted.mtype]?.mimetype || getContentType(m.quoted.message);
        } else {
            m.quoted = null;
        }

        m.text =
            m.message[m.mtype]?.caption ||
            m.message[m.mtype]?.text ||
            m.message[m.mtype]?.conversation ||
            m.message?.conversation ||
            "";

        /**
         * Broken logic.
         * mtype = the media mimetype if is a media, else @type {keyof import("@whiskeysockets/baileys").proto.Message}
         * type = @type {keyof import("@whiskeysockets/baileys").proto.Message}
         */
        m.type = m.mtype;
        m.mtype = m.message[m.mtype]?.mimetype || getContentType(m.message);
    } catch (e) {
        console.log(e);
    }
    return m;
}

module.exports = {
    Messages,
    Serialize
};