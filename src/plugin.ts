import streamDeck from "@elgato/streamdeck";

import {
	CopilotCreditsAction,
	CopilotInlineSuggestionsAction,
	CopilotPremiumRequestsAction,
	CopilotResetDateAction,
} from "./actions/copilot-usage";

streamDeck.actions.registerAction(new CopilotCreditsAction());
streamDeck.actions.registerAction(new CopilotPremiumRequestsAction());
streamDeck.actions.registerAction(new CopilotInlineSuggestionsAction());
streamDeck.actions.registerAction(new CopilotResetDateAction());
streamDeck.connect();
