export const COPILOT_USAGE_METRICS = {
	AI_CREDIT: "ai_credit",
	PREMIUM_REQUEST: "premium_request",
} as const;

export const COPILOT_TIME_FORMATS = {
	TWELVE_HOUR: "12h",
	TWENTY_FOUR_HOUR: "24h",
} as const;

export const COPILOT_RESET_REFRESH_INTERVAL_MS = 60_000;

export const STREAM_DECK_ACTION_UUIDS = {
	COPILOT_CREDITS: "io.github.diogo.ai-usage.copilot-credits",
	COPILOT_PREMIUM_REQUESTS: "io.github.diogo.ai-usage.copilot-premium-requests",
	COPILOT_INLINE_SUGGESTIONS: "io.github.diogo.ai-usage.copilot-inline",
	COPILOT_RESET: "io.github.diogo.ai-usage.copilot-reset",
} as const;

export const COPILOT_ACTION_LABELS = {
	CREDITS: "Credits",
	PREMIUM_REQUESTS: "Requests",
	INLINE_SUGGESTIONS: "Inline",
} as const;

export const GITHUB_PAT_SETTINGS_URL = "https://github.com/settings/personal-access-tokens";

export const GITHUB_API = {
	BASE_URL: "https://api.github.com",
	USER_PATH: "/users/",
	BILLING_PATH: "/settings/billing/",
	USAGE_PATH_SUFFIX: "/usage",
	ACCEPT_HEADER: "Accept",
	ACCEPT_VALUE: "application/vnd.github+json",
	API_VERSION_HEADER: "X-GitHub-Api-Version",
	API_VERSION: "2026-03-10",
	AUTHORIZATION_HEADER: "Authorization",
	BEARER_PREFIX: "Bearer ",
	YEAR_QUERY_PARAMETER: "year",
	MONTH_QUERY_PARAMETER: "month",
	REQUEST_TIMEOUT_MS: 15_000,
} as const;

export const COPILOT_TITLE_TEXT = {
	LINE_BREAK: "\n",
	SETUP_REQUIRED: "Setup\nRequired",
	LOADING: "Loading",
	CHECK_SETUP: "Check setup",
	INLINE_UNAVAILABLE: "Inline\nUnavailable",
	INLINE_CHECK_SETUP: "Inline\nCheck setup",
	USED_SUFFIX: " used",
	RESETS_ON: "Resets on:",
} as const;

export const COPILOT_ERROR_MESSAGES = {
	CONFIGURE_CREDENTIALS: "Configure a GitHub username and fine-grained personal access token.",
	INCONSISTENT_USAGE_UNITS: "GitHub returned usage with inconsistent units.",
	INVALID_USAGE_TOTAL: "GitHub returned an invalid usage total.",
	UNEXPECTED_USAGE_REPORT: "GitHub returned an unexpected Copilot usage report.",
	usageRequestFailed: (status: number) =>
		`GitHub Copilot usage request failed with HTTP ${status}.`,
	couldNotLoadUsage: (label: string) =>
		`Could not load personal GitHub ${label.toLowerCase()} usage.`,
	COULD_NOT_CHECK_INLINE_CREDENTIALS: "Could not check GitHub credentials for inline suggestions.",
	COULD_NOT_CHECK_CREDENTIALS_BEFORE_SETUP: "Could not check GitHub credentials before opening setup.",
	COULD_NOT_OPEN_PAT_SETTINGS: "Could not open GitHub's personal access token settings page.",
	COULD_NOT_REFRESH_RESET_COUNTDOWN: "Could not refresh the Copilot reset countdown.",
} as const;

export const COPILOT_FORMATTING = {
	NUMBER_LOCALE: "en-US",
	MAX_FRACTION_DIGITS: 1,
	DATE_LOCALE: "en-US",
	DATE_MONTH_STYLE: "short",
	DATE_DAY_STYLE: "numeric",
	TIME_12_HOUR_LOCALE: "en-US",
	TIME_24_HOUR_LOCALE: "en-GB",
	TIME_HOUR_STYLE: "2-digit",
	TIME_MINUTE_STYLE: "2-digit",
	TIME_12_HOUR_CYCLE: "h12",
	TIME_24_HOUR_CYCLE: "h23",
	MONTH_TRAILING_PERIOD: /\.$/,
} as const;
