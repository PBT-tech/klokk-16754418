import { useId } from "react";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

const selectClass =
  "h-11 rounded-md border border-border bg-card px-3 text-base text-card-foreground focus-visible:outline-2 focus-visible:outline-ring";

/** Split "HH:MM" (24-hour) into 12-hour parts. */
function parts(value: string): { hour: number; minute: string; pm: boolean } {
  const [h, m] = value.split(":");
  const h24 = Number.parseInt(h ?? "0", 10) || 0;
  return { hour: h24 % 12 || 12, minute: (m ?? "00").padStart(2, "0"), pm: h24 >= 12 };
}

function join(hour: number, minute: string, pm: boolean): string {
  const h24 = (hour % 12) + (pm ? 12 : 0);
  return `${String(h24).padStart(2, "0")}:${minute}`;
}

/**
 * Hour, minute and AM/PM dropdowns. Always shows AM/PM explicitly (browser time inputs switch
 * between 12 and 24-hour display depending on the visitor's settings). Value is "HH:MM" 24-hour.
 */
export function TimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const id = useId();
  const { hour, minute, pm } = parts(value);
  // keep an off-grid minute (e.g. from older data) selectable
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-semibold text-card-foreground">{label}</legend>
      <div className="flex items-center gap-1.5">
        <select
          aria-label={`${label} hour`}
          id={`${id}-h`}
          value={hour}
          onChange={(e) => onChange(join(Number(e.target.value), minute, pm))}
          className={selectClass}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="text-muted-foreground">
          :
        </span>
        <select
          aria-label={`${label} minutes`}
          value={minute}
          onChange={(e) => onChange(join(hour, e.target.value, pm))}
          className={selectClass}
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} AM or PM`}
          value={pm ? "PM" : "AM"}
          onChange={(e) => onChange(join(hour, minute, e.target.value === "PM"))}
          className={`${selectClass} font-semibold`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </fieldset>
  );
}
