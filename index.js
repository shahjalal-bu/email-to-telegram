const TelegramBot = require('node-telegram-bot-api');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
require('dotenv').config();

// === CONFIGURATION ===
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const targetEmails = ["abc.com", "xyz.com"]; // set to null to allow all

// === TELEGRAM BOT ===
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// === HELPERS ===
function cleanHtml(html) {
  // remove <style> and <script> completely
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  // strip remaining tags
  html = html.replace(/<[^>]+>/g, ' ');
  // collapse spaces
  return html.replace(/\s+/g, ' ').trim();
}

// === IMAP CONFIG ===
const imap = new Imap({
  user: EMAIL_USER,
  password: EMAIL_PASS,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
});

function openInbox(cb) {
  imap.openBox('INBOX', false, cb);
}

// === LISTEN TO NEW EMAILS ===
imap.once('ready', () => {
  openInbox((err, box) => {
    if (err) throw err;
    console.log('📨 Listening for new emails...');

    imap.on('mail', () => {
      const fetch = imap.seq.fetch(box.messages.total + ':*', {
        bodies: [''], // fetch full raw email
        struct: true,
        markSeen: true
      });

      fetch.on('message', (msg) => {
        let buffer = '';
        msg.on('body', (stream) => {
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });

          stream.on('end', async () => {
            try {
              const parsed = await simpleParser(buffer);

              const from = parsed.from?.text || '';
              const subject = parsed.subject || '(no subject)';

              // prefer plain text, fallback to cleaned html
              let body = parsed.text || '';
              if (parsed.html) {
                const stripped = cleanHtml(parsed.html);
                if (stripped.length > body.length) {
                  body = stripped;
                }
              }
              body = body || '(no body)';

              if (targetEmails.includes(from)) {
                console.log("Cleaned body:", body);

                const message = `📧 *New Email from ${from}*\n\n*Subject:* ${subject}\n\n${body}`;

                // split into 4000-char chunks (Telegram limit)
                const chunks = message.match(/[\s\S]{1,4000}/g) || [];
                for (const chunk of chunks) {
                  try {
                    await bot.sendMessage(TELEGRAM_CHAT_ID, chunk, { parse_mode: 'Markdown' });
                  } catch (err) {
                    console.error("Telegram send error:", err.message, err.response?.body);
                  }
                }
              }
            } catch (err) {
              console.error('Parse error:', err);
            }
          });
        });
      });
    });
  });
});

imap.once('error', (err) => console.error('IMAP error:', err));
imap.once('end', () => console.log('Connection ended'));

imap.connect();
