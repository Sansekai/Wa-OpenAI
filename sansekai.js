const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const axios = require("axios");
const OpenAI = require("openai");
let setting = require("./key.json");
const xlsx = require("xlsx");
let orders = {};
let usersState = {};
let userActivities = {};

const calculateCost = (type, value) => {
  switch (type) {
    case 'עבודת לילה':
      return value * 500;
    default:
      return 0;
  }
};

const canRegisterWorkDay = (sender, date) => {
  // Add your logic here to check if the work day can be registered for the given sender and date
  return true; // Placeholder return value, replace with your logic
};

const canRegisterNightWork = (sender, date) => {
  // Add your logic here to check if the night work can be registered for the given sender and date
  return true; // Placeholder return value, replace with your logic
};

const addToTotal = (phone, type, value, date = null) => {
  const filePath = `./${phone}.xlsx`;

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
    const newDate = date || new Date().toISOString().split('T')[0];

    // تحقق من وجود مدخلة بنفس التاريخ والنوع
    const existingEntry = existingData.find(entry => entry.Type === type && entry.Date.split('T')[0] === newDate);
    if (existingEntry) {
      return { success: false, message: `${type} \n${newDate} ~אתה כבר רשום~` };
    }

    const newData = { Type: type, Value: value, Date: newDate };
    existingData.push(newData);

    const newWorksheet = xlsx.utils.json_to_sheet(existingData);
    workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;

    xlsx.writeFile(workbook, filePath);
    return { success: true, message: `${type} \n${newDate} נרשמת בהצלחה` };
  } catch (err) {
    console.error("Error writing to Excel file:", err);
    return { success: false, message: "⚠️ *אירעה שגיאה*" };
  }
};

const getTotal = (phone, type) => {
  const filePath = `./${phone}.xlsx`;

  if (!fs.existsSync(filePath)) {
    console.log(`File not found for phone: ${phone}`);
    return 0;
  }

  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const total = data
      .filter(item => item.Type === type)
      .reduce((total, item) => total + item.Value, 0);

    console.log(`Total for type ${type} for phone ${phone}: ${total}`);
    return total;
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

  return `*ימי עבודה:* ${workDays}\n` +
         `*עבודת לילה:* ${nightWork}\n` +
         `*מפריעות:* ${bonus > 0 ? bonus : "_אין_"}\n` +
         `*תשלומים עבור עבודת לילה:* ${nightWorkPayments}\n` +
         `*חופשים:* ${vacationDays}\n` +
         `*תדלוק סולר:* ${fuel}`;
};

const registerActivity = (sender, type, date) => {
  if (!userActivities[sender]) {
    userActivities[sender] = [];
  }
  userActivities[sender].push({ type, date });
};

const formatActivities = (activities) => {
  let formatted = "";
  activities.forEach((activity, index) => {
    formatted += `${index + 1}. ${activity.type}: ${activity.date}\n`;
  });
  return formatted;
};

const getActivities = (sender) => {
  const activities = userActivities[sender] || [];
  return formatActivities(activities);
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

    if (budy === "//!" || budy === "*&") {
      reply("🔹 *רישום עבודה*\n" +
            "1️⃣ יום עבודה/חופש\n" +
            "2️⃣ עבודת לילה\n" +
            "3️⃣ תדלוק סולר\n" +
            "4️⃣ קבלת תשלום\n" +
            "נא לבחור אופציה ולשלוח את מספרה.");
      orders[sender] = { step: 1, items: [] };
      usersState[sender] = 'ordering';
    } else if (budy === "!@!") {
      reply("🔸 *הרישום שלי*\n" +
            "1️⃣ ס\"כה ימי עבודה\n" +
            "2️⃣ ס\"כה עבודת לילה\n" +
            "3️⃣ תשלומים עבור עבודות לילה\n" +
            "4️⃣ מפריעות שקובלו\n" +
           " 5️⃣ ס\"כה תדלוק סולר\n" +
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
              const nightWorkResult = addToTotal(sender, 'עבודת לילה', 1, dateStr);
              if (!nightWorkResult.success) {
                reply(`❌ ${nightWorkResult.message}`);
                delete orders[sender];
                delete usersState[sender];
                break;
              }
              reply(`🌙 ${nightWorkResult.message}`);
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
          }
          break;
        case 1.1:
          const today = new Date();
          const dateStr = today.toISOString().split('T')[0];
          if (budy === "1") {
            const workDayResult = addToTotal(sender, 'יום עבודה', 1, dateStr);
            if (!workDayResult.success) {
              reply(`❌ ${workDayResult.message}`);
              delete orders[sender];
              delete usersState[sender];
              break;
            }
            reply(`🗓️ ${workDayResult.message}`);
            reply(`עלות: ${calculateCost('יום עבודה', 1)} ש"ח`);
          } else if (budy === "2") {
            const vacationResult = addToTotal(sender, 'חופש', 1, dateStr);
            if (!vacationResult.success) {
              reply(`❌ ${vacationResult.message}`);
              delete orders[sender];
              delete usersState[sender];
              break;
            }
            reply(`🛌 ${vacationResult.message}`);
            reply(`עלות: ${calculateCost('חופש', 1)} ש"ח`);
          }
          delete orders[sender];
          delete usersState[sender];
          break;
        case 3:
          const fuelLiters = parseFloat(budy);
          if (isNaN(fuelLiters)) {
            reply("⛽ כמות ליטרים לא תקינה. נא להכניס מספר תקין.");
            break;
          }
          const fuelResult = addToTotal(sender, 'תדלוק סולר', fuelLiters);
          reply(`⛽ ${fuelResult.message}`);
          reply(`עלות: ${calculateCost('תדלוק סולר', fuelLiters)} ש"ח`);
          delete orders[sender];
          delete usersState[sender];
          break;
        case 4:
          switch (budy) {
            case "1":
              reply("💵 הכנס סכום קבלת מפריעה.");
              orders[sender].step = 4.1;
              break;
            case "2":
              reply("💵 הכנס סכום קבלת תשלום עבור עבודות לילה.");
              orders[sender].step = 4.2;
              break;
          }
          break;
        case 4.1:
          const bonusAmount = parseFloat(budy);
          if (isNaN(bonusAmount)) {
            reply("💵 סכום לא תקין. נא להכניס מספר תקין.");
            break;
          }
          const bonusResult = addToTotal(sender, 'מפריעה', bonusAmount);
          reply(`💵 ${bonusResult.message}`);
          delete orders[sender];
          delete usersState[sender];
          break;
        case 4.2:
          const nightWorkPaymentAmount = parseFloat(budy);
          if (isNaN(nightWorkPaymentAmount)) {
            reply("💵 סכום לא תקין. נא להכניס מספר תקין.");
            break;
          }
          const nightWorkPaymentResult = addToTotal(sender, 'קבלת תשלום - עבור עבודות לילה', nightWorkPaymentAmount);
          reply(`💵 ${nightWorkPaymentResult.message}`);
          delete orders[sender];
          delete usersState[sender];
          break;
      }
    } else if (usersState[sender] === 'viewing') {
      switch (budy) {
        case "1":
          reply(`סה"כ ימי עבודה: ${getTotal(sender, 'יום עבודה')}`);
          break;
        case "2":
          reply(`סה"כ עבודות לילה: ${getTotal(sender, 'עבודת לילה')}`);
          break;
        case "3":
          reply(`סה"כ תשלומים עבור עבודות לילה: ${getTotal(sender, 'קבלת תשלום - עבור עבודות לילה')}`);
          break;
        case "4":
          reply(`סה"כ מפריעות שקובלו: ${getTotal(sender, 'מפריעה')}`);
          break;
        case "5":
          reply(`סה"כ תדלוק סולר: ${getTotal(sender, 'תדלוק סולר')}`);
          break;
      }
      delete usersState[sender];
    }
  } catch (err) {
    console.error(err);
    reply(`⚠️ אירעה שגיאה: ${err.message}`);
  }
};

const isNumber = (text) => {
  return !isNaN(text);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount);
};
