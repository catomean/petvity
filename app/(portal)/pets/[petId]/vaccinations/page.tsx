import { auth } from "@/lib/auth";
import { getInstance } from "@/lib/db";
import { pets, vaccinations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDateShort, formatRelativeDate } from "@/lib/utils/format";

type Params = { params: Promise<{ petId: string }> };

const STATUS_CLASSES: Record<string, string> = {
  up_to_date: "signal-healthy",
  due_soon: "signal-watch",
  overdue: "signal-concern",
  not_applicable: "bg-[var(--off)] text-[var(--muted)] text-xs px-2 py-0.5 rounded-full",
};

const STATUS_LABELS: Record<string, string> = {
  up_to_date: "Up to date",
  due_soon: "Due soon",
  overdue: "Overdue",
  not_applicable: "N/A",
};

export default async function VaccinationsPage({ params }: Params) {
  const session = await auth();
  if (!session) return null;

  const { petId } = await params;
  const db = getInstance();

  const pet = await db.query.pets.findFirst({
    where: and(eq(pets.id, petId), eq(pets.ownerId, session.user.id)),
  });
  if (!pet) notFound();

  const rows = await db.query.vaccinations.findMany({
    where: eq(vaccinations.petId, petId),
    orderBy: (t, { desc }) => [desc(t.administeredDate)],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/portal/pets/${petId}`}
            className="text-sm text-[var(--muted)] hover:text-[var(--teal)] no-underline"
          >
            ← {pet.name}
          </Link>
          <h1 className="text-2xl font-semibold text-[var(--ink)] mt-1">
            Vaccinations
          </h1>
        </div>
      </div>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-[var(--muted)]">
            No vaccinations recorded yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--off)]">
              <tr>
                <th className="text-start py-3 px-4 text-xs font-medium text-[var(--muted)]">
                  Vaccine
                </th>
                <th className="text-start py-3 px-4 text-xs font-medium text-[var(--muted)]">
                  Given
                </th>
                <th className="text-start py-3 px-4 text-xs font-medium text-[var(--muted)]">
                  Next due
                </th>
                <th className="text-start py-3 px-4 text-xs font-medium text-[var(--muted)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr
                  key={v.id}
                  className="border-t border-[var(--border)]"
                >
                  <td className="py-3 px-4 font-medium text-[var(--ink)]">
                    {v.name}
                    {v.vetName && (
                      <div className="text-xs text-[var(--muted)] font-normal">
                        {v.vetName}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[var(--muted)]">
                    {formatDateShort(v.administeredDate)}
                  </td>
                  <td className="py-3 px-4 text-[var(--muted)]">
                    {v.nextDueDate ? (
                      <span title={formatDateShort(v.nextDueDate)}>
                        {formatRelativeDate(v.nextDueDate)}
                      </span>
                    ) : (
                      "–"
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={STATUS_CLASSES[v.status] ?? "signal-healthy"}>
                      {STATUS_LABELS[v.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
