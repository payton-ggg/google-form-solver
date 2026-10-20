//#region src/background/index.ts
chrome.runtime.onInstalled.addListener((e) => {
	e.reason === "install" && (console.log("Google Forms AI Solver installed."), chrome.storage.sync.get([
		"apiKey",
		"model",
		"language",
		"autoScroll"
	], (e) => {
		let t = [
			"gemini-2.5-pro",
			"gemini-3.1-pro",
			"gemini-4-argon",
			"gemini-2.0-flash",
			"gemini-2.0-flash-lite",
			"gemini-2-flash",
			"gemini-2-flash-lite",
			"gemini-1.5-flash",
			"gemini-1.5-pro",
			"gemini-1.5-flash-8b"
		], n = typeof e.model == "string" ? e.model : "", r = n && !t.includes(n) ? n : "gemini-3.8-flash";
		chrome.storage.sync.set({
			apiKey: e.apiKey || "",
			model: r,
			language: e.language || "auto",
			autoScroll: typeof e.autoScroll != "boolean" || e.autoScroll
		});
	}));
});
//#endregion
