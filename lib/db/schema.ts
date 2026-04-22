import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "pet_owner",
  "veterinarian",
  "pet_sitter",
  "admin",
]);

export const speciesEnum = pgEnum("species", [
  "dog",
  "cat",
  "horse",
  "bird",
  "rabbit",
  "guinea_pig",
  "hamster",
  "reptile",
  "fish",
  "other",
]);

export const sexEnum = pgEnum("sex", ["male", "female", "unknown"]);

export const healthRecordTypeEnum = pgEnum("health_record_type", [
  "vet_visit",
  "vaccination",
  "medication",
  "surgery",
  "lab_result",
  "dental",
  "grooming",
  "other",
]);

export const vaccinationStatusEnum = pgEnum("vaccination_status", [
  "up_to_date",
  "due_soon",
  "overdue",
  "not_applicable",
]);

export const medicationStatusEnum = pgEnum("medication_status", [
  "active",
  "completed",
  "discontinued",
]);

export const emailQueueStatusEnum = pgEnum("email_queue_status", [
  "pending",
  "sent",
  "failed",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

// ─── NextAuth tables ──────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  role: userRoleEnum("role").notNull().default("pet_owner"),
  /** Set when a vet or sitter is manually verified by admin (Phase 2). */
  verifiedAt: timestamp("verified_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ─── Owner profiles ───────────────────────────────────────────────────────────

export const ownerProfiles = pgTable("owner_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  phone: varchar("phone", { length: 50 }),
  city: varchar("city", { length: 100 }),
  /** ISO 3166-1 alpha-2 country code */
  country: varchar("country", { length: 2 }),
  timezone: varchar("timezone", { length: 60 }),
  bio: text("bio"),
  digestOptOut: boolean("digest_opt_out").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Pets ─────────────────────────────────────────────────────────────────────

export const pets = pgTable("pets", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  species: speciesEnum("species").notNull(),
  /** Validated against SPECIES_CONFIG[species].commonBreeds in the domain layer. */
  breed: varchar("breed", { length: 100 }),
  /** YYYY-MM-DD */
  birthDate: varchar("birth_date", { length: 10 }),
  sex: sexEnum("sex").notNull().default("unknown"),
  /** Weight stored as integer grams. 3500 = 3.5 kg. Display: divide by 1000. */
  weightGrams: integer("weight_grams"),
  bio: text("bio"),
  /** Vercel Blob URL */
  avatarUrl: text("avatar_url"),
  isPublic: boolean("is_public").notNull().default(false),
  /** @handle for public influencer profiles. Must be unique when set. */
  handle: varchar("handle", { length: 50 }).unique(),
  /** Cached signal from cron/health-alerts. Updated daily. */
  lastKnownSignal: varchar("last_known_signal", { length: 20 }),
  signalAlertSentAt: timestamp("signal_alert_sent_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Health metrics (daily KPI log) ───────────────────────────────────────────

export const healthMetrics = pgTable(
  "health_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    petId: uuid("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    /** YYYY-MM-DD — one row per pet per day */
    date: varchar("date", { length: 10 }).notNull(),
    /** Integer grams. Null = not recorded today. */
    weightGrams: integer("weight_grams"),
    /** Integer centidegrees (0.01°C). 3850 = 38.50°C. */
    temperatureCentidegrees: integer("temperature_centidegrees"),
    heartRateBpm: integer("heart_rate_bpm"),
    /** Emotional metrics: 1–5 integer scale */
    energy: integer("energy"),
    mood: integer("mood"),
    /** Inverted: 1 = calm (good), 5 = highly anxious (bad) */
    anxiety: integer("anxiety"),
    socialization: integer("socialization"),
    notes: text("notes"),
    loggedBy: uuid("logged_by").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("health_metrics_pet_date_idx").on(t.petId, t.date)],
);

// ─── Health records (vet visits, procedures) ──────────────────────────────────

export const healthRecords = pgTable("health_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  petId: uuid("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  type: healthRecordTypeEnum("type").notNull(),
  title: text("title").notNull(),
  /** YYYY-MM-DD */
  date: varchar("date", { length: 10 }).notNull(),
  vetName: varchar("vet_name", { length: 150 }),
  clinic: varchar("clinic", { length: 150 }),
  notes: text("notes"),
  /** Vercel Blob URL for lab PDFs, prescriptions, etc. */
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Vaccinations ─────────────────────────────────────────────────────────────

export const vaccinations = pgTable("vaccinations", {
  id: uuid("id").primaryKey().defaultRandom(),
  petId: uuid("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  /** YYYY-MM-DD */
  administeredDate: varchar("administered_date", { length: 10 }).notNull(),
  /** YYYY-MM-DD. Null = no booster required. */
  nextDueDate: varchar("next_due_date", { length: 10 }),
  status: vaccinationStatusEnum("status").notNull().default("up_to_date"),
  batchNumber: varchar("batch_number", { length: 100 }),
  vetName: varchar("vet_name", { length: 150 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Medications ──────────────────────────────────────────────────────────────

export const medications = pgTable("medications", {
  id: uuid("id").primaryKey().defaultRandom(),
  petId: uuid("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  dosage: varchar("dosage", { length: 100 }),
  frequency: varchar("frequency", { length: 100 }),
  /** YYYY-MM-DD */
  startDate: varchar("start_date", { length: 10 }).notNull(),
  /** YYYY-MM-DD. Null = ongoing. */
  endDate: varchar("end_date", { length: 10 }),
  prescribedBy: varchar("prescribed_by", { length: 150 }),
  status: medicationStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Email queue ──────────────────────────────────────────────────────────────

export const emailQueue = pgTable("email_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  templateKey: varchar("template_key", { length: 100 }).notNull(),
  sendAt: timestamp("send_at", { mode: "date" }).notNull(),
  sentAt: timestamp("sent_at", { mode: "date" }),
  status: emailQueueStatusEnum("status").notNull().default("pending"),
  /** Arbitrary data passed to the email template */
  payload: jsonb("payload").notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Veterinarian profiles ─────────────────────────────────────────────────

export const vetProfiles = pgTable("vet_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  specialty: varchar("specialty", { length: 200 }),
  clinicName: varchar("clinic_name", { length: 200 }),
  clinicAddress: text("clinic_address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 2 }),
  phone: varchar("phone", { length: 50 }),
  isAcceptingClients: boolean("is_accepting_clients").notNull().default(true),
  /** Set by admin after credential verification */
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Pet sitter profiles ────────────────────────────────────────────────────

export const sitterProfiles = pgTable("sitter_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  /** Comma-separated: boarding,daycare,walking,house_sitting,drop_in */
  services: text("services"),
  /** Daily rate in cents (e.g. 5000 = $50.00) */
  pricePerDay: integer("price_per_day"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 2 }),
  phone: varchar("phone", { length: 50 }),
  isAcceptingClients: boolean("is_accepting_clients").notNull().default(true),
  /** Set by admin after credential verification */
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Bookings ──────────────────────────────────────────────────────────────────

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** The pet owner making the booking */
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Pet being brought / cared for */
  petId: uuid("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  /** The vet or sitter being booked */
  professionalId: uuid("professional_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Whether this is a vet appointment or sitter booking */
  professionalRole: userRoleEnum("professional_role").notNull(),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }).notNull(),
  notes: text("notes"),
  status: bookingStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Reviews ───────────────────────────────────────────────────────────────────

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** One review per completed booking */
  bookingId: uuid("booking_id")
    .notNull()
    .unique()
    .references(() => bookings.id, { onDelete: "cascade" }),
  /** The pet owner who wrote the review */
  reviewerId: uuid("reviewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** The vet or sitter being reviewed */
  professionalId: uuid("professional_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** 1–5 star rating */
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
