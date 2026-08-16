// Print what each species' owner is actually asked each day.
import { register } from "node:module";
import { pathToFileURL } from "node:url";
register("data:text/javascript,export async function resolve(s,c,n){return n(s,c)}", pathToFileURL("./"));

const { SPECIES_CONFIG } = await import("./lib/config/species.ts");
const { dailyObservationsFor, observationsFor, redFlagsFor } = await import(
  "./lib/config/observations.ts"
);

for (const s of Object.keys(SPECIES_CONFIG)) {
  const daily = dailyObservationsFor(s);
  const all = observationsFor(s);
  const flags = redFlagsFor(s).filter((f) => f.urgency === "emergency");
  console.log(
    `\n${SPECIES_CONFIG[s].emoji} ${s.padEnd(11)} daily=${daily.length} total=${all.length} emergencies=${flags.length}`,
  );
  for (const d of daily) console.log(`    · ${d.question}`);
}
