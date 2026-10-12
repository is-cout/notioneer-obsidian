import React, { useState } from "react";
import { BannerView } from "./BannerView";
import { HeaderProperties } from "./HeaderProperties";
import { useNote } from "./NoteContext";
import { TitleComponent } from "./TitleComponent";

/** The note header: cover, title and property rows (make.md's `MarkdownHeaderView`). In
    reading view it is read-only and has no property rows. */
export const MarkdownHeaderView = (props: { editable: boolean; onMount?: () => void }) => {
	const { note, api } = useNote();
	const [repositionMode, setRepositionMode] = useState(false);
	React.useLayoutEffect(() => {
		props.onMount?.();
	}, []);
	return (
		note && (
			<div className="mk-path-context-component">
				<div className="mk-path-context-label">
					{api.settings.banners && (
						<BannerView reposition={repositionMode} setReposition={setRepositionMode}></BannerView>
					)}
					<TitleComponent readOnly={!props.editable}></TitleComponent>
				</div>
				{props.editable && api.settings.inlineContextProperties && <HeaderProperties></HeaderProperties>}
			</div>
		)
	);
};
