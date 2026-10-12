import { Component, MarkdownPostProcessorContext, MarkdownView, Plugin } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { HeaderApi } from "./api";
import { MarkdownHeaderView } from "./MarkdownHeaderView";
import { NoteProvider } from "./NoteContext";

/** Body class make.md's stylesheets key the header layout on. */
const ENABLED_CLASS = "mk-inline-context-enabled";
/** Marks a `.cm-sizer` holding a header, so CSS can hide Obsidian's own inline title there. */
const HAS_HEADER_CLASS = "notioneer-has-header";

type EditorWithCM = { cm?: { requestMeasure: () => void } };

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Mounts the header into every Markdown editor (live preview: first child of `.cm-sizer`)
    and into reading view (first child of `.mod-header`), where make.md put it. */
type Mounted = { root: Root; path: string; readMode: boolean; onMount?: () => void };

export class HeaderManager extends Component {
	private roots = new Map<HTMLElement, Mounted>();

	constructor(
		private plugin: Plugin,
		private api: HeaderApi,
	) {
		super();
	}

	onload() {
		const { workspace } = this.plugin.app;
		this.registerEvent(workspace.on("layout-change", () => this.refresh()));
		this.registerEvent(workspace.on("active-leaf-change", () => this.refresh()));
		this.registerEvent(workspace.on("file-open", () => this.refresh()));
		this.plugin.registerMarkdownPostProcessor((el, ctx) => this.mountReading(el, ctx));
		workspace.onLayoutReady(() => this.refresh());
		this.refresh();
	}

	onunload() {
		this.unmountAll();
		activeDocument.body.classList.remove(ENABLED_CLASS);
	}

	private unmountAll() {
		for (const [el, { root }] of this.roots) {
			root.unmount();
			el.parentElement?.removeClass(HAS_HEADER_CLASS);
			el.remove();
		}
		this.roots.clear();
	}

	/** Re-checks every open editor; call after a setting changes. */
	refresh() {
		const enabled = this.api.settings.inlineContext;
		activeDocument.body.classList.toggle(ENABLED_CLASS, enabled);
		if (!enabled) {
			this.unmountAll();
			return;
		}
		// Headers of closed tabs.
		for (const [el, { root }] of this.roots) {
			if (!el.isConnected) {
				root.unmount();
				this.roots.delete(el);
			}
		}
		this.plugin.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView) this.mountLive(leaf.view);
		});
	}

	/** Re-renders every header, e.g. after a setting that changes their layout. */
	rerender() {
		this.refresh();
		for (const [el, { path, readMode, onMount }] of this.roots) this.render(el, path, readMode, onMount);
	}

	private render(el: HTMLElement, path: string, readMode: boolean, onMount?: () => void) {
		const root = this.roots.get(el)?.root ?? createRoot(el);
		this.roots.set(el, { root, path, readMode, onMount });
		const header = <MarkdownHeaderView editable={!readMode} onMount={onMount}></MarkdownHeaderView>;
		root.render(
			<NoteProvider api={this.api} path={path} readMode={readMode}>
				{/* make.md's reading-view header sits in an extra wrapper div. */}
				{readMode ? <div>{header}</div> : header}
			</NoteProvider>,
		);
	}

	private mountLive(view: MarkdownView) {
		const file = view.file;
		const sizerEl = view.contentEl.querySelector<HTMLElement>(".cm-sizer");
		if (!sizerEl || !file) return;
		let inlineContext = sizerEl.querySelector<HTMLElement>(":scope > .mk-inline-context");
		if (!inlineContext) {
			inlineContext = createDiv({ cls: ["mk-inline-context", "embedded-backlinks"] });
			sizerEl.prepend(inlineContext);
		} else if (sizerEl.firstElementChild !== inlineContext) {
			sizerEl.prepend(inlineContext);
		}
		sizerEl.addClass(HAS_HEADER_CLASS);
		if (inlineContext.getAttribute("data-path") === file.path) return;
		inlineContext.setAttribute("data-path", file.path);
		const editor = view.editor as unknown as EditorWithCM;
		this.render(inlineContext, file.path, false, () => editor.cm?.requestMeasure());
	}

	/** make.md's reading-view hook: once a rendered section is attached, put the header at the
	    top of its reading view (embeds excluded). */
	private mountReading(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		if (!this.api.settings.inlineContext) return;
		window.setTimeout(() => {
			void (async () => {
				let counter = 0;
				while (!el.parentElement && counter++ <= 50) await sleep(50);
				if (!el.parentElement) return;
				let dom: HTMLElement = el;
				while (!dom.hasClass("markdown-reading-view") && !dom.hasClass("internal-embed") && dom.parentElement) {
					dom = dom.parentElement;
				}
				if (!dom.hasClass("markdown-reading-view")) return;
				const header = dom.querySelector<HTMLElement>(".mod-header");
				if (!header) return;
				let ctxElement = header.querySelector<HTMLElement>(".mk-inline-context");
				if (!ctxElement) {
					ctxElement = header.createDiv({ cls: "mk-inline-context" });
					header.prepend(ctxElement);
				}
				if (ctxElement.getAttribute("data-path") == ctx.sourcePath) return;
				ctxElement.setAttribute("data-path", ctx.sourcePath);
				this.render(ctxElement, ctx.sourcePath, true);
			})();
		});
	}
}
