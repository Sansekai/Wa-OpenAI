process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const {
	makeWASocket,
	fetchLatestBaileysVersion,
	DisconnectReason,
	useMultiFileAuthState,
	makeCacheableSignalKeyStore,
	makeInMemoryStore,
	Browsers,
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const Pino = require("pino");
const chalk = require("chalk");
const moment = require("moment-timezone");
moment.tz.setDefault("Asia/Jakarta").locale("id");
const { Messages } = require("./lib/messages.js");
const donet = "https://saweria.co/sansekai";

// Baileys
const Logger = {
	level: "error",
};
const logger = Pino({
	...Logger,
});
const Store = (log = logger) => {
	const store = makeInMemoryStore({ logger: log });
	return store;
};
const store = Store(logger);
store?.readFromFile("./session.json");

setInterval(() => {
	store?.writeToFile("./session.json");
}, 10_000);

const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

async function connectToWhatsApp(use_pairing_code = false) {
	const { state, saveCreds } = await useMultiFileAuthState("yusril");

	const { version } = await fetchLatestBaileysVersion();
	const sock = makeWASocket({
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		version: version,
		logger: logger,
		printQRInTerminal: true,
    markOnlineOnConnect: true,
		generateHighQualityLinkPreview: true,
		browser: Browsers.macOS('Chrome'),
		
	});

	store?.bind(sock.ev);

	sock.ev.process(async (ev) => {
		if (ev["creds.update"]) {
			await saveCreds();
		}
		if (ev["connection.update"]) {
			console.log("Connection update", ev["connection.update"]);
			const update = ev["connection.update"];
			const { connection, lastDisconnect } = update;
			if (connection === "close") {
				const shouldReconnect =
					lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
				console.log(
					"connection closed due to ",
					lastDisconnect.error,
					", reconnecting ",
					shouldReconnect
				);
				// reconnect if not logged out
				if (shouldReconnect) {
					connectToWhatsApp();
				}
			} else if (connection === "open") {
        const botNumber = sock.user.id
				console.log("opened connection");
        console.log(color("Bot success conneted to server", "green"));
        console.log(color("Donate for creator https://saweria.co/sansekai", "yellow"));
        console.log(color("Type /menu to see menu"));
        sock.sendMessage(botNumber, { text: `Bot started!\n\njangan lupa support ya bang :)\n${donet}` });
			}
		}
    // sock.ev.on("messages.upsert", async (message) => { 
    //   console.log(message);
    // })
		
		const upsert = ev["messages.upsert"];
if (upsert) {
	if (upsert.type !== "notify") {
        return;
    }
    const message = Messages(upsert, sock);
    if (!message || message.sender === "status@broadcast") {
        return;
    }
    // msgHandler(upsert, sock, store, message);
	require("./sansekai.js")(upsert, sock, store, message);
 }

    
    //   const message = Messages(upsert, sock);
    //   console.log(message);
		// }
	});
	/**
	 *
	 * @param {import("@whiskeysockets/baileys").WAMessageKey} key
	 * @returns {import("@whiskeysockets/baileys").WAMessageContent | undefined}
	 */
	async function getMessage(key) {
		if (store) {
			const msg = await store.loadMessage(key.remoteJid, key.id);
			return msg?.message || undefined;
		}
		// only if store is present
		return proto.Message.fromObject({});
	}
	return sock;
}
connectToWhatsApp()
// Baileys

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});