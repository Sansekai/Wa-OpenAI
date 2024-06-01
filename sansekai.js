const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const axios = require("axios");
const OpenAI = require("openai");
let setting = require("./key.json");
const openai = new OpenAI({ apiKey: setting.keyopenai });
const xlsx = require("xlsx");

const sendToWebhook = (data) => {
  const webhookUrl = `https://trigger.macrodroid.com/8172513a-8642-4445-80f9-edfa8b9a5482/worod?hgem=${data.hgem}&kmeh=${data.kmeh}&nu=${data.nu}&se3r=${data.se3r}`;
  axios.get(webhookUrl)
    .then(response => {
      console.log("Webhook response:", response.data);
    })
    .catch(error => {
      console.error("Webhook error:", error);
    });
};

let orders = {};
let usersState = {};

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

    if (budy === "/1") {
      reply("*لحجز طلبية العيد*، متوفر صحونة بعدة أحجام:\n" +
            "1. *حجم M بسعر 100₪ 🍇*\n" +
            "2. *حجم L بسعر 130₪ 🍉*\n" +
            "3. *حجم XL بسعر 150₪ 🍍*\n" +
            "4. *حجم XXL بسعر 200₪ 🍒*\n" +
            "5. *صحن أناناس بسعر 60₪ 🍓*\n" +
            "*لتحديد الطلبية الرجاء إرسال رقم الصحن المحدد.*");
      orders[sender] = { step: 2, items: [] };
      usersState[sender] = 'ordering';
    } else if (orders[sender] && usersState[sender] === 'ordering') {
      switch (orders[sender].step) {
        case 2:
          const dishNumber = parseInt(budy);
          if (![1, 2, 3, 4, 5].includes(dishNumber)) {
            reply("*الرجاء إدخال رقم صحن صحيح (1-5).*");
          } else {
            orders[sender].currentDish = dishNumber;
            reply("*الرجاء تحديد الكمية المطلوبة.*");
            orders[sender].step = 3;
          }
          break;
        case 3:
          const quantity = parseInt(budy);
          if (isNaN(quantity) || quantity <= 0) {
            reply("*الرجاء إدخال كمية صحيحة.*");
          } else {
            const sizes = ["M", "L", "XL", "XXL", "صحن أناناس"];
            const prices = [100, 130, 150, 200, 60];
            const size = sizes[orders[sender].currentDish - 1];
            const price = prices[orders[sender].currentDish - 1];

            orders[sender].items.push({
              size: size,
              quantity: quantity,
              price: price,
              total: price * quantity
            });

            reply("*لتأكيد الطلب، الرجاء إرسال '1'.*\n" +
                  "*للإلغاء، الرجاء إرسال '2'.*\n" +
                  "*لإضافة طلبية أخرى، الرجاء إرسال '3'.*");
            orders[sender].step = 4;
          }
          break;
        case 4:
          if (budy === "1") {
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
                ['رقم الهاتف', 'حجم الصحن', 'الكمية', 'السعر الإجمالي']
              ]);
              xlsx.utils.book_append_sheet(workbook, worksheet, 'Orders');
            }

            orders[sender].items.forEach(item => {
              xlsx.utils.sheet_add_aoa(worksheet, [[sender, item.size, item.quantity, item.total]], { origin: -1 });
            });

            xlsx.writeFile(workbook, filePath);

            reply(`*شكراً لطلبك! تم حجز طلبيتك بنجاح.*\n\n` +
                  orders[sender].items.map(item => `*حجم الصحن*: ${item.size}\n*الكمية*: ${item.quantity}\n*السعر الإجمالي*: ${item.total}₪`).join('\n\n') +
                  `\n\n*تم تسجيل الطلبية*\n*الإستلام قبل العيد بيوم*\n*الرجاء عدم الإحراج لا يوجد إستلام يوم العيد 🤍*\n*دمتم بخير 🌸*`);

            // Prepare data for webhook
            const data = {
              nu: sender.replace("@s.whatsapp.net", ""), // تحويل الرقم إلى التنسيق المطلوب
              hgem: orders[sender].items[0].size,
              kmeh: orders[sender].items[0].quantity,
              se3r: orders[sender].items[0].total,
            };

            sendToWebhook(data);

            delete orders[sender];
            delete usersState[sender];
          } else if (budy === "2") {
            reply("*تم إلغاء الطلب.*");
            delete orders[sender];
            delete usersState[sender];
          } else if (budy === "3") {
            reply("*لحجز طلبية العيد*، متوفر صحونة بعدة أحجام:\n" +
                  "1. *حجم M بسعر 100₪ 🍇*\n" +
                  "2. *حجم L بسعر 130₪ 🍉*\n" +
                  "3. *حجم XL بسعر 150₪ 🍍*\n" +
                  "4. *حجم XXL بسعر 200₪ 🍒*\n" +
                  "5. *صحن أناناس بسعر 60₪ 🍓*\n" +
                  "*لتحديد الطلبية الرجاء إرسال رقم الصحن المحدد.*");
            orders[sender].step = 2;
          } else {
            reply("*الرجاء إرسال '1' لتأكيد الطلب أو '2' لإلغاء الطلب أو '3' لإضافة طلبية أخرى.*");
          }
          break;
      }
    }
  } catch (err) {
    console.error(err); // تحسين معالجة الأخطاء
  }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
