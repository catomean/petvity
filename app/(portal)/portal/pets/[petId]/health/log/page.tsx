import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { HEALTH_METRIC_CONFIG, getNormalRange } from "@/lib/config/health-metrics";
import type { SpeciesId } from "@/lib/config/species";
import { HealthLogForm } from "@/components/portal/HealthLogForm";

type Params = { params: Promise<{ petId: string }> };

export default async function LogHealthPage({ params }: Params) {
  const session = await auth();
  if (!session) return null;

  const { petId } = await params;
  const db = getInstance();

  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)),
  });
  if (!pet) notFound();

  const species = pet.species as SpeciesId;

  // Compute species-specific normal ranges in display units
  const weightRaw = getNormalRange("weight", species);
  const tempRaw = getNormalRange("temperature", species);
  const hrRaw = getNormalRange("heart_rate", species);

  const weightHint = {
    min: HEALTH_METRIC_CONFIG.weight.toDisplay(weightRaw.min),
    max: HEALTH_METRIC_CONFIG.weight.toDisplay(weightRaw.max),
    unit: "kg",
  };
  const tempHint = {
    min: HEALTH_METRIC_CONFIG.temperature.toDisplay(tempRaw.min),
    max: HEALTH_METRIC_CONFIG.temperature.toDisplay(tempRaw.max),
    unit: "°C",
  };
  const hrHint = {
    min: hrRaw.min,
    max: hrRaw.max,
    unit: "bpm",
  };

  return (
    <div className="max-w-lg">
      <Link
        href={`/portal/pets/${petId}/health`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline mb-5 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Health
      </Link>

      <h1 className="text-2xl font-bold text-[var(--ink)] mb-1">
        Log health check
      </h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        Track as many or as few metrics as you have data for today.
      </p>

      <HealthLogForm
        petId={petId}
        petName={pet.name}
        species={species}
        weightHint={weightHint}
        tempHint={tempHint}
        hrHint={hrHint}
      />
    </div>
  );
}
