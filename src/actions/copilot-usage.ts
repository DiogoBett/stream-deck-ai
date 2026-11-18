import streamDeck, {
	action,
	SingletonAction,
	type DidReceiveSettingsEvent,
	type KeyDownEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";

import {
	COPILOT_ACTION_LABELS,
	COPILOT_DISPLAY_MODES,
	COPILOT_ERROR_MESSAGES,
	COPILOT_PLANS,
	COPILOT_PRO_MONTHLY_CREDIT_LIMIT,
	COPILOT_RESET_REFRESH_INTERVAL_MS,
	COPILOT_TIME_FORMATS,
	COPILOT_TITLE_TEXT,
	COPILOT_USAGE_METRICS,
	GITHUB_PAT_SETTINGS_URL,
	STREAM_DECK_ACTION_UUIDS,
} from "../constants.ts";
import { fetchPersonalCopilotUsage } from "../github-api";
import {
	formatCopilotUsageTitle,
	formatCopilotResetTitle,
	getConfiguredGitHubCredentials,
	isValidCreditLimit,
	type CopilotDisplayMode,
	type CopilotResetSettings,
	type CopilotSettings,
	type CopilotTimeFormat,
	type CopilotUsageMetric,
	type GitHubCredentials,
} from "../usage-format";

abstract class CopilotUsageActionBase extends SingletonAction<CopilotSettings> {
	protected abstract readonly label: string;
	protected abstract readonly metric: CopilotUsageMetric;

	override async onWillAppear(ev: WillAppearEvent<CopilotSettings>): Promise<void> {
		if (ev.action.isKey()) {
			await this.refresh(ev.action, ev.payload.settings);
		}
	}

	override async onKeyDown(ev: KeyDownEvent<CopilotSettings>): Promise<void> {
		if (await openSetupPageIfRequired((title) => ev.action.setTitle(title))) {
			return;
		}

		const settings = ev.payload.settings;
		const nextMode: CopilotDisplayMode =
			getDisplayMode(settings, this.metric) === COPILOT_DISPLAY_MODES.PERCENTAGE
				? COPILOT_DISPLAY_MODES.VALUES
				: COPILOT_DISPLAY_MODES.PERCENTAGE;
		const nextSettings = { ...settings, displayMode: nextMode };
		await ev.action.setSettings(nextSettings);
		await this.refresh(ev.action, nextSettings);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<CopilotSettings>): Promise<void> {
		if (ev.action.isKey()) {
			await this.refresh(ev.action, ev.payload.settings);
		}
	}

	private async refresh(
		actionInstance: KeyDownEvent<CopilotSettings>["action"],
		settings: CopilotSettings,
	): Promise<void> {
		try {
			const credentials = await streamDeck.settings.getGlobalSettings<GitHubCredentials>();
			if (!getConfiguredGitHubCredentials(credentials)) {
				await actionInstance.setTitle(COPILOT_TITLE_TEXT.SETUP_REQUIRED);
				return;
			}

			await actionInstance.setTitle(
				`${this.label}${COPILOT_TITLE_TEXT.LINE_BREAK}${COPILOT_TITLE_TEXT.LOADING}`,
			);
			const used = await fetchPersonalCopilotUsage(credentials, this.metric);
			await actionInstance.setTitle(
				formatCopilotUsageTitle(
					used,
					getLimit(settings, this.metric),
					getDisplayMode(settings, this.metric),
					this.label,
				),
			);
		} catch (error) {
			streamDeck.logger.error(COPILOT_ERROR_MESSAGES.couldNotLoadUsage(this.label), error);
			await actionInstance.setTitle(
				`${this.label}${COPILOT_TITLE_TEXT.LINE_BREAK}${COPILOT_TITLE_TEXT.CHECK_SETUP}`,
			);
		}
	}
}

@action({ UUID: STREAM_DECK_ACTION_UUIDS.COPILOT_CREDITS })
export class CopilotCreditsAction extends CopilotUsageActionBase {
	protected readonly label = COPILOT_ACTION_LABELS.CREDITS;
	protected readonly metric = COPILOT_USAGE_METRICS.AI_CREDIT;
}

@action({ UUID: STREAM_DECK_ACTION_UUIDS.COPILOT_PREMIUM_REQUESTS })
export class CopilotPremiumRequestsAction extends CopilotUsageActionBase {
	protected readonly label = COPILOT_ACTION_LABELS.PREMIUM_REQUESTS;
	protected readonly metric = COPILOT_USAGE_METRICS.PREMIUM_REQUEST;
}

@action({ UUID: STREAM_DECK_ACTION_UUIDS.COPILOT_INLINE_SUGGESTIONS })
export class CopilotInlineSuggestionsAction extends SingletonAction {
	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		if (ev.action.isKey()) {
			await this.refresh(ev.action);
		}
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (ev.action.isKey()) {
			if (await openSetupPageIfRequired((title) => ev.action.setTitle(title))) {
				return;
			}
			await this.refresh(ev.action);
		}
	}

	private async refresh(actionInstance: KeyDownEvent["action"]): Promise<void> {
		try {
			const credentials = await streamDeck.settings.getGlobalSettings<GitHubCredentials>();
			const title = getConfiguredGitHubCredentials(credentials)
				? COPILOT_TITLE_TEXT.INLINE_UNAVAILABLE
				: COPILOT_TITLE_TEXT.SETUP_REQUIRED;
			await actionInstance.setTitle(title);
		} catch (error) {
			streamDeck.logger.error(COPILOT_ERROR_MESSAGES.COULD_NOT_CHECK_INLINE_CREDENTIALS, error);
			await actionInstance.setTitle(COPILOT_TITLE_TEXT.INLINE_CHECK_SETUP);
		}
	}
}

async function openSetupPageIfRequired(setTitle: (title: string) => Promise<void>): Promise<boolean> {
	let credentials: GitHubCredentials;
	try {
		credentials = await streamDeck.settings.getGlobalSettings<GitHubCredentials>();
	} catch (error) {
		streamDeck.logger.error(
			COPILOT_ERROR_MESSAGES.COULD_NOT_CHECK_CREDENTIALS_BEFORE_SETUP,
			error,
		);
		return false;
	}

	if (getConfiguredGitHubCredentials(credentials)) {
		return false;
	}

	await setTitle(COPILOT_TITLE_TEXT.SETUP_REQUIRED);
	try {
		await streamDeck.system.openUrl(GITHUB_PAT_SETTINGS_URL);
	} catch (error) {
		streamDeck.logger.error(COPILOT_ERROR_MESSAGES.COULD_NOT_OPEN_PAT_SETTINGS, error);
	}
	return true;
}

@action({ UUID: STREAM_DECK_ACTION_UUIDS.COPILOT_RESET })
export class CopilotResetDateAction extends SingletonAction<CopilotResetSettings> {
	private readonly visible = new Map<
		string,
		{ action: KeyDownEvent<CopilotResetSettings>["action"]; settings: CopilotResetSettings }
	>();
	private readonly refreshTimer: NodeJS.Timeout;

	constructor() {
		super();
		this.refreshTimer = setInterval(() => {
			for (const { action: actionInstance, settings } of this.visible.values()) {
				this.refresh(actionInstance, settings).catch((error: unknown) => {
					streamDeck.logger.error(COPILOT_ERROR_MESSAGES.COULD_NOT_REFRESH_RESET_COUNTDOWN, error);
				});
			}
		}, COPILOT_RESET_REFRESH_INTERVAL_MS);
		this.refreshTimer.unref();
	}

	override async onWillAppear(ev: WillAppearEvent<CopilotResetSettings>): Promise<void> {
		if (!ev.action.isKey()) {
			return;
		}
		this.visible.set(ev.action.id, { action: ev.action, settings: ev.payload.settings });
		await this.refresh(ev.action, ev.payload.settings);
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<CopilotResetSettings>): Promise<void> {
		if (!ev.action.isKey()) {
			return;
		}
		this.visible.set(ev.action.id, { action: ev.action, settings: ev.payload.settings });
		await this.refresh(ev.action, ev.payload.settings);
	}

	override async onKeyDown(ev: KeyDownEvent<CopilotResetSettings>): Promise<void> {
		if (!ev.action.isKey()) {
			return;
		}
		const timeFormat: CopilotTimeFormat =
			ev.payload.settings.timeFormat === COPILOT_TIME_FORMATS.TWELVE_HOUR
				? COPILOT_TIME_FORMATS.TWENTY_FOUR_HOUR
				: COPILOT_TIME_FORMATS.TWELVE_HOUR;
		const settings = { ...ev.payload.settings, timeFormat };
		this.visible.set(ev.action.id, { action: ev.action, settings });
		await ev.action.setSettings(settings);
		await this.refresh(ev.action, settings);
	}

	override onWillDisappear(ev: WillDisappearEvent<CopilotResetSettings>): void {
		this.visible.delete(ev.action.id);
	}

	private async refresh(
		actionInstance: KeyDownEvent<CopilotResetSettings>["action"],
		settings: CopilotResetSettings,
	): Promise<void> {
		await actionInstance.setTitle(
			formatCopilotResetTitle(
				new Date(),
				settings.timeFormat ?? COPILOT_TIME_FORMATS.TWENTY_FOUR_HOUR,
			),
		);
	}
}

function getDisplayMode(settings: CopilotSettings, metric: CopilotUsageMetric): CopilotDisplayMode {
	if (
		settings.displayMode === COPILOT_DISPLAY_MODES.PERCENTAGE ||
		settings.displayMode === COPILOT_DISPLAY_MODES.VALUES
	) {
		return settings.displayMode;
	}

	return isValidCreditLimit(getLimit(settings, metric))
		? COPILOT_DISPLAY_MODES.PERCENTAGE
		: COPILOT_DISPLAY_MODES.VALUES;
}

function getLimit(settings: CopilotSettings, metric: CopilotUsageMetric): number | undefined {
	if (isValidCreditLimit(settings.limit)) {
		return settings.limit;
	}

	return settings.plan === COPILOT_PLANS.PRO && metric === COPILOT_USAGE_METRICS.AI_CREDIT
		? COPILOT_PRO_MONTHLY_CREDIT_LIMIT
		: undefined;
}
