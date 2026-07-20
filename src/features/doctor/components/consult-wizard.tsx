"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Printer } from "lucide-react";
import { completeConsultation } from "@/features/doctor/actions";
import { uploadMedicalAttachment } from "@/features/clinical/actions";
import type { MedicationLine } from "@/schemas/clinical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stepper } from "@/components/ui/stepper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrescriptionPrintView } from "@/features/clinical/components/prescription-print";

const STEPS = [
  { id: "notes", label: "Visit notes" },
  { id: "meds", label: "Medicines" },
  { id: "done", label: "Done" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientCode?: string | null;
  doctorName: string;
};

type MedRow = MedicationLine & { _key: string };

const emptyMed = (): MedRow => ({
  _key: crypto.randomUUID(),
  name: "",
  dose: "",
  frequency: "",
  duration: "",
  instructions: "",
});

export function ConsultWizard({
  open,
  onOpenChange,
  appointmentId,
  patientId,
  patientName,
  patientCode,
  doctorName,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [plan, setPlan] = useState("");
  const [prescription, setPrescription] = useState("");
  const [medications, setMedications] = useState<MedRow[]>([emptyMed()]);
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);

  function reset() {
    setStep(0);
    setSubjective("");
    setObjective("");
    setAssessment("");
    setDiagnosis("");
    setPlan("");
    setPrescription("");
    setMedications([emptyMed()]);
    setCompleted(false);
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!subjective.trim()) return "Add the patient's symptoms.";
      if (!objective.trim()) return "Add exam findings.";
      if (!assessment.trim()) return "Add your assessment.";
      if (!diagnosis.trim()) return "Add a diagnosis.";
      if (!plan.trim()) return "Add the treatment plan.";
    }
    if (step === 1) {
      if (!prescription.trim()) return "Add prescription instructions.";
      if (medications.filter((m) => m.name.trim()).length === 0) {
        return "Add at least one medication.";
      }
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    if (step === 1) {
      finish();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function finish() {
    startTransition(async () => {
      const res = await completeConsultation({
        appointmentId,
        subjective,
        objective,
        assessment,
        diagnosis,
        plan,
        prescription,
        medications: medications.filter((m) => m.name.trim()),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCompleted(true);
      setStep(2);
      toast.success("Consultation completed");
      router.refresh();
    });
  }

  async function onUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("appointmentId", appointmentId);
        fd.set("patientId", patientId);
        fd.set("kind", "lab");
        const res = await uploadMedicalAttachment(fd);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
      }
      toast.success("File uploaded");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !pending && !uploading) {
          onOpenChange(false);
          if (completed) reset();
        }
      }}
    >
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton
      >
        <div className="shrink-0 space-y-4 border-b px-4 pt-4 pb-3">
          <DialogHeader className="pr-8">
            <DialogTitle>Complete consultation — {patientName}</DialogTitle>
            <DialogDescription>Document the visit, then prescribe.</DialogDescription>
          </DialogHeader>
          <Stepper steps={STEPS} current={step} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {step === 0 && (
            <div className="space-y-4">
              <Field
                label="Symptoms"
                hint="What the patient reports (subjective)"
                value={subjective}
                onChange={setSubjective}
              />
              <Field
                label="Exam findings"
                hint="Vitals and exam (objective)"
                value={objective}
                onChange={setObjective}
              />
              <Field
                label="Assessment"
                hint="Your clinical impression"
                value={assessment}
                onChange={setAssessment}
              />
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Primary diagnosis"
                />
              </div>
              <Field
                label="Plan"
                hint="Follow-up, advice, and next steps"
                value={plan}
                onChange={setPlan}
              />
              <div className="space-y-2">
                <Label htmlFor="test-files">Test files (optional)</Label>
                <Input
                  id="test-files"
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  disabled={uploading || pending}
                  onChange={(e) => void onUpload(e.target.files)}
                />
                <p className="text-xs text-muted-foreground">PDF or images, up to 10 MB each.</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>Medications</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setMedications((m) => [...m, emptyMed()])}
                  >
                    <Plus className="size-4" aria-hidden /> Add
                  </Button>
                </div>
                {medications.map((med, i) => (
                  <div key={med._key} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-2">
                    <Input
                      placeholder="Medication"
                      aria-label={`Medication ${i + 1} name`}
                      value={med.name}
                      onChange={(e) =>
                        setMedications((rows) =>
                          rows.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)),
                        )
                      }
                    />
                    <Input
                      placeholder="Dose"
                      aria-label={`Medication ${i + 1} dose`}
                      value={med.dose ?? ""}
                      onChange={(e) =>
                        setMedications((rows) =>
                          rows.map((r, idx) => (idx === i ? { ...r, dose: e.target.value } : r)),
                        )
                      }
                    />
                    <Input
                      placeholder="Frequency"
                      aria-label={`Medication ${i + 1} frequency`}
                      value={med.frequency ?? ""}
                      onChange={(e) =>
                        setMedications((rows) =>
                          rows.map((r, idx) =>
                            idx === i ? { ...r, frequency: e.target.value } : r,
                          ),
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Duration"
                        aria-label={`Medication ${i + 1} duration`}
                        value={med.duration ?? ""}
                        onChange={(e) =>
                          setMedications((rows) =>
                            rows.map((r, idx) =>
                              idx === i ? { ...r, duration: e.target.value } : r,
                            ),
                          )
                        }
                      />
                      {medications.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Remove medication"
                          onClick={() =>
                            setMedications((rows) => rows.filter((_, idx) => idx !== i))
                          }
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Field
                label="Instructions"
                hint="How to take the medicines"
                value={prescription}
                onChange={setPrescription}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Visit completed. Print the prescription for the patient.
              </p>
              <PrescriptionPrintView
                patientName={patientName}
                patientCode={patientCode}
                doctorName={doctorName}
                diagnosis={diagnosis}
                prescription={prescription}
                medications={medications.filter((m) => m.name.trim())}
                date={new Date().toISOString()}
              />
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t sm:justify-between">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {step === 1 && (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setStep(0)}
              >
                Back
              </Button>
            )}
            {step === 0 && (
              <Button type="button" disabled={pending || uploading} onClick={next}>
                Next
              </Button>
            )}
            {step === 1 && (
              <Button type="button" disabled={pending} onClick={next}>
                {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Complete visit
              </Button>
            )}
            {step === 2 && (
              <>
                <Button type="button" variant="outline" onClick={() => window.print()}>
                  <Printer className="size-4" aria-hidden /> Print
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    reset();
                  }}
                >
                  Done
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <Textarea
        id={id}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
    </div>
  );
}
