# Email to Telegram

Forward new messages from a Gmail inbox to a Telegram chat using IMAP and the Telegram Bot API.

## Requirements
- Node.js 18 or later
- pnpm (recommended) or npm
- Gmail account with IMAP access enabled
- Telegram bot created via BotFather

## Setup
1. Install dependencies:
   ```bash
   pnpm install
   ```
   *(Use `npm install` if you prefer.)*
2. Copy the sample environment file and fill in your credentials:
   ```bash
   cp env.sample .env
   ```
3. Update `.env` with the values for your bot, chat, and mailbox.

## Environment variables
| Name | Description |
| --- | --- |
| `TELEGRAM_TOKEN` | Bot token from BotFather. |
| `TELEGRAM_CHAT_ID` | Chat or channel ID that receives the notifications. |
| `EMAIL_USER` | IMAP username (usually the full Gmail address). |
| `EMAIL_PASS` | Gmail App Password generated for IMAP access. |
| `SPECIFIC_EMAIL` | (Optional) Only forward emails whose "From" header contains this value. Leave empty to forward everything. |

## Run the listener
Start the bridge once the `.env` file is ready:
```bash
node index.js
```
The script logs when it connects to the inbox and forwards each matching email in 4k-character chunks to stay under Telegram's limit.

## Gmail and security notes
- Enable IMAP in Gmail settings.
- Use an App Password (not your regular password) when 2FA is enabled.
- Keep the `.env` file secret—never commit it to source control.

## Troubleshooting
- Check the console for IMAP connection errors (e.g., authentication failures).
- If Telegram messages fail, verify the chat ID and that the bot has joined the conversation.
- For noisy HTML emails, the script strips styling and scripts before sending to Telegram.
