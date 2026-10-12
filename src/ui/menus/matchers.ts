const escapeForRegExp = (string: string) => string.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");

export const matchAny = (string: string) => new RegExp(escapeForRegExp(string), "gi");

export const matchExact = (string: string) => new RegExp(`^${escapeForRegExp(string)}$`, "i");

/** Moves focus to a neighbour of `currentTarget` before it is removed from `scope`. */
export const focusNextElement = (scope: HTMLElement, currentTarget: EventTarget) => {
	const interactiveEls = Array.from(scope.querySelectorAll<HTMLElement>("a,button,input"));
	const currentEl = interactiveEls.findIndex((element) => element === currentTarget);
	const nextEl = interactiveEls[currentEl - 1] || interactiveEls[currentEl + 1];
	if (nextEl) nextEl.focus();
};
