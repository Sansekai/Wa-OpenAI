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

const calculateCost = (type, value) => {
  switch (type) {
    case 'עבודת לילה':
      return value * 500;
    default:
      return 0;
  }
};

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

    if (budy === "/רישום" || budy === "/יומן") {
      reply("🔹 *רישום עבודה*\n" +
            "1️⃣ יום עבודה/חופש\n" +
            "2️⃣ עבודת לילה\n" +
            "3️⃣ תדלוק סולר\n" +
            "4️⃣ קבלת תשלום\n" +
            "נא לבחור אופציה ולשלוח את מספרה.");
      orders[sender] = { step: 1, items: [] };
      usersState[sender] = 'ordering';
    } else if (budy === "/רישום שלי") {
      reply("🔸 *הרישום שלי*\n" +
            "1️⃣ ס\"כה ימי עבודה\n" +
            "2️⃣ ס\"כה עבודת לילה\n" +
            "3️⃣ סכ\"ה ימי עבודות לילה\n" +
            "4️⃣ תשלומים עבור עבודות לילה\n" +
            "5️⃣ מפריעות שקובלו\n" +
            "6️⃣ ס\"כה תדלוק סולר\n" +
            "7️⃣ לילות שלא שולמו\n" +
            "נא לבחור אופציה ולשלוח את מספרה.");
      usersState[sender] = 'viewing';
    } else if (orders[sender] && usersState[sender] === 'ordering') {
      switch (orders[sender].step) {
        case 1:
          switch (budy) {
            case "1":
              reply("1️⃣ יום עבודה\n2️⃣ חופש\nנא לבחור אופציה ולשלוח את מספרה.");
              orders[sender].step = 1.1;
              break;
            case "2":
              const today = new Date();
              const dateStr = today.toISOString().split('T')[0];
              if (!canRegisterNightWork(sender, dateStr)) {
                reply("❌ כבר נרשמה עבודת לילה עבור היום.");
                delete orders[sender];
                delete usersState[sender];
                break;
              }
              reply("🌙 עבודת לילה נרשמה בהצלחה.");
              addToTotal(sender, 'עבודת לילה', 1, dateStr);
              reply(`עלות: ${calculateCost('עבודת לילה', 1)} ש"ח`);
              delete orders[sender];
              delete usersState[sender];
              break;
            case "3":
              reply("⛽ הכנס כמות ליטרים.");
              orders[sender].step = 3;
              break;
            case "4":
              reply("💵 קבלת תשלום\n1️⃣ מפריעה\n2️⃣ עבור עבודות לילה\nנא לבחור אופציה ולשלוח את מספרה.");
              orders[sender].step = 4;
              break;
            default:
              reply("❌ נא לבחור אופציה תקפה.");
              break;
          }
          break;
        case 1.1:
          if (budy === "1") {
            const today = new Date();
            if (today.getDay() === 6) {
              reply("❌ לא ניתן לרשום יום עבודה בשבת.");
              delete orders[sender];
              delete usersState[sender];
              break;
            }
            const dateStr = today.toISOString().split('T')[0];
            if (!canRegisterWorkDay(sender, dateStr)) {
              reply("❌ כבר נרשם יום עבודה עבור היום.");
              delete orders[sender];
              delete usersState[sender];
              break;
            }
            reply("✅ יום עבודה נרשם בהצלחה המשך יום נעים.");
            addToTotal(sender, 'יום עבודה', 1, dateStr);
          } else if (budy === "2") {
            reply("✅ נרשם בהצלחה חופשה נעימה.");
            addToTotal(sender, 'חופש', 1);
          } else {
            reply("❌ נא לבחור אופציה תקפה.");
          }
          delete orders[sender];
          delete usersState[sender];
          break;
        case 3:
          const quantity = parseFloat(budy);
          if (isNaN(quantity) || quantity <= 0) {
            reply("❌ נא להכניס כמות ליטרים תקפה.");
          } else {
            reply("✅ נרשמם בהצלחה!");
            addToTotal(sender, 'תדלוק סולר', quantity);
            delete orders[sender];
            delete usersState[sender];
          }
          break;
        case 4:
          if (budy === "1") {
            reply("💵 הכנס סכום מפריעה.");
            orders[sender].step = 4.1;
          } else if (budy === "2") {
            reply("💵 הכנס סכום שקבלת עבור עבודת לילה.");
            orders[sender].step = 4.2;
          } else {
            reply("❌ נא לבחור אופציה תקפה.");
          }
          break;
        case 4.1:
        case 4.2:
          const amount = parseFloat(budy);
          if (isNaN(amount) || amount <= 0) {
            reply("❌ נא להכניס סכום תקף.");
          } else {
            reply("✅ התשלום נרשם בהצלחה.");
            const type = orders[sender].step === 4.1 ? 'מפריעה' : 'קבלת תשלום - עבור עבודות לילה';
            addToTotal(sender, type, amount);
            delete orders[sender];
            delete usersState[sender];
          }
          break;
      }
    } else if (usersState[sender] === 'viewing') {
      switch (budy) {
        case "1":
          reply(getStatistics(sender));
          break;
        default:
          reply("❌ נא לבחור אופציה תקפה.");
          break;
      }
      delete usersState[sender];
    }
  } catch (err) {
    console.error(err); // تحسين معالجة الأخطاء
  }
};

const addToTotal = (phone, type, value, date = null) => {
  const filePath = `./data/${phone}.xlsx`;

  let workbook;
  let worksheet;

  try {
    if (fs.existsSync(filePath)) {
      workbook = xlsx.readFile(filePath);
      worksheet = workbook.Sheets[workbook.SheetNames[0]];
    } else {
      workbook = xlsx.utils.book_new();
      worksheet = xlsx.utils.json_to_sheet([]);
      xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    }

    const existingData = xlsx.utils.sheet_to_json(worksheet) || [];
    const newData = { Type: type, Value: value, Date: date || new Date().toISOString() };
    existingData.push(newData);

    const newWorksheet = xlsx.utils.json_to_sheet(existingData);
    workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;

    xlsx.writeFile(workbook, filePath);
  } catch (err) {
    console.error("Error writing to Excel file:", err);
  }
};

const getTotal = (phone, type) => {
  const filePath = `./data/${phone}.xlsx`;

  if (!fs.existsSync(filePath)) {
    return 0;
  }

  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    return data
      .filter(item => item.Type === type)
      .reduce((total, item) => total + item.Value, 0);
  } catch (err) {
    console.error("Error reading Excel file:", err);
    return 0;
  }
};

const getStatistics = (phone) => {
  const workDays = getTotal(phone, 'יום עבודה');
  const nightWork = getTotal(phone, 'עבודת לילה');
  const nightWorkPayments = getTotal(phone, 'קבלת תשלום - עבור עבודות לילה');
  const vacationDays = getTotal(phone, 'חופש');
  const fuel = getTotal(phone, 'תדלוק סולר');
  const bonus = getTotal(phone, 'מפריעה');

  return `*ימי עבודה* ${workDays}\n` +
         `*עבודת לילה* ${nightWork}\n` +
         `*מפריעות* ${bonus > 0 ? bonus : "_אין_"}\n` +
         `*תשלומים עבור עבודת לילה*\n${nightWorkPayments}\n` +
         `חופשים: ${vacationDays}`;
};
