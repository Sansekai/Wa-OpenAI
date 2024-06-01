const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const OpenAI = require("openai");
let setting = require("./key.json");
const openai = new OpenAI({ apiKey: setting.keyopenai });
const xlsx = require("xlsx");

let orders = {};

module.exports = sansekai = async (client, m, chatUpdate) => {
  try {
    var body = m.mtype === "conversation" ? m.message.conversation :
           m.mtype == "imageMessage" ? m.message.imageMessage.caption :
           m.mtype == "videoMessage" ? m.message.videoMessage.caption :
           m.mtype == "extendedTextMessage" ? m.message.extendedTextMessage.text :
           m.mtype == "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
           m.mtype == "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
           m.mtype == "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
           m.mtype === "messageContextInfo" ? m.message.buttonsResponseMessage?.selectedButtonId || 
           m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text :
           "";
    if (m.mtype === "viewOnceMessageV2") return;
    var budy = typeof m.text == "string" ? m.text : "";

    const from = m.chat;
    const reply = m.reply;
    const sender = m.sender;
    const mek = chatUpdate.messages[0];

    const color = (text, color) => {
      return !color ? chalk.green(text) : chalk.keyword(color)(text);
    };

    // Push Message To Console
    let argsLog = budy.length > 30 ? `${budy.substring(0, 30)}...` : budy;

    console.log(chalk.black(chalk.bgWhite("[ LOGS ]")), color(argsLog, "turquoise"), chalk.magenta("From"), chalk.green(m.pushName || "No Name"), chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`));

    if (!orders[sender]) {
      orders[sender] = { step: 0 };
    }

    if (orders[sender].step === 0) {
      reply("مرحباً! كيف يمكنني مساعدتك اليوم؟\n" +
            "1. استمرار محادثة\n" +
            "2. حجز طلبية");
      orders[sender].step = 1;
    } else {
      switch (orders[sender].step) {
        case 1:
          const choice = parseInt(budy);
          if (![1, 2].includes(choice)) {
            reply("الرجاء إدخال خيار صحيح (1 أو 2).");
          } else if (choice === 1) {
            reply("كيف يمكنني مساعدتك في المحادثة؟");
            delete orders[sender];
          } else {
            reply("لحجز طلبية العيد، متوفر صحونة بعدة أحجام:\n" +
                  "1. حجم M بسعر 100₪\n" +
                  "2. حجم L بسعر 130₪\n" +
                  "3. حجم XL بسعر 150₪\n" +
                  "4. حجم XXL بسعر 200₪\n" +
                  "5. صحن أناناس بسعر 60₪\n" +
                  "لتحديد الطلبية الرجاء إرسال رقم الصحن المحدد.");
            orders[sender].step = 2;
          }
          break;
        case 2:
          const dishNumber = parseInt(budy);
          if (![1, 2, 3, 4, 5].includes(dishNumber)) {
            reply("الرجاء إدخال رقم صحن صحيح (1-5).");
          } else {
            orders[sender].dish = dishNumber;
            reply("الرجاء تحديد الكمية المطلوبة.");
            orders[sender].step = 3;
          }
          break;
        case 3:
          const quantity = parseInt(budy);
          if (isNaN(quantity) || quantity <= 0) {
            reply("الرجاء إدخال كمية صحيحة.");
          } else {
            orders[sender].quantity = quantity;
            reply("لتأكيد الطلب، الرجاء إرسال '1'.\n" +
                  "للإلغاء، الرجاء إرسال '2'.");
            orders[sender].step = 4;
          }
          break;
        case 4:
          if (budy === "1") {
            const order = orders[sender];
            const sizes = ["M", "L", "XL", "XXL", "صحن أناناس"];
            const prices = [100, 130, 150, 200, 60];
            const size = sizes[order.dish - 1];
            const price = prices[order.dish - 1];
            const total = price * order.quantity;

            // Save order to Excel
            const filePath = './orders.xlsx';
            let workbook;
            let worksheet;

            if (fs.existsSync(filePath)) {
              workbook = xlsx.readFile(filePath);
              worksheet = workbook.Sheets[workbook.SheetNames[0]];
            } else {
              workbook = xlsx.utils.book_new();
              worksheet = xlsx.utils.aoa_to_sheet([
                ['Phone Number', 'Dish Size', 'Quantity', 'Total Price']
              ]);
              xlsx.utils.book_append_sheet(workbook, worksheet, 'Orders');
            }

            xlsx.utils.sheet_add_aoa(worksheet, [[sender, size, order.quantity, total]], { origin: -1 });
            xlsx.writeFile(workbook, filePath);

            reply(`شكراً لطلبك! تم حجز طلبيتك بنجاح.\n` +
                  `حجم الصحن: ${size}\n` +
                  `الكمية: ${order.quantity}\n` +
                  `السعر الإجمالي: ${total}₪`);
            delete orders[sender];
          } else if (budy === "2") {
            reply("تم إلغاء الطلب.");
            delete orders[sender];
          } else {
            reply("الرجاء إرسال '1' لتأكيد الطلب أو '2' لإلغاء الطلب.");
          }
          break;
        default:
          delete orders[sender];
          break;
      }
    }
  } catch (err) {
    m.reply(util.format(err));
  }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
