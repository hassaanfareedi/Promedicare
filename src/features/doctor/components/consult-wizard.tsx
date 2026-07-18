"use client";

import { useState, useTransition } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrescriptionPrintView } from "@/features/clinical/components/prescription-print";

const STEPS = [
  { id: "subjective", label: "Subjective" },
  { id: "objective", label: "Objective" },
  { id: "assessment", label: "Assessment" },
  { id: "plan", label: "Plan" },
  { id: "rx", label: "Prescription" },
  { id: "print", label: "Print" },
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

const emptyMed = (): MedicationLine => ({
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
  const [medications, setMedications] = useState<MedicationLine[]>([emptyMed()]);
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
    if (step === 0 && !subjective.trim()) return "Subjective notes are required.";
    if (step === 1 && !objective.trim()) return "Objective notes are required.";
    if (step === 2) {
      if (!assessment.trim()) return "Assessment is required.";
      if (!diagnosis.trim()) return "Diagnosis is required.";
    }
    if (step === 3 && !plan.trim()) return "Plan is required.";
    if (step === 4) {
      if (!prescription.trim()) return "Prescription instructions are required.";
      const named = medications.filter((m) => m.name.trim());
      if (named.length === 0) return "Add at least one medication.";
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    if (step === 4) {
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
      setStep(5);
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
        if (!v && !pending) {
          onOpenChange(false);
          if (completed) reset();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Complete consultation — {patientName}</DialogTitle>
        </DialogHeader>

        <Stepper steps={STEPS} current={step} className="mb-4" />

        {step === 0 && (
          <Field
            label="Subjective"
            hint="Patient-reported symptoms and history"
            value={subjective}
            onChange={setSubjective}
          />
        )}
        {step === 1 && (
          <Field
            label="Objective"
            hint="Exam findings and vitals"
            value={objective}
            onChange={setObjective}
          />
        )}
        {step === 2 && (
          <div className="space-y-4">
            <Field label="Assessment" value={assessment} onChange={setAssessment} />
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input
                id="diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Primary diagnosis"
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <Field label="Plan" value={plan} onChange={setPlan} />
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
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Medications</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setMedications((m) => [...m, emptyMed()])}
                >
                  <Plus className="size-4" /> Add
                </Button>
              </div>
              {medications.map((med, i) => (
                <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                  <Input
                    placeholder="Medication"
                    value={med.name}
                    onChange={(e) =>
                      setMedications((rows) =>
                        rows.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)),
                      )
                    }
                  />
                  <Input
                    placeholder="Dose"
                    value={med.dose ?? ""}
                    onChange={(e) =>
                      setMedications((rows) =>
                        rows.map((r, idx) => (idx === i ? { ...r, dose: e.target.value } : r)),
                      )
                    }
                  />
                  <Input
                    placeholder="Frequency"
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
                        onClick={() => setMedications((rows) => rows.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Field
              label="Instructions"
              hint="Additional prescription guidance"
              value={prescription}
              onChange={setPrescription}
            />
          </div>
        )}
        {step === 5 && (
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

        <DialogFooter className="gap-2 sm:gap-0">
          {step > 0 && step < 5 && (
            <Button type="button" variant="outline" disabled={pending} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < 4 && (
            <Button type="button" disabled={pending || uploading} onClick={next}>
              Next
            </Button>
          )}
          {step === 4 && (
            <Button type="button" disabled={pending} onClick={next}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Complete visit
            </Button>
          )}
          {step === 5 && (
            <>
              <Button type="button" variant="outline" onClick={() => window.print()}>
                <Printer className="size-4" /> Print
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
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <Textarea rows={5} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
