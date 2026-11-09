import { Telegraf, Markup } from 'telegraf';
const BOT_TOKEN = '8768334829:AAGuVPzYBFFALuJR1byF7Eiycos0bLHJ184';
const ADMIN_CHAT_ID = '5057008823';
const SALES_PHONE = '+998 90 000-00-00';
const SALES_TG = '@smart_jizzakh';
if(BOT_TOKEN.includes('ВАШ_')) {
  console.error('❌ Вставьте BOT_TOKEN из BotFather в bot.js');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const COMPLEXES = {
  'jizzax_city': {
    name: 'Jizzax City',
    district: 'Центр',
    year: '2026',
    price: 'от 5.2 млн сум/м²',
    desc: 'Премиальный ЖК в самом центре Джизака. Панорамные окна, закрытый двор, подземный паркинг.',
    photos: []
  },
  'zamin': {
    name: 'Zamin Residence',
    district: 'Замин',
    year: '2025',
    price: 'от 4.8 млн сум/м²',
    desc: 'Уютный комплекс с детской площадкой и ландшафтным дизайном. Идеален для семей.',
    photos: []
  },
  'sharq': {
    name: 'Sharq Park',
    district: 'Центр',
    year: '2027',
    price: 'от 5.9 млн сум/м²',
    desc: 'Бутик-комплекс на 60 квартир с видом на парк. Ограниченное предложение.',
    photos: []
  }
};
const userState = new Map();
function mainMenu() {
  return Markup.keyboard([
    ['🏠 Каталог квартир', '💰 Рассчитать ипотеку'],
    ['📞 Связаться с менеджером', '🏗 Ход стройки'],
    ['📍 Офис продаж', 'ℹ️ О компании']
  ]).resize();
}
bot.start((ctx) => {
  userState.delete(ctx.from.id);
  ctx.reply(
    `👋 Здравствуйте, ${ctx.from.first_name}!\n\n` +
    `Это официальный бот <b>Smart Jizzakh Real Estate</b>.\n\n` +
    `Мы строим премиальные жилые комплексы в Джизаке:\n` +
    `• 🏙 <b>Jizzax City</b> — Центр, сдача 2026\n` +
    `• 🏡 <b>Zamin Residence</b> — Замин, сдача 2025\n` +
    `• 🌳 <b>Sharq Park</b> — Центр, сдача 2027\n\n` +
    `Выберите, что вас интересует 👇`,
    { parse_mode:'HTML', ...mainMenu() }
  );
});
bot.hears('🏠 Каталог квартир', (ctx) => {
  ctx.reply(
    'Выберите жилой комплекс:',
    Markup.inlineKeyboard([
      [Markup.button.callback('🏙 Jizzax City', 'complex_jizzax_city')],
      [Markup.button.callback('🏡 Zamin Residence', 'complex_zamin')],
      [Markup.button.callback('🌳 Sharq Park', 'complex_sharq')]
    ])
  );
});
Object.keys(COMPLEXES).forEach(key => {
  bot.action(`complex_${key}`, async (ctx) => {
    const c = COMPLEXES[key];
    await ctx.answerCbQuery();
    await ctx.replyWithHTML(
      `<b>${c.name}</b>\n\n` +
      `📍 Район: ${c.district}\n` +
      `📅 Сдача: ${c.year}\n` +
      `💰 Цена: ${c.price}\n\n` +
      `${c.desc}\n\n` +
      `Хотите оставить заявку на просмотр?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✍️ Оставить заявку', `lead_${key}`)],
        [Markup.button.callback('⬅️ Назад к списку', 'back_catalog')]
      ])
    );
  });
});

bot.action('back_catalog', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    'Выберите жилой комплекс:',
    Markup.inlineKeyboard([
      [Markup.button.callback('🏙 Jizzax City', 'complex_jizzax_city')],
      [Markup.button.callback('🏡 Zamin Residence', 'complex_zamin')],
      [Markup.button.callback('🌳 Sharq Park', 'complex_sharq')]
    ])
  );
});
bot.action(/^lead_(.+)$/, async (ctx) => {
  const key = ctx.match[1];
  userState.set(ctx.from.id, { step: 'await_lead_phone', complex: key });
  await ctx.answerCbQuery();
  await ctx.reply(
    `Отлично! Чтобы менеджер связался с вами, отправьте свой номер телефона.\n\n` +
    `Можно просто поделиться контактом 👇`,
    Markup.keyboard([
      [Markup.button.contactRequest('📱 Поделиться номером')],
      ['❌ Отменить']
    ]).resize().oneTime()
  );
});
bot.on('contact', async (ctx) => {
  const state = userState.get(ctx.from.id);
  if(!state || state.step !== 'await_lead_phone') return;

  const phone = ctx.message.contact.phone_number;
  const c = COMPLEXES[state.complex];
  try {
    await bot.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `🔔 <b>Новая заявка в боте</b>\n\n` +
      `👤 <b>Имя:</b> ${ctx.from.first_name}${ctx.from.last_name ? ' ' + ctx.from.last_name : ''}\n` +
      `📞 <b>Телефон:</b> +${phone.replace(/^\+/,'')}\n` +
      `🏠 <b>ЖК:</b> ${c.name}\n` +
      `🔗 <b>Telegram:</b> @${ctx.from.username || '—'}\n` +
      `🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU',{timeZone:'Asia/Tashkent'})}`,
      { parse_mode:'HTML' }
    );
  } catch(e) {
    console.error('Ошибка отправки админу:', e.message);
  }

  userState.delete(ctx.from.id);
  await ctx.reply(
    `✅ <b>Спасибо!</b>\n\n` +
    `Ваша заявка на <b>${c.name}</b> принята.\n` +
    `Менеджер свяжется с вами в течение 15 минут.\n\n` +
    `Хотите посмотреть другие ЖК?`,
    { parse_mode:'HTML', ...mainMenu() }
  );
});
bot.on('text', async (ctx, next) => {
  const state = userState.get(ctx.from.id);
  if(state?.step === 'await_lead_phone'){
    const phone = ctx.message.text.replace(/[^\d+]/g,'');
    if(phone.length < 9){
      return ctx.reply('Пожалуйста, введите корректный номер телефона или нажмите кнопку «Поделиться номером».');
    }
    const c = COMPLEXES[state.complex];
    try {
      await bot.telegram.sendMessage(
        ADMIN_CHAT_ID,
        `🔔 <b>Новая заявка в боте</b>\n\n` +
        `👤 <b>Имя:</b> ${ctx.from.first_name}\n` +
        `📞 <b>Телефон:</b> ${phone}\n` +
        `🏠 <b>ЖК:</b> ${c.name}\n` +
        `🔗 <b>Telegram:</b> @${ctx.from.username || '—'}`,
        { parse_mode:'HTML' }
      );
    } catch(e){ console.error(e.message); }
    userState.delete(ctx.from.id);
    return ctx.reply(
      `✅ Заявка принята! Менеджер свяжется с вами в течение 15 минут.`,
      mainMenu()
    );
  }
  return next();
});
bot.hears('💰 Рассчитать ипотеку', (ctx) => {
  ctx.replyWithHTML(
    `💰 <b>Ипотечный калькулятор</b>\n\n` +
    `Пример расчёта для квартиры за <b>600 млн сум</b>:\n\n` +
    `• Первый взнос 20% (120 млн) → кредит 480 млн\n` +
    `• Срок 10 лет, ставка 18%\n` +
    `• <b>Ежемесячный платёж ≈ 8.6 млн сум</b>\n\n` +
    `Точный расчёт сделает менеджер — с учётом вашей ситуации и банка.\n\n` +
    `Открыть полный калькулятор на сайте?`,
    Markup.inlineKeyboard([
      [Markup.button.url('🌐 Открыть калькулятор', 'https://smartjizzakh.uz/#mortgage')]
    ])
  );
});
bot.hears('📞 Связаться с менеджером', (ctx) => {
  ctx.replyWithHTML(
    `📞 <b>Связаться с менеджером</b>\n\n` +
    `Телефон: <a href="tel:${SALES_PHONE.replace(/\s/g,'')}">${SALES_PHONE}</a>\n` +
    `Telegram: <a href="https://t.me/${SALES_TG.replace('@','')}">${SALES_TG}</a>\n\n` +
    `Режим работы: ежедневно 9:00 – 20:00`,
    Markup.inlineKeyboard([
      [Markup.button.url('💬 Написать в Telegram', `https://t.me/${SALES_TG.replace('@nimatov_anur_azizovich','')}`)],
      [Markup.button.callback('✍️ Оставить заявку', 'request_callback')]
    ])
  );
});
bot.action('request_callback', async (ctx) => {
  await ctx.answerCbQuery();
  userState.set(ctx.from.id, { step: 'await_lead_phone', complex: 'callback' });
  await ctx.reply(
    'Отправьте свой номер — менеджер перезвонит.',
    Markup.keyboard([[Markup.button.contactRequest('📱 Поделиться номером')]]).resize().oneTime()
  );
});
bot.hears('🏗 Ход стройки', (ctx) => {
  ctx.replyWithHTML(
    `🏗 <b>Ход строительства</b>\n\n` +
    `📅 Обновляется ежемесячно.\n\n` +
    `• <b>Jizzax City</b> — 3-й этаж из 5 (45%)\n` +
    `• <b>Zamin Residence</b> — 5-й этаж из 5, внутренние работы (85%)\n` +
    `• <b>Sharq Park</b> — котлован, фундамент (10%)\n\n` +
    `Полная галерея — на сайте.`,
    Markup.inlineKeyboard([
      [Markup.button.url('📸 Смотреть фото', 'https://smartjizzakh.uz/#progress')]
    ])
  );
});
bot.hears('📍 Офис продаж', (ctx) => {
  ctx.replyWithHTML(
    `📍 <b>Офис продаж</b>\n\n` +
    `г. Джизак, ул. Ш. Рашидова, 12\n\n` +
    `🕐 Ежедневно 9:00 – 20:00\n` +
    `📞 ${SALES_PHONE}`,
    Markup.inlineKeyboard([
      [Markup.button.url('🗺 Открыть на карте', 'https://maps.google.com/?q=Jizzakh')]
    ])
  );
});
bot.hears('ℹ️ О компании', (ctx) => {
  ctx.replyWithHTML(
    `ℹ️ <b>Smart Jizzakh Real Estate</b>\n\n` +
    `Мы — девелопер премиальной недвижимости в Джизаке. ` +
    `С 2020 года построили 3 жилых комплекса и 320+ квартир.\n\n` +
    `Наши принципы:\n` +
    `• Качественная архитектура\n` +
    `• Закрытые дворы с ландшафтом\n` +
    `• Прозрачные условия ипотеки\n` +
    `• Сдача в срок\n\n` +
    `🌐 <a href="https://smartjizzakh.uz">smartjizzakh.uz</a>`
  );
});
bot.hears('❌ Отменить', (ctx) => {
  userState.delete(ctx.from.id);
  ctx.reply('Действие отменено.', mainMenu());
});
bot.on('text', (ctx) => {
  if(!ctx.message.text.startsWith('/')) {
    ctx.reply('Пожалуйста, выберите пункт из меню 👇', mainMenu());
  }
});
bot.launch();
console.log('🤖 Бот Smart Jizzakh запущен');
process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));2