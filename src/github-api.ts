import {
	COPILOT_ERROR_MESSAGES,
	GITHUB_API,
} from "./constants.ts";
import {
	getConfiguredGitHubCredentials,
	sumCopilotUsage,
	type CopilotUsageItem,
	type CopilotUsageMetric,
	type GitHubCredentials,
} from "./usage-format";

export async function fetchPersonalCopilotUsage(
	credentials: GitHubCredentials,
	metric: CopilotUsageMetric,
): Promise<number> {
	const configuredCredentials = getConfiguredGitHubCredentials(credentials);
	if (!configuredCredentials) {
		throw new Error(COPILOT_ERROR_MESSAGES.CONFIGURE_CREDENTIALS);
	}
	const { username, pat: token } = configuredCredentials;

	const headers: HeadersInit = {
		[GITHUB_API.ACCEPT_HEADER]: GITHUB_API.ACCEPT_VALUE,
		[GITHUB_API.API_VERSION_HEADER]: GITHUB_API.API_VERSION,
		[GITHUB_API.AUTHORIZATION_HEADER]: `${GITHUB_API.BEARER_PREFIX}${token}`,
	};

	const now = new Date();
	const query = new URLSearchParams({
		[GITHUB_API.YEAR_QUERY_PARAMETER]: String(now.getUTCFullYear()),
		[GITHUB_API.MONTH_QUERY_PARAMETER]: String(now.getUTCMonth() + 1),
	});
	const usageUrl = `${GITHUB_API.BASE_URL}${GITHUB_API.USER_PATH}${encodeURIComponent(username)}${GITHUB_API.BILLING_PATH}${metric}${GITHUB_API.USAGE_PATH_SUFFIX}?${query}`;
	const usageResponse = await fetch(usageUrl, {
		headers,
		signal: AbortSignal.timeout(GITHUB_API.REQUEST_TIMEOUT_MS),
	});
	if (!usageResponse.ok) {
		throw new Error(COPILOT_ERROR_MESSAGES.usageRequestFailed(usageResponse.status));
	}

	const usagePayload: unknown = await usageResponse.json();
	if (
		!isRecord(usagePayload) ||
		!Array.isArray(usagePayload.usageItems) ||
		!usagePayload.usageItems.every(isUsageItem)
	) {
		throw new Error(COPILOT_ERROR_MESSAGES.UNEXPECTED_USAGE_REPORT);
	}

	return sumCopilotUsage(usagePayload.usageItems);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isUsageItem(value: unknown): value is CopilotUsageItem {
	return (
		isRecord(value) &&
		typeof value.grossQuantity === "number" &&
		Number.isFinite(value.grossQuantity) &&
		typeof value.unitType === "string"
	);
}
