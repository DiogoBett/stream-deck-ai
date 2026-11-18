> [!CAUTION]
> IN DEVELOPMENT - USE AT YOUR OWN RISK;
> V1 - SUPPORTS ONLY GITHUB COPILOT.

## stream-deck-ai
A Stream Deck plugin for personal GitHub Copilot usage on Free, Pro, Pro+, and Max plans;
It tracks AI Credits, Premium Requests, Inline Suggestions and Reset Dates.

### Features

- **Copilot AI Credits** — Displays the current-month usage total usage in percentage (Example: 10%) and in values (Example: 420 / 2,000);
- **Copilot Premium Requests** — Display the current-month usage of premium-requests in percentage (Example: 10%) and in values (Example: 420 / 2,000);
- **Copilot Inline Suggestions** — Shows the Inline Suggestions usage in percentage (Example: 10%) and in values (Example: 420 / 2,000);
- **Copilot Reset Countdown** — Shows the next reset date and the reset time in local 24-hour format by default. Press the key to toggle between 24-hour and 12-hour time.

The AI Credits, Premium Requests, and Inline Suggestions keys show **Setup** / **Required** on two lines until a GitHub username and token are configured.

### Setup

Requirements: Node.js 24+, Stream Deck 7.1+, and [`@elgato/cli`](https://www.npmjs.com/package/@elgato/cli).

```powershell
npm install
npm run build
npm install --global @elgato/cli
streamdeck link .\io.github.diogo.ai-usage.sdPlugin
```

### Access Token

1. Click **Generate new token** from [GitHub's token settings](https://github.com/settings/personal-access-tokens);
2. Set "Repository Access" to "Public Repositories";
3. Set "Permissions" to "Plan" ([Details](https://docs.github.com/pt/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens));
4. Click "Generate Token".