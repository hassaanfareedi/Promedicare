import type { MedicationLine } from "@/schemas/clinical";
import { formatDate, formatDoctorName } from "@/lib/format";

type Props = {
  patientName: string;
  patientCode?: string | null;
  doctorName: string;
  diagnosis: string;
  prescription: string;
  medications: MedicationLine[];
  date: string;
  hospitalName?: string | null;
};

/** Screen + print-friendly prescription layout. */
export function PrescriptionPrintView({
  patientName,
  patientCode,
  doctorName,
  diagnosis,
  prescription,
  medications,
  date,
  hospitalName,
}: Props) {
  return (
    <div className="rx-print rounded-lg border bg-background p-6 text-foreground">
      <header className="border-b pb-4">
        <p className="font-heading text-xl font-semibold tracking-tight">
          {hospitalName ?? "ProMediCare AI"}
        </p>
        <p className="text-sm text-muted-foreground">Medical prescription</p>
      </header>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Patient</dt>
          <dd className="font-medium">{patientName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Patient ID</dt>
          <dd className="font-mono">{patientCode ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Doctor</dt>
          <dd className="font-medium">{formatDoctorName(doctorName)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Date</dt>
          <dd>{formatDate(date)}</dd>
        </div>
      </dl>

      <section className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Diagnosis
        </h3>
        <p className="mt-1 text-sm">{diagnosis}</p>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Rx</h3>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
          {medications.map((m, i) => (
            <li key={i}>
              <span className="font-medium">{m.name}</span>
              {[m.dose, m.frequency, m.duration].filter(Boolean).length > 0 && (
                <span className="text-muted-foreground">
                  {" — "}
                  {[m.dose, m.frequency, m.duration].filter(Boolean).join(" · ")}
                </span>
              )}
              {m.instructions && (
                <p className="text-muted-foreground">{m.instructions}</p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Instructions
        </h3>
        <p className="mt-1 whitespace-pre-wrap text-sm">{prescription}</p>
      </section>

      <footer className="mt-10 flex justify-between border-t pt-6 text-sm">
        <div>
          <p className="text-muted-foreground">Prescriber</p>
          <p className="mt-6 font-medium">{formatDoctorName(doctorName)}</p>
        </div>
        <p className="max-w-xs text-right text-xs text-muted-foreground">
          This prescription is issued via ProMediCare AI for clinical use. Verify with the
          attending physician if unclear.
        </p>
      </footer>
    </div>
  );
}
