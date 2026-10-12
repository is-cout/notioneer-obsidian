type InputEvents = {
	mousedown: MouseEvent;
	click: MouseEvent;
	contextmenu: MouseEvent;
	keydown: KeyboardEvent;
	keyup: KeyboardEvent;
};
/** Returning true stops the event reaching listeners registered before this one. */
type Listener<E> = (event: E) => boolean | void;

/** Window-level input bus shared by menus and modals, as in make.md: the most recently
    registered listener runs first and can claim the event (e.g. Escape closes only the
    topmost menu). */
export class InputManager {
	private listeners: { [K in keyof InputEvents]?: Listener<InputEvents[K]>[] } = {};

	constructor() {
		window.addEventListener("mousedown", this.handleMouse, true);
		window.addEventListener("click", this.handleMouse, true);
		window.addEventListener("contextmenu", this.handleMouse, true);
		window.addEventListener("keydown", this.handleKey);
		window.addEventListener("keyup", this.handleKey);
	}

	on<K extends keyof InputEvents>(name: K, listener: Listener<InputEvents[K]>) {
		const list = (this.listeners[name] ?? []) as Listener<InputEvents[K]>[];
		list.push(listener);
		(this.listeners as Record<K, Listener<InputEvents[K]>[]>)[name] = list;
	}

	off<K extends keyof InputEvents>(name: K, listener: Listener<InputEvents[K]>) {
		const list = this.listeners[name] as Listener<InputEvents[K]>[] | undefined;
		if (list) (this.listeners as Record<K, Listener<InputEvents[K]>[]>)[name] = list.filter((l) => l !== listener);
	}

	destroy() {
		window.removeEventListener("mousedown", this.handleMouse, true);
		window.removeEventListener("click", this.handleMouse, true);
		window.removeEventListener("contextmenu", this.handleMouse, true);
		window.removeEventListener("keydown", this.handleKey);
		window.removeEventListener("keyup", this.handleKey);
	}

	private emit<K extends keyof InputEvents>(name: K, event: InputEvents[K]) {
		const list = this.listeners[name] as Listener<InputEvents[K]>[] | undefined;
		if (!list) return;
		for (const listener of list.slice().reverse()) {
			if (listener(event)) return;
		}
	}

	private handleMouse = (event: MouseEvent) => {
		this.emit(event.type as "mousedown" | "click" | "contextmenu", event);
	};

	private handleKey = (event: KeyboardEvent) => {
		this.emit(event.type as "keydown" | "keyup", event);
	};
}
