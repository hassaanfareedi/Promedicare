import type { ParsedScreeningIntake } from "@/features/patient/intake-parser";

type Props = {
  intake: ParsedScreeningIntake;
};

export function ScreeningIntakeSummary({ intake }: Props) {
  const meta: string[] = [];
  if (typeof intake.durationDays === "number") meta.push(`${intake.durationDays} day(s)`);
  if (intake.severity) meta.push(intake.severity);
  if (typeof intake.age === "number") meta.push(`age ${intake.age}`);
  if (intake.sex) meta.push(intake.sex);

  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Patient intake
      </p>
      {intake.symptoms.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {intake.symptoms.map((s) => (
            <span
              key={s}
              className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs text-teal-800 dark:bg-teal-950/50 dark:text-teal-300"
            >
              {s}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-muted-foreground">No symptoms recorded.</p>
      )}
      {meta.length > 0 && (
        <p className="mt-2 capitalize text-muted-foreground">{meta.join(" · ")}</p>
      )}
      {intake.notes && (
        <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
          <span className="font-medium text-foreground">Notes: </span>
          {intake.notes}
        </p>
      )}
    </div>
  );
}
