import {
	COPILOT_DISPLAY_MODES,
	COPILOT_ERROR_MESSAGES,
	COPILOT_FORMATTING,
	COPILOT_PLANS,
	COPILOT_TIME_FORMATS,
	COPILOT_TITLE_TEXT,
	COPILOT_USAGE_METRICS,
} from "./constants.ts";

export type CopilotSettings = {
	plan?: CopilotPlan;
	limit?: number;
	displayMode?: CopilotDisplayMode;
};

export type CopilotPlan = (typeof COPILOT_PLANS)[keyof typeof COPILOT_PLANS];

export type CopilotUsageMetric =
	(typeof COPILOT_USAGE_METRICS)[keyof typeof COPILOT_USAGE_METRICS];

export type GitHubCredentials = {
	username?: string;
	pat?: string;
};

export type CopilotDisplayMode =
	(typeof COPILOT_DISPLAY_MODES)[keyof typeof COPILOT_DISPLAY_MODES];

export type CopilotTimeFormat =
	(typeof COPILOT_TIME_FORMATS)[keyof typeof COPILOT_TIME_FORMATS];

export type CopilotResetSettings = {
	timeFormat?: CopilotTimeFormat;
};

export type CopilotUsageItem = {
	grossQuantity: number;
	unitType: string;
};

export function getConfiguredGitHubCredentials(
	credentials: GitHubCredentials,
): { username: string; pat: string } | undefined {
	const username = credentials.username?.trim();
	const pat = credentials.pat?.trim();
	return username && pat ? { username, pat } : undefined;
}

export function sumCopilotUsage(items: readonly CopilotUsageItem[]): number {
	if (items.length === 0) {
		return 0;
	}

	const unitType = items[0].unitType;
	if (items.some((item) => item.unitType !== unitType)) {
		throw new Error(COPILOT_ERROR_MESSAGES.INCONSISTENT_USAGE_UNITS);
	}

	const total = items.reduce((sum, item) => sum + item.grossQuantity, 0);
	if (!Number.isFinite(total)) {
		throw new Error(COPILOT_ERROR_MESSAGES.INVALID_USAGE_TOTAL);
	}

	return total;
}

export function formatCopilotUsageTitle(
	used: number,
	limit: number | undefined,
	mode: CopilotDisplayMode,
	label: string,
): string {
	const formattedUsed = formatNumber(used);
	if (mode === COPILOT_DISPLAY_MODES.PERCENTAGE) {
		if (!isValidCreditLimit(limit)) {
			return `${label}${COPILOT_TITLE_TEXT.LINE_BREAK}${COPILOT_TITLE_TEXT.SET_LIMIT}`;
		}

		return `${label}${COPILOT_TITLE_TEXT.LINE_BREAK}${formatNumber((used / limit) * 100)}%`;
	}

	return isValidCreditLimit(limit)
		? `${label}${COPILOT_TITLE_TEXT.LINE_BREAK}${formattedUsed}/${formatNumber(limit)}`
		: `${label}${COPILOT_TITLE_TEXT.LINE_BREAK}${formattedUsed}${COPILOT_TITLE_TEXT.USED_SUFFIX}`;
}

export function formatCopilotResetTitle(
	now: Date,
	timeFormat: CopilotTimeFormat = COPILOT_TIME_FORMATS.TWENTY_FOUR_HOUR,
): string {
	const reset = getNextMonthlyReset(now);
	const month = new Intl.DateTimeFormat(COPILOT_FORMATTING.DATE_LOCALE, {
		month: COPILOT_FORMATTING.DATE_MONTH_STYLE,
	})
		.format(reset)
		.replace(COPILOT_FORMATTING.MONTH_TRAILING_PERIOD, "");
	const day = new Intl.DateTimeFormat(COPILOT_FORMATTING.DATE_LOCALE, {
		day: COPILOT_FORMATTING.DATE_DAY_STYLE,
	}).format(reset);
	const isTwelveHour = timeFormat === COPILOT_TIME_FORMATS.TWELVE_HOUR;
	const time = new Intl.DateTimeFormat(
		isTwelveHour
			? COPILOT_FORMATTING.TIME_12_HOUR_LOCALE
			: COPILOT_FORMATTING.TIME_24_HOUR_LOCALE,
		{
			hour: COPILOT_FORMATTING.TIME_HOUR_STYLE,
			minute: COPILOT_FORMATTING.TIME_MINUTE_STYLE,
			hourCycle: isTwelveHour
				? COPILOT_FORMATTING.TIME_12_HOUR_CYCLE
				: COPILOT_FORMATTING.TIME_24_HOUR_CYCLE,
		},
	).format(reset);

	return `${COPILOT_TITLE_TEXT.RESETS_ON}${COPILOT_TITLE_TEXT.LINE_BREAK}${month}. ${day}${COPILOT_TITLE_TEXT.LINE_BREAK}${time}`;
}

export function getNextMonthlyReset(now: Date): Date {
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

export function isValidCreditLimit(value: number | undefined): value is number {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function formatNumber(value: number): string {
	return new Intl.NumberFormat(COPILOT_FORMATTING.NUMBER_LOCALE, {
		maximumFractionDigits: COPILOT_FORMATTING.MAX_FRACTION_DIGITS,
	}).format(value);
}

