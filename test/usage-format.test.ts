import assert from "node:assert/strict";
import test from "node:test";

import {
	formatCopilotResetTitle,
	formatCopilotUsageTitle,
	getConfiguredGitHubCredentials,
	getNextMonthlyReset,
	sumCopilotUsage,
} from "../src/usage-format.ts";

test("sums Copilot gross quantities when they share a unit", () => {
	assert.equal(
		sumCopilotUsage([
			{ grossQuantity: 12, unitType: "CREDITS" },
			{ grossQuantity: 7.5, unitType: "CREDITS" },
		]),
		19.5,
	);
});

test("rejects usage quantities with inconsistent units", () => {
	assert.throws(
		() =>
			sumCopilotUsage([
				{ grossQuantity: 12, unitType: "CREDITS" },
				{ grossQuantity: 4, unitType: "REQUESTS" },
			]),
		/inconsistent units/,
	);
});

test("formats the current usage total without an allowance", () => {
	assert.equal(formatCopilotUsageTitle(375, "Credits"), "Credits\n375 used");
	assert.equal(formatCopilotUsageTitle(0, "Requests"), "Requests\n0 used");
});

test("requires a nonblank username and token before credentials are configured", () => {
	assert.equal(getConfiguredGitHubCredentials({ username: "user" }), undefined);
	assert.equal(getConfiguredGitHubCredentials({ username: " ", pat: "token" }), undefined);
	assert.deepEqual(
		getConfiguredGitHubCredentials({ username: " user ", pat: " token " }),
		{ username: "user", pat: "token" },
	);
});

test("shows the reset label, local date, and local hour on three lines", () => {
	const now = new Date("2027-01-31T23:59:00Z");
	const reset = getNextMonthlyReset(now);
	const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(reset).replace(/\.$/, "");
	const day = new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(reset);
	const time24h = new Intl.DateTimeFormat("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).format(reset);
	const time12h = new Intl.DateTimeFormat("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h12",
	}).format(reset);

	assert.equal(formatCopilotResetTitle(now), `Resets on:\n${month}. ${day}\n${time24h}`);
	const title12h = formatCopilotResetTitle(now, "12h");
	assert.equal(title12h, `Resets on:\n${month}. ${day}\n${time12h}`);
	assert.match(title12h.split("\n")[2], /\b(?:AM|PM)$/);
});
