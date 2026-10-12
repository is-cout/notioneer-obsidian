import classNames from "classnames";
import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { ensureArray, ensureString } from "../../properties/parsers";
import i18n from "../i18n";
import { isPhone, windowFromDocument } from "../screen";
import { openCoverPicker } from "./BannerView";
import { useNote } from "./NoteContext";

const illegalRe = /[/?<>\\:*|":]/g;
// eslint-disable-next-line no-control-regex -- strips control characters from file names
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
const sanitizeFileName = (name: string) =>
	name.replace(illegalRe, "").replace(controlRe, "").replace(reservedRe, "").replace(windowsReservedRe, "");

const selectContents = (el: HTMLElement) => {
	const selection = window.getSelection();
	const range = activeDocument.createRange();
	range.selectNodeContents(el);
	selection?.removeAllRanges();
	selection?.addRange(range);
};

/** The editable title. Renames the file, or edits the first alias in alias mode (the "@"
    button). make.md's `TitleComponent`, without spaces and stickers. */
export const TitleComponent = (props: PropsWithChildren<{ readOnly: boolean }>) => {
	const { note, api } = useNote();
	const aliases = ensureArray(note?.property.aliases).map(ensureString);
	const [aliasMode, setAliasMode] = useState(api.settings.spacesUseAlias && aliases[0]?.length > 0);
	const name = useMemo(() => (note ? (aliasMode ? aliases[0] : note.name) : null), [note, aliasMode]);

	useEffect(() => {
		setAliasMode(api.settings.spacesUseAlias && aliases[0]?.length > 0);
	}, [note]);

	const ref = useRef<HTMLDivElement>(null);
	const contentEditable = !props.readOnly;

	const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
		if (!note) return;
		const newValue = e.target.innerText;
		if (newValue == name) return;
		if (aliasMode) {
			void api.updatePrimaryAlias(note.path, note.property.aliases, newValue);
			return;
		}
		const sanitizedName = sanitizeFileName(newValue);
		void api.renamePathByName(note.path, sanitizedName).then((newPath) => {
			if (newPath && sanitizedName != newValue) {
				void api.updatePrimaryAlias(newPath, note.property.aliases, newValue);
			}
		});
	};

	useEffect(() => {
		// New notes come in as "Untitled…": select the title so typing replaces it.
		if (ref.current?.innerText.startsWith("Untitled")) {
			ref.current.focus();
			selectContents(ref.current);
		}
	}, []);

	const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		e.stopPropagation();
		if (e.key == "a" && e.metaKey) {
			e.preventDefault();
			selectContents(e.currentTarget);
		}
		if (e.key == "Enter" || e.key == "Escape") {
			e.currentTarget.blur();
			e.preventDefault();
		}
	};

	const hasBanner = !!note?.property[api.settings.fmKeyBanner];
	const isMobile = isPhone();

	return (
		note && (
			<>
				{!isMobile && (
					<div className="mk-header-label-actions">
						{!hasBanner && (
							<button
								className="mk-inline-button"
								onClick={(e) => void openCoverPicker(api, note.path, windowFromDocument(e.view.document))}
							>
								<div
									className="mk-icon-xsmall"
									dangerouslySetInnerHTML={{ __html: api.ui.getSticker("ui//mk-make-image") }}
								></div>
								{i18n.buttons.addCover}
							</button>
						)}
						<span style={{ flex: 1 }}></span>
					</div>
				)}
				<div className="mk-title-container">
					<div
						ref={ref}
						className="mk-inline-title inline-title"
						contentEditable={contentEditable}
						onBlur={onBlur}
						onDrop={(e) => e.preventDefault()}
						onKeyDown={onKeyDown}
						onKeyUp={(e) => e.stopPropagation()}
						dangerouslySetInnerHTML={{ __html: name ?? "" }}
						data-ph={aliasMode ? i18n.hintText.alias : i18n.hintText.fileName}
					></div>
					{isMobile ? (
						<></>
					) : (
						<button
							className={classNames("mk-title-alias", aliasMode && "mk-active")}
							dangerouslySetInnerHTML={{ __html: api.ui.getSticker("ui//alias") }}
							aria-label={i18n.buttons.alias}
							onClick={() => setAliasMode(!aliasMode)}
						></button>
					)}
					{props.children}
				</div>
			</>
		)
	);
};
