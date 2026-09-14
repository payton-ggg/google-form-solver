//#region src/background/index.ts
chrome.runtime.onInstalled.addListener((e) => {
	e.reason === "install" && (console.log("Google Forms AI Solver installed."), chrome.storage.sync.get([
		"apiKey",
		"model",
		"language",
		"autoScroll"
	], (e) => {
		chrome.storage.sync.set({
			apiKey: e.apiKey || "",
			model: e.model && !e.model.includes("3.6") ? e.model : "gemini-2.5-flash",
			language: e.language || "auto",
			autoScroll: typeof e.autoScroll != "boolean" || e.autoScroll
		});
	}));
});
//#endregion
