import { format, parseISO } from "date-fns";

export type DateFormatSettings = { defaultDateFormat: string; defaultTimeFormat: string };

export const isValidDate = (d: unknown): d is Date => d instanceof Date && !isNaN(d.getTime());

export const isoDateFormat = `yyyy-MM-dd'T'HH:mm:ss`;

/** date-fns formatting with make.md's defaults: date format, plus time format when the
    date carries a time. Invalid formats give "". */
export const formatDate = (settings: DateFormatSettings, date: Date, dateFormat?: string | null) => {
	try {
		const hasTime = date.getHours() > 0 || date.getMinutes() > 0 || date.getSeconds() > 0;
		return format(
			date,
			dateFormat && dateFormat.length > 0
				? dateFormat
				: hasTime
					? `${settings.defaultDateFormat} ${settings.defaultTimeFormat}`
					: settings.defaultDateFormat,
		);
	} catch {
		return "";
	}
};

/** `yyyy-MM-dd` is read as a local date (parseISO would shift it to UTC); anything else
    goes through parseISO. */
export const parseDate = (str: unknown): Date | null => {
	if (!str) return null;
	if (typeof str === "number" && isFinite(str)) return new Date(str);
	if (typeof str === "string") {
		if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
			const [year, month, day] = str.split("-").map(Number);
			return new Date(year, month - 1, day);
		}
		return parseISO(str);
	}
	if (str instanceof Date) return str;
	return null;
};
