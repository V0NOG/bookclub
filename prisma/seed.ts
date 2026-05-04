import { PrismaClient, ReadingStatus, ClubRole, PollStatus, ChallengeType } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Folio database...");

  // ── Achievements ────────────────────────────────────────────────────────────
  const achievements = await Promise.all([
    prisma.achievement.upsert({
      where: { key: "first_book" },
      update: {},
      create: { key: "first_book", title: "First Page Turner", description: "Finished your first book on Folio", icon: "BookOpen", points: 50 },
    }),
    prisma.achievement.upsert({
      where: { key: "week_streak" },
      update: {},
      create: { key: "week_streak", title: "7-Day Streak", description: "Read every day for 7 days", icon: "Flame", points: 75 },
    }),
    prisma.achievement.upsert({
      where: { key: "club_finisher" },
      update: {},
      create: { key: "club_finisher", title: "Club Finisher", description: "Completed a club reading challenge", icon: "Trophy", points: 100 },
    }),
    prisma.achievement.upsert({
      where: { key: "speed_reader" },
      update: {},
      create: { key: "speed_reader", title: "Speed Reader", description: "Finished a book in under 3 days", icon: "Zap", points: 80 },
    }),
    prisma.achievement.upsert({
      where: { key: "thoughtful_reviewer" },
      update: {},
      create: { key: "thoughtful_reviewer", title: "Thoughtful Reviewer", description: "Written 5 detailed reviews", icon: "PenLine", points: 60 },
    }),
    prisma.achievement.upsert({
      where: { key: "genre_explorer" },
      update: {},
      create: { key: "genre_explorer", title: "Genre Explorer", description: "Read books across 5 different genres", icon: "Compass", points: 70 },
    }),
    prisma.achievement.upsert({
      where: { key: "poll_participant" },
      update: {},
      create: { key: "poll_participant", title: "Poll Participant", description: "Voted in your first club poll", icon: "Vote", points: 20 },
    }),
    prisma.achievement.upsert({
      where: { key: "challenge_winner" },
      update: {},
      create: { key: "challenge_winner", title: "Challenge Winner", description: "Won a reading challenge", icon: "Medal", points: 150 },
    }),
  ]);

  // ── Taste Clusters ──────────────────────────────────────────────────────────
  await prisma.tasteCluster.upsert({
    where: { name: "epic_fantasy" },
    update: {},
    create: {
      name: "epic_fantasy",
      label: "Epic Fantasy Readers",
      description: "Loves sprawling worlds, complex magic systems, and multi-book sagas",
      genres: ["Fantasy", "Epic Fantasy", "High Fantasy"],
      themes: ["magic", "world-building", "prophecy", "war", "chosen one"],
      dimensions: { pace: [0.2, 0.6], worldbuilding: [0.7, 1.0], complexity: [0.6, 1.0] },
    },
  });
  await prisma.tasteCluster.upsert({
    where: { name: "dark_academia" },
    update: {},
    create: {
      name: "dark_academia",
      label: "Dark Academia Readers",
      description: "Drawn to elite institutions, forbidden knowledge, and gothic atmosphere",
      genres: ["Dark Academia", "Gothic", "Mystery", "Literary Fiction"],
      themes: ["academia", "secrets", "obsession", "power", "knowledge"],
      dimensions: { tone: [0.6, 1.0], complexity: [0.6, 1.0], discussionPotential: [0.7, 1.0] },
    },
  });
  await prisma.tasteCluster.upsert({
    where: { name: "cozy_romance" },
    update: {},
    create: {
      name: "cozy_romance",
      label: "Cozy Romance Readers",
      description: "Prefers warm, feel-good stories with satisfying romantic arcs",
      genres: ["Romance", "Contemporary Romance", "Cozy Fantasy"],
      themes: ["love", "community", "healing", "found family", "small town"],
      dimensions: { tone: [0.0, 0.4], romanceLevel: [0.6, 1.0], emotionalIntensity: [0.3, 0.7] },
    },
  });
  await prisma.tasteCluster.upsert({
    where: { name: "literary_fiction" },
    update: {},
    create: {
      name: "literary_fiction",
      label: "Literary Fiction Readers",
      description: "Values prose quality, character depth, and thematic complexity over plot",
      genres: ["Literary Fiction", "Contemporary Fiction", "Historical Fiction"],
      themes: ["identity", "grief", "memory", "society", "family"],
      dimensions: { focus: [0.7, 1.0], discussionPotential: [0.7, 1.0], pace: [0.0, 0.5] },
    },
  });
  await prisma.tasteCluster.upsert({
    where: { name: "thriller_reader" },
    update: {},
    create: {
      name: "thriller_reader",
      label: "Thriller & Mystery Readers",
      description: "Craves fast-paced plots, twists, and unputdownable page-turners",
      genres: ["Thriller", "Mystery", "Crime", "Suspense"],
      themes: ["crime", "deception", "investigation", "twists", "danger"],
      dimensions: { pace: [0.6, 1.0], tone: [0.4, 0.8], emotionalIntensity: [0.5, 0.9] },
    },
  });
  await prisma.tasteCluster.upsert({
    where: { name: "sci_fi_reader" },
    update: {},
    create: {
      name: "sci_fi_reader",
      label: "Science Fiction Readers",
      description: "Drawn to hard sci-fi, space opera, and speculative fiction grounded in real science",
      genres: ["Science Fiction", "Hard Sci-Fi", "Space Opera"],
      themes: ["space", "technology", "first contact", "future", "AI"],
      dimensions: { pace: [0.5, 1.0], worldbuilding: [0.6, 1.0], complexity: [0.5, 0.9] },
    },
  });
  await prisma.tasteCluster.upsert({
    where: { name: "ya_romantasy" },
    update: {},
    create: {
      name: "ya_romantasy",
      label: "YA & Romantasy Readers",
      description: "Loves YA fantasy with strong romantic arcs, fae courts, dragon riders, and morally complex love interests",
      genres: ["Young Adult", "Romantasy", "Fantasy", "Romance"],
      themes: ["enemies to lovers", "fae", "magic academy", "chosen one", "forbidden romance"],
      dimensions: { pace: [0.6, 1.0], romanceLevel: [0.7, 1.0], emotionalIntensity: [0.6, 0.9] },
    },
  });

  // ── Books ───────────────────────────────────────────────────────────────────
  const books = await Promise.all([
    createBook(prisma, {
      title: "The Name of the Wind",
      author: "Patrick Rothfuss",
      authors: ["Patrick Rothfuss"],
      cover: "https://covers.openlibrary.org/b/id/8369551-L.jpg",
      description: "The tale of Kvothe, a legendary figure known as a notorious troublemaker. His story begins where all good tales should begin — at the beginning.",
      publishedAt: new Date("2007-03-27"),
      pageCount: 662,
      genres: ["Fantasy", "Epic Fantasy"],
      tags: ["magic", "coming-of-age", "music", "revenge"],
      avgRating: 4.5,
      ratingsCount: 892341,
      dimensions: { pace: 0.3, tone: 0.5, focus: 0.85, emotionalIntensity: 0.6, romanceLevel: 0.2, complexity: 0.85, worldbuildingDepth: 0.9, discussionPotential: 0.85 },
    }),
    createBook(prisma, {
      title: "Six of Crows",
      author: "Leigh Bardugo",
      authors: ["Leigh Bardugo"],
      cover: "https://covers.openlibrary.org/b/id/8228691-L.jpg",
      description: "A convict with a plan to break into the world's most secure prison. A sharpshooter who can't walk away from a wager. A runaway with a privileged past.",
      publishedAt: new Date("2015-09-29"),
      pageCount: 465,
      genres: ["Fantasy", "Young Adult"],
      tags: ["heist", "dark", "ensemble cast", "crime"],
      avgRating: 4.4,
      ratingsCount: 673211,
      dimensions: { pace: 0.75, tone: 0.7, focus: 0.6, emotionalIntensity: 0.7, romanceLevel: 0.5, complexity: 0.7, worldbuildingDepth: 0.7, discussionPotential: 0.7 },
    }),
    createBook(prisma, {
      title: "The House in the Cerulean Sea",
      author: "TJ Klune",
      authors: ["TJ Klune"],
      cover: "https://covers.openlibrary.org/b/id/10521464-L.jpg",
      description: "A case worker at the Department in Charge of Magical Youth discovers the children he's been sent to supervise might save the world.",
      publishedAt: new Date("2020-03-17"),
      pageCount: 396,
      genres: ["Fantasy", "Cozy Fantasy", "Romance"],
      tags: ["cozy", "found family", "magical creatures", "slow romance"],
      avgRating: 4.3,
      ratingsCount: 341872,
      dimensions: { pace: 0.3, tone: 0.15, focus: 0.85, emotionalIntensity: 0.5, romanceLevel: 0.65, complexity: 0.3, worldbuildingDepth: 0.5, discussionPotential: 0.55 },
    }),
    createBook(prisma, {
      title: "A Little Life",
      author: "Hanya Yanagihara",
      authors: ["Hanya Yanagihara"],
      cover: "https://covers.openlibrary.org/b/id/8737138-L.jpg",
      description: "A shattering portrait of a chosen family and the limits of human endurance.",
      publishedAt: new Date("2015-03-10"),
      pageCount: 720,
      genres: ["Literary Fiction", "Contemporary Fiction"],
      tags: ["trauma", "friendship", "grief", "devastating"],
      avgRating: 4.3,
      ratingsCount: 412903,
      dimensions: { pace: 0.2, tone: 0.95, focus: 1.0, emotionalIntensity: 1.0, romanceLevel: 0.3, complexity: 0.75, worldbuildingDepth: 0.1, discussionPotential: 0.95 },
    }),
    createBook(prisma, {
      title: "The Seven Husbands of Evelyn Hugo",
      author: "Taylor Jenkins Reid",
      authors: ["Taylor Jenkins Reid"],
      cover: "https://covers.openlibrary.org/b/id/10437060-L.jpg",
      description: "A reclusive Hollywood actress finally agrees to tell her incredible, scandalous story to a young journalist.",
      publishedAt: new Date("2017-06-13"),
      pageCount: 389,
      genres: ["Historical Fiction", "Romance", "Contemporary Fiction"],
      tags: ["Hollywood", "bisexual", "scandal", "ambition"],
      avgRating: 4.5,
      ratingsCount: 1023411,
      dimensions: { pace: 0.55, tone: 0.5, focus: 0.9, emotionalIntensity: 0.8, romanceLevel: 0.75, complexity: 0.5, worldbuildingDepth: 0.1, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "Project Hail Mary",
      author: "Andy Weir",
      authors: ["Andy Weir"],
      cover: "https://covers.openlibrary.org/b/id/12008718-L.jpg",
      description: "A lone astronaut must save the earth from disaster. But first, he has to remember who he is.",
      publishedAt: new Date("2021-05-04"),
      pageCount: 476,
      genres: ["Science Fiction", "Adventure"],
      tags: ["science", "space", "first contact", "problem-solving"],
      avgRating: 4.5,
      ratingsCount: 587231,
      dimensions: { pace: 0.8, tone: 0.3, focus: 0.65, emotionalIntensity: 0.5, romanceLevel: 0.05, complexity: 0.7, worldbuildingDepth: 0.8, discussionPotential: 0.75 },
    }),
    createBook(prisma, {
      title: "The Midnight Library",
      author: "Matt Haig",
      authors: ["Matt Haig"],
      cover: "https://covers.openlibrary.org/b/id/10521463-L.jpg",
      description: "Between life and death there is a library, and within that library, the shelves go on forever.",
      publishedAt: new Date("2020-08-13"),
      pageCount: 304,
      genres: ["Contemporary Fiction", "Fantasy"],
      tags: ["regret", "choices", "mental health", "hope"],
      avgRating: 3.9,
      ratingsCount: 876543,
      dimensions: { pace: 0.45, tone: 0.4, focus: 0.8, emotionalIntensity: 0.7, romanceLevel: 0.2, complexity: 0.4, worldbuildingDepth: 0.3, discussionPotential: 0.7 },
    }),
    createBook(prisma, {
      title: "Pachinko",
      author: "Min Jin Lee",
      authors: ["Min Jin Lee"],
      cover: "https://covers.openlibrary.org/b/id/8371512-L.jpg",
      description: "A sweeping saga about a Korean family that begins with a forbidden love and follows its generations through Japan.",
      publishedAt: new Date("2017-02-07"),
      pageCount: 485,
      genres: ["Historical Fiction", "Literary Fiction"],
      tags: ["family saga", "immigration", "identity", "Korea", "Japan"],
      avgRating: 4.2,
      ratingsCount: 312088,
      dimensions: { pace: 0.2, tone: 0.7, focus: 0.85, emotionalIntensity: 0.8, romanceLevel: 0.4, complexity: 0.6, worldbuildingDepth: 0.2, discussionPotential: 0.9 },
    }),
    createBook(prisma, {
      title: "The Thursday Murder Club",
      author: "Richard Osman",
      authors: ["Richard Osman"],
      cover: "https://covers.openlibrary.org/b/id/10521465-L.jpg",
      description: "Four retirees in a peaceful retirement village challenge each other with cold cases — until a real murder turns up on their doorstep.",
      publishedAt: new Date("2020-09-03"),
      pageCount: 382,
      genres: ["Mystery", "Cozy Mystery", "Crime"],
      tags: ["humorous", "elderly protagonists", "cozy", "British"],
      avgRating: 4.0,
      ratingsCount: 298761,
      dimensions: { pace: 0.5, tone: 0.2, focus: 0.7, emotionalIntensity: 0.3, romanceLevel: 0.2, complexity: 0.4, worldbuildingDepth: 0.1, discussionPotential: 0.7 },
    }),
    createBook(prisma, {
      title: "Fourth Wing",
      author: "Rebecca Yarros",
      authors: ["Rebecca Yarros"],
      cover: "https://covers.openlibrary.org/b/id/12808718-L.jpg",
      description: "Twenty-year-old Violet Sorrengail was supposed to enter the Scribe Quadrant, until the commanding general — her mother — decides she should attend the brutal Riders Quadrant.",
      publishedAt: new Date("2023-05-02"),
      pageCount: 517,
      genres: ["Fantasy", "Romance", "Romantasy"],
      tags: ["dragons", "enemies to lovers", "war", "magic"],
      avgRating: 4.3,
      ratingsCount: 1231456,
      dimensions: { pace: 0.75, tone: 0.55, focus: 0.6, emotionalIntensity: 0.75, romanceLevel: 0.85, complexity: 0.5, worldbuildingDepth: 0.7, discussionPotential: 0.65 },
    }),
    createBook(prisma, {
      title: "Tomorrow, and Tomorrow, and Tomorrow",
      author: "Gabrielle Zevin",
      authors: ["Gabrielle Zevin"],
      cover: "https://covers.openlibrary.org/b/id/12808719-L.jpg",
      description: "A dazzling and immersive novel about three decades of friendship, art, grief, and love — through the lens of making video games.",
      publishedAt: new Date("2022-07-05"),
      pageCount: 403,
      genres: ["Literary Fiction", "Contemporary Fiction"],
      tags: ["friendship", "creativity", "video games", "grief", "art"],
      avgRating: 4.2,
      ratingsCount: 412876,
      dimensions: { pace: 0.4, tone: 0.5, focus: 0.9, emotionalIntensity: 0.75, romanceLevel: 0.3, complexity: 0.55, worldbuildingDepth: 0.1, discussionPotential: 0.85 },
    }),
    createBook(prisma, {
      title: "The Atlas Six",
      author: "Olivie Blake",
      authors: ["Olivie Blake"],
      cover: "https://covers.openlibrary.org/b/id/12008720-L.jpg",
      description: "Six of the world's most powerful magicians are invited to compete for a place in the Alexandrian Society, a secret society with access to lost knowledge.",
      publishedAt: new Date("2020-01-01"),
      pageCount: 448,
      genres: ["Dark Academia", "Fantasy"],
      tags: ["magic", "academia", "dark", "morally grey", "competition"],
      avgRating: 3.8,
      ratingsCount: 287631,
      dimensions: { pace: 0.5, tone: 0.8, focus: 0.7, emotionalIntensity: 0.7, romanceLevel: 0.3, complexity: 0.85, worldbuildingDepth: 0.6, discussionPotential: 0.9 },
    }),
    createBook(prisma, {
      title: "Beach Read",
      author: "Emily Henry",
      authors: ["Emily Henry"],
      cover: "https://covers.openlibrary.org/b/id/10521466-L.jpg",
      description: "A romance writer who no longer believes in love and a literary fiction writer in need of inspiration force themselves to swap genres for the summer.",
      publishedAt: new Date("2020-05-19"),
      pageCount: 352,
      genres: ["Romance", "Contemporary Romance"],
      tags: ["enemies to lovers", "summer", "writers", "beachy"],
      avgRating: 3.9,
      ratingsCount: 621873,
      dimensions: { pace: 0.6, tone: 0.2, focus: 0.85, emotionalIntensity: 0.5, romanceLevel: 0.9, complexity: 0.2, worldbuildingDepth: 0.0, discussionPotential: 0.5 },
    }),
    createBook(prisma, {
      title: "The Poppy War",
      author: "RF Kuang",
      authors: ["RF Kuang"],
      cover: "https://covers.openlibrary.org/b/id/8737139-L.jpg",
      description: "A young orphan girl wins a place at a prestigious military academy, where she discovers she possesses a mysterious power that could alter the course of history.",
      publishedAt: new Date("2018-05-01"),
      pageCount: 545,
      genres: ["Fantasy", "Grimdark", "Historical Fantasy"],
      tags: ["war", "dark", "colonialism", "opium", "China-inspired"],
      avgRating: 4.1,
      ratingsCount: 198761,
      dimensions: { pace: 0.6, tone: 0.95, focus: 0.65, emotionalIntensity: 0.95, romanceLevel: 0.15, complexity: 0.75, worldbuildingDepth: 0.8, discussionPotential: 0.85 },
    }),
    createBook(prisma, {
      title: "Mexican Gothic",
      author: "Silvia Moreno-Garcia",
      authors: ["Silvia Moreno-Garcia"],
      cover: "https://covers.openlibrary.org/b/id/10437061-L.jpg",
      description: "A socialite goes to rescue her cousin from a mysterious house in the Mexican countryside — and finds horrors older than she imagined.",
      publishedAt: new Date("2020-06-30"),
      pageCount: 301,
      genres: ["Gothic Horror", "Mystery", "Historical Fiction"],
      tags: ["gothic", "horror", "1950s Mexico", "fungi", "atmosphere"],
      avgRating: 4.0,
      ratingsCount: 234561,
      dimensions: { pace: 0.4, tone: 0.85, focus: 0.75, emotionalIntensity: 0.8, romanceLevel: 0.3, complexity: 0.6, worldbuildingDepth: 0.45, discussionPotential: 0.75 },
    }),
    createBook(prisma, {
      title: "Normal People",
      author: "Sally Rooney",
      authors: ["Sally Rooney"],
      cover: "https://covers.openlibrary.org/b/id/9282540-L.jpg",
      description: "Connell and Marianne grow up in the same small Irish town. When they meet again at university, their relationship transforms both their lives.",
      publishedAt: new Date("2018-08-30"),
      pageCount: 273,
      genres: ["Literary Fiction", "Contemporary Fiction", "Romance"],
      tags: ["relationships", "class", "Ireland", "university", "intimate"],
      avgRating: 3.8,
      ratingsCount: 821341,
      dimensions: { pace: 0.3, tone: 0.5, focus: 0.95, emotionalIntensity: 0.75, romanceLevel: 0.8, complexity: 0.45, worldbuildingDepth: 0.0, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "Piranesi",
      author: "Susanna Clarke",
      authors: ["Susanna Clarke"],
      cover: "https://covers.openlibrary.org/b/id/10521467-L.jpg",
      description: "Piranesi lives in a House, which is also the World. Its halls are lined with statues, its lower floors are flooded by the tides. Then he discovers another person is also trapped.",
      publishedAt: new Date("2020-09-15"),
      pageCount: 272,
      genres: ["Fantasy", "Mystery"],
      tags: ["unique", "atmosphere", "puzzle", "labyrinth", "literary"],
      avgRating: 4.2,
      ratingsCount: 298761,
      dimensions: { pace: 0.35, tone: 0.6, focus: 0.75, emotionalIntensity: 0.6, romanceLevel: 0.05, complexity: 0.75, worldbuildingDepth: 0.85, discussionPotential: 0.95 },
    }),
    createBook(prisma, {
      title: "The Priory of the Orange Tree",
      author: "Samantha Shannon",
      authors: ["Samantha Shannon"],
      cover: "https://covers.openlibrary.org/b/id/8737140-L.jpg",
      description: "An epic standalone fantasy about a world on the brink of a cataclysm, three women determined to protect it, and a wyrm bent on its destruction.",
      publishedAt: new Date("2019-02-26"),
      pageCount: 848,
      genres: ["Fantasy", "Epic Fantasy"],
      tags: ["dragons", "female protagonists", "politics", "queer", "standalone"],
      avgRating: 4.0,
      ratingsCount: 176543,
      dimensions: { pace: 0.3, tone: 0.5, focus: 0.75, emotionalIntensity: 0.6, romanceLevel: 0.4, complexity: 0.9, worldbuildingDepth: 1.0, discussionPotential: 0.75 },
    }),
    createBook(prisma, {
      title: "Iron Flame",
      author: "Rebecca Yarros",
      authors: ["Rebecca Yarros"],
      cover: "https://covers.openlibrary.org/b/id/12808720-L.jpg",
      description: "The highly anticipated sequel to Fourth Wing — Violet Sorrengail's next chapter in the Riders Quadrant.",
      publishedAt: new Date("2023-11-07"),
      pageCount: 623,
      genres: ["Fantasy", "Romance", "Romantasy"],
      tags: ["dragons", "war", "magic academy", "enemies to lovers"],
      avgRating: 4.0,
      ratingsCount: 876234,
      dimensions: { pace: 0.75, tone: 0.55, focus: 0.6, emotionalIntensity: 0.75, romanceLevel: 0.85, complexity: 0.5, worldbuildingDepth: 0.7, discussionPotential: 0.65 },
    }),
    // ── Science Fiction ─────────────────────────────────────────────────────
    createBook(prisma, {
      title: "Dune",
      author: "Frank Herbert",
      authors: ["Frank Herbert"],
      cover: "https://covers.openlibrary.org/b/id/8701898-L.jpg",
      description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides — heir to a noble family — and his journey toward a destiny greater than he could have imagined.",
      publishedAt: new Date("1965-08-01"),
      pageCount: 412,
      genres: ["Science Fiction", "Space Opera"],
      tags: ["epic", "politics", "religion", "ecology", "prophecy"],
      avgRating: 4.2,
      ratingsCount: 1243871,
      dimensions: { pace: 0.25, tone: 0.6, focus: 0.5, emotionalIntensity: 0.6, romanceLevel: 0.1, complexity: 0.95, worldbuildingDepth: 1.0, discussionPotential: 0.95 },
    }),
    createBook(prisma, {
      title: "The Hitchhiker's Guide to the Galaxy",
      author: "Douglas Adams",
      authors: ["Douglas Adams"],
      cover: "https://covers.openlibrary.org/b/id/8406786-L.jpg",
      description: "Seconds before Earth is demolished to make way for a hyperspace bypass, Arthur Dent is whisked into space by his friend Ford Prefect.",
      publishedAt: new Date("1979-10-12"),
      pageCount: 193,
      genres: ["Science Fiction", "Comedy"],
      tags: ["humour", "space", "absurdist", "British"],
      avgRating: 4.2,
      ratingsCount: 876234,
      dimensions: { pace: 0.8, tone: 0.05, focus: 0.5, emotionalIntensity: 0.2, romanceLevel: 0.05, complexity: 0.3, worldbuildingDepth: 0.5, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "The Martian",
      author: "Andy Weir",
      authors: ["Andy Weir"],
      cover: "https://covers.openlibrary.org/b/id/8406787-L.jpg",
      description: "An astronaut stranded on Mars must use science and ingenuity to survive while NASA scrambles to bring him home.",
      publishedAt: new Date("2011-02-11"),
      pageCount: 369,
      genres: ["Science Fiction", "Thriller"],
      tags: ["survival", "problem-solving", "humour", "space", "hard sci-fi"],
      avgRating: 4.4,
      ratingsCount: 987654,
      dimensions: { pace: 0.85, tone: 0.1, focus: 0.6, emotionalIntensity: 0.3, romanceLevel: 0.05, complexity: 0.6, worldbuildingDepth: 0.5, discussionPotential: 0.75 },
    }),
    createBook(prisma, {
      title: "Dark Matter",
      author: "Blake Crouch",
      authors: ["Blake Crouch"],
      cover: "https://covers.openlibrary.org/b/id/8406788-L.jpg",
      description: "A physicist is kidnapped and wakes in an alternate version of his life — and must find his way back to his family through a terrifying multiverse.",
      publishedAt: new Date("2016-07-26"),
      pageCount: 342,
      genres: ["Science Fiction", "Thriller"],
      tags: ["multiverse", "identity", "fast-paced", "twists"],
      avgRating: 4.1,
      ratingsCount: 512873,
      dimensions: { pace: 0.9, tone: 0.5, focus: 0.6, emotionalIntensity: 0.5, romanceLevel: 0.3, complexity: 0.65, worldbuildingDepth: 0.55, discussionPotential: 0.7 },
    }),
    createBook(prisma, {
      title: "Flowers for Algernon",
      author: "Daniel Keyes",
      authors: ["Daniel Keyes"],
      cover: "https://covers.openlibrary.org/b/id/8406789-L.jpg",
      description: "The story of Charlie Gordon, a man with an intellectual disability who undergoes an experimental procedure to dramatically increase his intelligence.",
      publishedAt: new Date("1966-03-01"),
      pageCount: 311,
      genres: ["Science Fiction", "Literary Fiction"],
      tags: ["intelligence", "identity", "heartbreaking", "classic"],
      avgRating: 4.2,
      ratingsCount: 432156,
      dimensions: { pace: 0.3, tone: 0.7, focus: 0.9, emotionalIntensity: 0.9, romanceLevel: 0.2, complexity: 0.5, worldbuildingDepth: 0.1, discussionPotential: 0.9 },
    }),
    createBook(prisma, {
      title: "Ender's Game",
      author: "Orson Scott Card",
      authors: ["Orson Scott Card"],
      cover: "https://covers.openlibrary.org/b/id/8406790-L.jpg",
      description: "A young prodigy is trained at a battle school in space to become the military commander who will save Earth from an alien invasion.",
      publishedAt: new Date("1985-01-15"),
      pageCount: 324,
      genres: ["Science Fiction", "Young Adult"],
      tags: ["strategy", "child protagonist", "military", "alien"],
      avgRating: 4.3,
      ratingsCount: 1123456,
      dimensions: { pace: 0.8, tone: 0.5, focus: 0.7, emotionalIntensity: 0.7, romanceLevel: 0.05, complexity: 0.6, worldbuildingDepth: 0.7, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "The Left Hand of Darkness",
      author: "Ursula K. Le Guin",
      authors: ["Ursula K. Le Guin"],
      cover: "https://covers.openlibrary.org/b/id/8406791-L.jpg",
      description: "A human envoy travels to the planet Gethen, whose inhabitants have no fixed sex, to convince them to join an interplanetary confederation.",
      publishedAt: new Date("1969-03-01"),
      pageCount: 286,
      genres: ["Science Fiction"],
      tags: ["gender", "politics", "anthropology", "literary sci-fi", "classic"],
      avgRating: 4.0,
      ratingsCount: 234567,
      dimensions: { pace: 0.2, tone: 0.5, focus: 0.8, emotionalIntensity: 0.7, romanceLevel: 0.2, complexity: 0.85, worldbuildingDepth: 0.9, discussionPotential: 0.95 },
    }),
    // ── Fantasy ─────────────────────────────────────────────────────────────
    createBook(prisma, {
      title: "Mistborn: The Final Empire",
      author: "Brandon Sanderson",
      authors: ["Brandon Sanderson"],
      cover: "https://covers.openlibrary.org/b/id/8406792-L.jpg",
      description: "A thief with unusual powers joins a rebellion against the immortal god-emperor who has ruled for a thousand years.",
      publishedAt: new Date("2006-07-17"),
      pageCount: 541,
      genres: ["Fantasy", "Epic Fantasy"],
      tags: ["magic system", "heist", "rebellion", "world-building"],
      avgRating: 4.4,
      ratingsCount: 876543,
      dimensions: { pace: 0.65, tone: 0.6, focus: 0.6, emotionalIntensity: 0.7, romanceLevel: 0.3, complexity: 0.8, worldbuildingDepth: 0.9, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "The Night Circus",
      author: "Erin Morgenstern",
      authors: ["Erin Morgenstern"],
      cover: "https://covers.openlibrary.org/b/id/8406793-L.jpg",
      description: "Two magicians are pitted against each other in a magical competition set within a mysterious black-and-white circus that only appears at night.",
      publishedAt: new Date("2011-09-13"),
      pageCount: 387,
      genres: ["Fantasy", "Historical Fiction"],
      tags: ["magic", "romance", "circus", "atmospheric", "literary fantasy"],
      avgRating: 4.0,
      ratingsCount: 543219,
      dimensions: { pace: 0.25, tone: 0.4, focus: 0.6, emotionalIntensity: 0.65, romanceLevel: 0.55, complexity: 0.55, worldbuildingDepth: 0.8, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "American Gods",
      author: "Neil Gaiman",
      authors: ["Neil Gaiman"],
      cover: "https://covers.openlibrary.org/b/id/8406794-L.jpg",
      description: "An ex-convict named Shadow is hired by the mysterious Mr. Wednesday and pulled into a war between old gods and new gods of modern America.",
      publishedAt: new Date("2001-06-19"),
      pageCount: 465,
      genres: ["Fantasy", "Mythology", "Literary Fiction"],
      tags: ["mythology", "road trip", "America", "dark", "gods"],
      avgRating: 4.1,
      ratingsCount: 654321,
      dimensions: { pace: 0.35, tone: 0.65, focus: 0.7, emotionalIntensity: 0.65, romanceLevel: 0.15, complexity: 0.8, worldbuildingDepth: 0.85, discussionPotential: 0.9 },
    }),
    createBook(prisma, {
      title: "Good Omens",
      author: "Terry Pratchett & Neil Gaiman",
      authors: ["Terry Pratchett", "Neil Gaiman"],
      cover: "https://covers.openlibrary.org/b/id/8406795-L.jpg",
      description: "An angel and a demon who have grown fond of Earth must work together to stop the Apocalypse — because they rather like life as it is.",
      publishedAt: new Date("1990-05-01"),
      pageCount: 383,
      genres: ["Fantasy", "Comedy"],
      tags: ["humour", "apocalypse", "angels", "demons", "British comedy"],
      avgRating: 4.3,
      ratingsCount: 567890,
      dimensions: { pace: 0.7, tone: 0.1, focus: 0.6, emotionalIntensity: 0.4, romanceLevel: 0.1, complexity: 0.5, worldbuildingDepth: 0.7, discussionPotential: 0.85 },
    }),
    createBook(prisma, {
      title: "A Court of Thorns and Roses",
      author: "Sarah J. Maas",
      authors: ["Sarah J. Maas"],
      cover: "https://covers.openlibrary.org/b/id/8406796-L.jpg",
      description: "A mortal huntress is taken to the magical land of faeries after she kills a wolf in the woods — and finds herself entangled in an ancient, deadly conflict.",
      publishedAt: new Date("2015-05-05"),
      pageCount: 419,
      genres: ["Fantasy", "Romance", "Romantasy"],
      tags: ["fae", "enemies to lovers", "magic", "adult romance"],
      avgRating: 4.1,
      ratingsCount: 1087654,
      dimensions: { pace: 0.7, tone: 0.5, focus: 0.65, emotionalIntensity: 0.75, romanceLevel: 0.9, complexity: 0.45, worldbuildingDepth: 0.6, discussionPotential: 0.65 },
    }),
    createBook(prisma, {
      title: "The Cruel Prince",
      author: "Holly Black",
      authors: ["Holly Black"],
      cover: "https://covers.openlibrary.org/b/id/8406797-L.jpg",
      description: "A mortal girl raised among fae courts must navigate treacherous faerie politics — and her growing feelings for the cruelest prince of all.",
      publishedAt: new Date("2018-01-02"),
      pageCount: 370,
      genres: ["Fantasy", "Young Adult", "Romantasy"],
      tags: ["fae", "enemies to lovers", "YA", "politics", "court intrigue"],
      avgRating: 4.2,
      ratingsCount: 743219,
      dimensions: { pace: 0.75, tone: 0.55, focus: 0.65, emotionalIntensity: 0.7, romanceLevel: 0.75, complexity: 0.5, worldbuildingDepth: 0.6, discussionPotential: 0.65 },
    }),
    createBook(prisma, {
      title: "Red Rising",
      author: "Pierce Brown",
      authors: ["Pierce Brown"],
      cover: "https://covers.openlibrary.org/b/id/8406798-L.jpg",
      description: "A low-caste miner on Mars infiltrates the ruling class to spark a revolution against an oppressive caste system inspired by Roman hierarchy.",
      publishedAt: new Date("2014-01-28"),
      pageCount: 382,
      genres: ["Science Fiction", "Dystopia"],
      tags: ["revolution", "caste system", "action", "Mars", "thriller"],
      avgRating: 4.3,
      ratingsCount: 567432,
      dimensions: { pace: 0.85, tone: 0.7, focus: 0.55, emotionalIntensity: 0.8, romanceLevel: 0.2, complexity: 0.6, worldbuildingDepth: 0.75, discussionPotential: 0.75 },
    }),
    createBook(prisma, {
      title: "Babel",
      author: "RF Kuang",
      authors: ["RF Kuang"],
      cover: "https://covers.openlibrary.org/b/id/8406799-L.jpg",
      description: "A historical fantasy set in 1830s Oxford about the magic of translation and colonialism's cost, centred on a cohort of scholars at the Royal Institute of Translation.",
      publishedAt: new Date("2022-08-23"),
      pageCount: 545,
      genres: ["Fantasy", "Historical Fantasy", "Dark Academia"],
      tags: ["colonialism", "translation", "dark academia", "Oxford", "revolution"],
      avgRating: 4.2,
      ratingsCount: 231456,
      dimensions: { pace: 0.3, tone: 0.75, focus: 0.7, emotionalIntensity: 0.85, romanceLevel: 0.2, complexity: 0.85, worldbuildingDepth: 0.7, discussionPotential: 0.95 },
    }),
    createBook(prisma, {
      title: "Never Let Me Go",
      author: "Kazuo Ishiguro",
      authors: ["Kazuo Ishiguro"],
      cover: "https://covers.openlibrary.org/b/id/8406800-L.jpg",
      description: "Three friends grow up at a seemingly idyllic English boarding school, with a dark secret hanging over their futures that they slowly come to understand.",
      publishedAt: new Date("2005-03-03"),
      pageCount: 288,
      genres: ["Literary Fiction", "Science Fiction"],
      tags: ["dystopia", "memory", "loss", "quiet devastation", "clones"],
      avgRating: 3.9,
      ratingsCount: 389012,
      dimensions: { pace: 0.2, tone: 0.75, focus: 0.9, emotionalIntensity: 0.9, romanceLevel: 0.3, complexity: 0.65, worldbuildingDepth: 0.5, discussionPotential: 0.95 },
    }),
    // ── Dystopia ─────────────────────────────────────────────────────────────
    createBook(prisma, {
      title: "1984",
      author: "George Orwell",
      authors: ["George Orwell"],
      cover: "https://covers.openlibrary.org/b/id/8406801-L.jpg",
      description: "In a totalitarian future society where Big Brother watches every move, Winston Smith secretly rebels against the Party — with devastating consequences.",
      publishedAt: new Date("1949-06-08"),
      pageCount: 328,
      genres: ["Dystopia", "Classic", "Literary Fiction"],
      tags: ["surveillance", "totalitarianism", "rebellion", "propaganda", "classic"],
      avgRating: 4.2,
      ratingsCount: 3456789,
      dimensions: { pace: 0.45, tone: 0.95, focus: 0.75, emotionalIntensity: 0.9, romanceLevel: 0.15, complexity: 0.7, worldbuildingDepth: 0.75, discussionPotential: 1.0 },
    }),
    createBook(prisma, {
      title: "The Handmaid's Tale",
      author: "Margaret Atwood",
      authors: ["Margaret Atwood"],
      cover: "https://covers.openlibrary.org/b/id/8406802-L.jpg",
      description: "In the theocratic Republic of Gilead, fertile women are forced into sexual servitude. Offred, a Handmaid, remembers her past life and plans for survival.",
      publishedAt: new Date("1985-04-17"),
      pageCount: 311,
      genres: ["Dystopia", "Literary Fiction", "Classic"],
      tags: ["feminism", "theocracy", "survival", "resistance", "classic"],
      avgRating: 4.1,
      ratingsCount: 1234567,
      dimensions: { pace: 0.35, tone: 0.9, focus: 0.8, emotionalIntensity: 0.9, romanceLevel: 0.25, complexity: 0.7, worldbuildingDepth: 0.75, discussionPotential: 1.0 },
    }),
    createBook(prisma, {
      title: "Brave New World",
      author: "Aldous Huxley",
      authors: ["Aldous Huxley"],
      cover: "https://covers.openlibrary.org/b/id/8406803-L.jpg",
      description: "In a utopian future where humans are engineered and conditioned for their roles, a Savage born outside civilisation becomes a disruptive outsider.",
      publishedAt: new Date("1932-01-01"),
      pageCount: 311,
      genres: ["Dystopia", "Classic", "Literary Fiction"],
      tags: ["consumerism", "conditioning", "identity", "pleasure", "classic"],
      avgRating: 4.0,
      ratingsCount: 987654,
      dimensions: { pace: 0.35, tone: 0.75, focus: 0.75, emotionalIntensity: 0.75, romanceLevel: 0.25, complexity: 0.8, worldbuildingDepth: 0.8, discussionPotential: 0.95 },
    }),
    // ── Thriller / Mystery / Crime ───────────────────────────────────────────
    createBook(prisma, {
      title: "Gone Girl",
      author: "Gillian Flynn",
      authors: ["Gillian Flynn"],
      cover: "https://covers.openlibrary.org/b/id/8406804-L.jpg",
      description: "On their fifth wedding anniversary, Nick Dunne reports his wife Amy missing. Her diary reveals a woman with a very different story about their marriage.",
      publishedAt: new Date("2012-06-05"),
      pageCount: 422,
      genres: ["Thriller", "Mystery", "Crime"],
      tags: ["unreliable narrator", "marriage", "twists", "dark", "psychological"],
      avgRating: 4.0,
      ratingsCount: 1456789,
      dimensions: { pace: 0.85, tone: 0.7, focus: 0.75, emotionalIntensity: 0.8, romanceLevel: 0.4, complexity: 0.65, worldbuildingDepth: 0.0, discussionPotential: 0.85 },
    }),
    createBook(prisma, {
      title: "The Silent Patient",
      author: "Alex Michaelides",
      authors: ["Alex Michaelides"],
      cover: "https://covers.openlibrary.org/b/id/8406805-L.jpg",
      description: "A famous painter shoots her husband five times — then never speaks another word. Her psychotherapist becomes obsessed with uncovering why.",
      publishedAt: new Date("2019-02-05"),
      pageCount: 336,
      genres: ["Thriller", "Mystery", "Crime"],
      tags: ["psychological thriller", "twist ending", "unreliable narrator"],
      avgRating: 4.0,
      ratingsCount: 1123456,
      dimensions: { pace: 0.9, tone: 0.65, focus: 0.7, emotionalIntensity: 0.75, romanceLevel: 0.2, complexity: 0.5, worldbuildingDepth: 0.0, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "In the Woods",
      author: "Tana French",
      authors: ["Tana French"],
      cover: "https://covers.openlibrary.org/b/id/8406806-L.jpg",
      description: "A Dublin detective investigating a child murder on the site where he survived a childhood trauma he cannot remember.",
      publishedAt: new Date("2007-05-17"),
      pageCount: 429,
      genres: ["Thriller", "Mystery", "Crime"],
      tags: ["detective", "Ireland", "psychological", "childhood trauma"],
      avgRating: 4.0,
      ratingsCount: 312456,
      dimensions: { pace: 0.55, tone: 0.7, focus: 0.8, emotionalIntensity: 0.75, romanceLevel: 0.2, complexity: 0.65, worldbuildingDepth: 0.1, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "And Then There Were None",
      author: "Agatha Christie",
      authors: ["Agatha Christie"],
      cover: "https://covers.openlibrary.org/b/id/8406807-L.jpg",
      description: "Ten strangers are lured to an isolated island. One by one they are murdered according to the verses of a children's rhyme.",
      publishedAt: new Date("1939-11-06"),
      pageCount: 264,
      genres: ["Mystery", "Crime", "Classic"],
      tags: ["isolated setting", "classic mystery", "whodunit", "island"],
      avgRating: 4.3,
      ratingsCount: 876543,
      dimensions: { pace: 0.8, tone: 0.6, focus: 0.65, emotionalIntensity: 0.7, romanceLevel: 0.05, complexity: 0.5, worldbuildingDepth: 0.05, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "Sharp Objects",
      author: "Gillian Flynn",
      authors: ["Gillian Flynn"],
      cover: "https://covers.openlibrary.org/b/id/8406808-L.jpg",
      description: "A journalist returns to her small hometown to cover the murders of two young girls — and uncovers dark family secrets that disturb her deeply.",
      publishedAt: new Date("2006-09-26"),
      pageCount: 254,
      genres: ["Thriller", "Mystery", "Crime"],
      tags: ["family trauma", "dark", "small town", "psychological"],
      avgRating: 3.9,
      ratingsCount: 567432,
      dimensions: { pace: 0.7, tone: 0.8, focus: 0.8, emotionalIntensity: 0.85, romanceLevel: 0.15, complexity: 0.6, worldbuildingDepth: 0.0, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "Rebecca",
      author: "Daphne du Maurier",
      authors: ["Daphne du Maurier"],
      cover: "https://covers.openlibrary.org/b/id/8406809-L.jpg",
      description: "A young woman marries a wealthy widower and goes to live at his magnificent estate Manderley — but the memory of his first wife Rebecca haunts every room.",
      publishedAt: new Date("1938-08-05"),
      pageCount: 449,
      genres: ["Gothic", "Mystery", "Classic"],
      tags: ["gothic", "haunting", "jealousy", "class", "classic"],
      avgRating: 4.2,
      ratingsCount: 432198,
      dimensions: { pace: 0.45, tone: 0.8, focus: 0.85, emotionalIntensity: 0.8, romanceLevel: 0.5, complexity: 0.6, worldbuildingDepth: 0.2, discussionPotential: 0.85 },
    }),
    // ── Literary Fiction ─────────────────────────────────────────────────────
    createBook(prisma, {
      title: "Klara and the Sun",
      author: "Kazuo Ishiguro",
      authors: ["Kazuo Ishiguro"],
      cover: "https://covers.openlibrary.org/b/id/8406810-L.jpg",
      description: "An Artificial Friend observes human behaviour from a shop window — and begins to understand loneliness, sacrifice, and what it means to love.",
      publishedAt: new Date("2021-03-02"),
      pageCount: 307,
      genres: ["Literary Fiction", "Science Fiction"],
      tags: ["AI", "love", "sacrifice", "quiet", "observation"],
      avgRating: 3.9,
      ratingsCount: 245678,
      dimensions: { pace: 0.25, tone: 0.5, focus: 0.9, emotionalIntensity: 0.8, romanceLevel: 0.1, complexity: 0.75, worldbuildingDepth: 0.6, discussionPotential: 0.95 },
    }),
    createBook(prisma, {
      title: "Where the Crawdads Sing",
      author: "Delia Owens",
      authors: ["Delia Owens"],
      cover: "https://covers.openlibrary.org/b/id/10437062-L.jpg",
      description: "A young girl abandoned in the North Carolina marshes raises herself while being suspected of a local murder she may or may not have committed.",
      publishedAt: new Date("2018-08-14"),
      pageCount: 368,
      genres: ["Literary Fiction", "Mystery"],
      tags: ["nature", "isolation", "coming-of-age", "Southern Gothic"],
      avgRating: 4.4,
      ratingsCount: 2345678,
      dimensions: { pace: 0.4, tone: 0.5, focus: 0.75, emotionalIntensity: 0.75, romanceLevel: 0.5, complexity: 0.4, worldbuildingDepth: 0.2, discussionPotential: 0.75 },
    }),
    createBook(prisma, {
      title: "Lessons in Chemistry",
      author: "Bonnie Garmus",
      authors: ["Bonnie Garmus"],
      cover: "https://covers.openlibrary.org/b/id/12808721-L.jpg",
      description: "A scientist-turned-TV-cooking-host in the 1960s teaches women to think for themselves through the radical act of explaining chemistry.",
      publishedAt: new Date("2022-04-05"),
      pageCount: 390,
      genres: ["Literary Fiction", "Historical Fiction"],
      tags: ["feminism", "1960s", "science", "witty", "inspiring"],
      avgRating: 4.3,
      ratingsCount: 876543,
      dimensions: { pace: 0.55, tone: 0.3, focus: 0.85, emotionalIntensity: 0.65, romanceLevel: 0.4, complexity: 0.35, worldbuildingDepth: 0.0, discussionPotential: 0.8 },
    }),
    createBook(prisma, {
      title: "The Kite Runner",
      author: "Khaled Hosseini",
      authors: ["Khaled Hosseini"],
      cover: "https://covers.openlibrary.org/b/id/8371513-L.jpg",
      description: "A wealthy boy and his servant's son forge an unlikely friendship in pre-Taliban Afghanistan, torn apart by a single act of betrayal.",
      publishedAt: new Date("2003-05-29"),
      pageCount: 372,
      genres: ["Literary Fiction", "Historical Fiction"],
      tags: ["Afghanistan", "guilt", "redemption", "friendship", "war"],
      avgRating: 4.3,
      ratingsCount: 1876543,
      dimensions: { pace: 0.45, tone: 0.75, focus: 0.85, emotionalIntensity: 0.9, romanceLevel: 0.2, complexity: 0.5, worldbuildingDepth: 0.15, discussionPotential: 0.9 },
    }),
    createBook(prisma, {
      title: "The Bell Jar",
      author: "Sylvia Plath",
      authors: ["Sylvia Plath"],
      cover: "https://covers.openlibrary.org/b/id/8406811-L.jpg",
      description: "Semi-autobiographical novel following Esther Greenwood, a bright young woman descending into mental illness while interning at a New York magazine.",
      publishedAt: new Date("1963-01-14"),
      pageCount: 244,
      genres: ["Literary Fiction", "Classic"],
      tags: ["mental health", "feminism", "identity", "1950s", "autobiographical"],
      avgRating: 4.0,
      ratingsCount: 765432,
      dimensions: { pace: 0.35, tone: 0.8, focus: 0.95, emotionalIntensity: 0.9, romanceLevel: 0.15, complexity: 0.55, worldbuildingDepth: 0.0, discussionPotential: 0.9 },
    }),
    createBook(prisma, {
      title: "All the Light We Cannot See",
      author: "Anthony Doerr",
      authors: ["Anthony Doerr"],
      cover: "https://covers.openlibrary.org/b/id/8406812-L.jpg",
      description: "A blind French girl and a German boy's paths converge in occupied France during World War II, bound by a legendary diamond.",
      publishedAt: new Date("2014-05-06"),
      pageCount: 531,
      genres: ["Historical Fiction", "Literary Fiction"],
      tags: ["WWII", "France", "dual narrative", "beauty", "war"],
      avgRating: 4.3,
      ratingsCount: 1234567,
      dimensions: { pace: 0.35, tone: 0.65, focus: 0.8, emotionalIntensity: 0.85, romanceLevel: 0.25, complexity: 0.55, worldbuildingDepth: 0.2, discussionPotential: 0.85 },
    }),
    createBook(prisma, {
      title: "Beloved",
      author: "Toni Morrison",
      authors: ["Toni Morrison"],
      cover: "https://covers.openlibrary.org/b/id/8406813-L.jpg",
      description: "A former enslaved woman's home is haunted by a malevolent ghost — the physical embodiment of her murdered daughter — in post-Civil War Ohio.",
      publishedAt: new Date("1987-09-02"),
      pageCount: 321,
      genres: ["Literary Fiction", "Historical Fiction", "Classic"],
      tags: ["slavery", "trauma", "haunting", "motherhood", "Pulitzer Prize"],
      avgRating: 4.1,
      ratingsCount: 432987,
      dimensions: { pace: 0.2, tone: 0.85, focus: 0.9, emotionalIntensity: 0.95, romanceLevel: 0.15, complexity: 0.8, worldbuildingDepth: 0.1, discussionPotential: 0.95 },
    }),
    createBook(prisma, {
      title: "A Man Called Ove",
      author: "Fredrik Backman",
      authors: ["Fredrik Backman"],
      cover: "https://covers.openlibrary.org/b/id/8406814-L.jpg",
      description: "A curmudgeonly man with strict principles and a short fuse is about to end his life when his new neighbours — a pregnant woman, her clumsy husband, and two daughters — derail his plans.",
      publishedAt: new Date("2012-08-27"),
      pageCount: 337,
      genres: ["Literary Fiction", "Contemporary Fiction"],
      tags: ["grief", "community", "heartwarming", "Swedish", "neighbours"],
      avgRating: 4.4,
      ratingsCount: 987654,
      dimensions: { pace: 0.45, tone: 0.3, focus: 0.85, emotionalIntensity: 0.75, romanceLevel: 0.25, complexity: 0.3, worldbuildingDepth: 0.0, discussionPotential: 0.7 },
    }),
    createBook(prisma, {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      authors: ["Jane Austen"],
      cover: "https://covers.openlibrary.org/b/id/8406815-L.jpg",
      description: "Elizabeth Bennet navigates questions of marriage, morality, and independence in early 19th-century England — alongside the proud and seemingly disagreeable Mr. Darcy.",
      publishedAt: new Date("1813-01-28"),
      pageCount: 432,
      genres: ["Classic", "Romance", "Literary Fiction"],
      tags: ["regency", "wit", "marriage", "social satire", "classic"],
      avgRating: 4.3,
      ratingsCount: 3456789,
      dimensions: { pace: 0.3, tone: 0.2, focus: 0.9, emotionalIntensity: 0.6, romanceLevel: 0.8, complexity: 0.55, worldbuildingDepth: 0.05, discussionPotential: 0.9 },
    }),
    createBook(prisma, {
      title: "Yellowface",
      author: "RF Kuang",
      authors: ["RF Kuang"],
      cover: "https://covers.openlibrary.org/b/id/12808722-L.jpg",
      description: "After her Chinese-American author friend dies in a freak accident, June steals her unpublished manuscript — and publishes it as her own.",
      publishedAt: new Date("2023-05-16"),
      pageCount: 322,
      genres: ["Literary Fiction", "Thriller"],
      tags: ["publishing industry", "race", "cancel culture", "satire"],
      avgRating: 4.0,
      ratingsCount: 198765,
      dimensions: { pace: 0.75, tone: 0.6, focus: 0.8, emotionalIntensity: 0.75, romanceLevel: 0.15, complexity: 0.6, worldbuildingDepth: 0.0, discussionPotential: 0.9 },
    }),
    createBook(prisma, {
      title: "One Hundred Years of Solitude",
      author: "Gabriel García Márquez",
      authors: ["Gabriel García Márquez"],
      cover: "https://covers.openlibrary.org/b/id/8406816-L.jpg",
      description: "The multigenerational saga of the Buendía family in the fictional town of Macondo — a landmark of magical realism and world literature.",
      publishedAt: new Date("1967-05-30"),
      pageCount: 417,
      genres: ["Literary Fiction", "Magical Realism", "Classic"],
      tags: ["magical realism", "family saga", "Latin America", "Nobel Prize"],
      avgRating: 4.1,
      ratingsCount: 876543,
      dimensions: { pace: 0.15, tone: 0.5, focus: 0.7, emotionalIntensity: 0.7, romanceLevel: 0.3, complexity: 0.9, worldbuildingDepth: 0.4, discussionPotential: 0.95 },
    }),
    createBook(prisma, {
      title: "The Road",
      author: "Cormac McCarthy",
      authors: ["Cormac McCarthy"],
      cover: "https://covers.openlibrary.org/b/id/8406817-L.jpg",
      description: "A father and his young son walk alone through post-apocalyptic America, struggling to survive and maintain their humanity.",
      publishedAt: new Date("2006-09-26"),
      pageCount: 287,
      genres: ["Literary Fiction", "Dystopia"],
      tags: ["post-apocalyptic", "survival", "father-son", "bleak", "Pulitzer Prize"],
      avgRating: 4.0,
      ratingsCount: 654321,
      dimensions: { pace: 0.3, tone: 1.0, focus: 0.9, emotionalIntensity: 1.0, romanceLevel: 0.0, complexity: 0.6, worldbuildingDepth: 0.3, discussionPotential: 0.9 },
    }),
    // ── Romance / Contemporary ───────────────────────────────────────────────
    createBook(prisma, {
      title: "People We Meet on Vacation",
      author: "Emily Henry",
      authors: ["Emily Henry"],
      cover: "https://covers.openlibrary.org/b/id/10521468-L.jpg",
      description: "Two best friends spend their summers together — until one trip ruins everything. Years later, Alex convinces her estranged best friend to take one last trip.",
      publishedAt: new Date("2021-05-11"),
      pageCount: 384,
      genres: ["Romance", "Contemporary Romance"],
      tags: ["best friends to lovers", "summer", "travel", "will they won't they"],
      avgRating: 4.1,
      ratingsCount: 876543,
      dimensions: { pace: 0.65, tone: 0.15, focus: 0.85, emotionalIntensity: 0.6, romanceLevel: 0.9, complexity: 0.2, worldbuildingDepth: 0.0, discussionPotential: 0.6 },
    }),
    createBook(prisma, {
      title: "It Ends with Us",
      author: "Colleen Hoover",
      authors: ["Colleen Hoover"],
      cover: "https://covers.openlibrary.org/b/id/12808723-L.jpg",
      description: "A girl who survived an abusive childhood falls in love with a charming neurosurgeon — and must confront a cycle she recognises but never expected to face herself.",
      publishedAt: new Date("2016-08-02"),
      pageCount: 385,
      genres: ["Romance", "Contemporary Fiction"],
      tags: ["domestic abuse", "emotional", "difficult topics", "contemporary"],
      avgRating: 4.4,
      ratingsCount: 2345678,
      dimensions: { pace: 0.6, tone: 0.5, focus: 0.85, emotionalIntensity: 0.9, romanceLevel: 0.75, complexity: 0.25, worldbuildingDepth: 0.0, discussionPotential: 0.7 },
    }),
    createBook(prisma, {
      title: "The Love Hypothesis",
      author: "Ali Hazelwood",
      authors: ["Ali Hazelwood"],
      cover: "https://covers.openlibrary.org/b/id/12808724-L.jpg",
      description: "A STEM PhD student agrees to fake-date a brilliant but intimidating professor to convince her best friend she's over her ex — and things get complicated.",
      publishedAt: new Date("2021-09-14"),
      pageCount: 395,
      genres: ["Romance", "Contemporary Romance"],
      tags: ["fake dating", "academia", "STEM", "enemies to lovers"],
      avgRating: 3.9,
      ratingsCount: 654321,
      dimensions: { pace: 0.65, tone: 0.15, focus: 0.85, emotionalIntensity: 0.55, romanceLevel: 0.9, complexity: 0.2, worldbuildingDepth: 0.0, discussionPotential: 0.55 },
    }),
    // ── Non-Fiction ──────────────────────────────────────────────────────────
    createBook(prisma, {
      title: "Educated",
      author: "Tara Westover",
      authors: ["Tara Westover"],
      cover: "https://covers.openlibrary.org/b/id/8406818-L.jpg",
      description: "A memoir about a woman who grows up in a survivalist family in rural Idaho and never attends school — until she educates herself into Cambridge and Harvard.",
      publishedAt: new Date("2018-02-20"),
      pageCount: 352,
      genres: ["Non-Fiction", "Memoir"],
      tags: ["memoir", "education", "family", "abuse", "self-determination"],
      avgRating: 4.5,
      ratingsCount: 1456789,
      dimensions: { pace: 0.55, tone: 0.6, focus: 0.9, emotionalIntensity: 0.85, romanceLevel: 0.1, complexity: 0.5, worldbuildingDepth: 0.0, discussionPotential: 0.9 },
    }),
    createBook(prisma, {
      title: "Sapiens: A Brief History of Humankind",
      author: "Yuval Noah Harari",
      authors: ["Yuval Noah Harari"],
      cover: "https://covers.openlibrary.org/b/id/8406819-L.jpg",
      description: "A sweeping account of the history of our species, from the emergence of Homo sapiens in Africa to the present day's political and technological revolutions.",
      publishedAt: new Date("2011-01-01"),
      pageCount: 443,
      genres: ["Non-Fiction", "History"],
      tags: ["history", "anthropology", "big ideas", "humanity"],
      avgRating: 4.4,
      ratingsCount: 2345678,
      dimensions: { pace: 0.45, tone: 0.3, focus: 0.6, emotionalIntensity: 0.4, romanceLevel: 0.0, complexity: 0.7, worldbuildingDepth: 0.0, discussionPotential: 0.9 },
    }),
    createBook(prisma, {
      title: "When Breath Becomes Air",
      author: "Paul Kalanithi",
      authors: ["Paul Kalanithi"],
      cover: "https://covers.openlibrary.org/b/id/8406820-L.jpg",
      description: "A neurosurgeon diagnosed with terminal cancer writes about the meaning of a life well-lived in the face of death.",
      publishedAt: new Date("2016-01-12"),
      pageCount: 228,
      genres: ["Non-Fiction", "Memoir"],
      tags: ["death", "medicine", "meaning", "memoir", "heartbreaking"],
      avgRating: 4.4,
      ratingsCount: 876543,
      dimensions: { pace: 0.4, tone: 0.6, focus: 0.9, emotionalIntensity: 0.9, romanceLevel: 0.2, complexity: 0.4, worldbuildingDepth: 0.0, discussionPotential: 0.9 },
    }),
  ]);

  // ── Users ───────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("password123", 10);

  const sarah = await upsertUser(prisma, {
    email: "sarah@folio.dev",
    name: "Sarah Chen",
    username: "sarahreads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bio: "Fantasy and dark academia obsessed. Book club organiser.",
    location: "London, UK",
    userType: "ORGANISER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const marcus = await upsertUser(prisma, {
    email: "marcus@folio.dev",
    name: "Marcus Williams",
    username: "marcusreads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
    bio: "Literary fiction devotee. I read to understand the world.",
    location: "New York, USA",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const luna = await upsertUser(prisma, {
    email: "luna@folio.dev",
    name: "Luna Park",
    username: "lunapark_reads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=luna",
    bio: "Dark academia aesthetic. Mystery obsessed. Night reader.",
    location: "Seoul, South Korea",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const james = await upsertUser(prisma, {
    email: "james@folio.dev",
    name: "James Okafor",
    username: "jamesokafor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
    bio: "Sci-fi and thriller enthusiast. Reading at the speed of light.",
    location: "Lagos, Nigeria",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const priya = await upsertUser(prisma, {
    email: "priya@folio.dev",
    name: "Priya Sharma",
    username: "priyareads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
    bio: "Romance and contemporary fiction lover. TBR pile height: alarming.",
    location: "Mumbai, India",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const alex = await upsertUser(prisma, {
    email: "alex@folio.dev",
    name: "Alex Rivera",
    username: "alexrivera",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    bio: "Epic fantasy is life. Map appreciator. Lore enthusiast.",
    location: "Madrid, Spain",
    userType: "ORGANISER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const elena = await upsertUser(prisma, {
    email: "elena@folio.dev",
    name: "Elena Vasquez",
    username: "elenareads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=elena",
    bio: "Slow reader, deep feeler. Literary fiction and historical fiction.",
    location: "Buenos Aires, Argentina",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const currentUser = await upsertUser(prisma, {
    email: "stormbreaker128@gmail.com",
    name: "Connor",
    username: "connor_reads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=connor",
    bio: "Currently building Folio. Loves fantasy and literary fiction.",
    location: "Online",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const maya = await upsertUser(prisma, {
    email: "maya@folio.dev",
    name: "Maya Osei",
    username: "mayareads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
    bio: "Psychological thrillers, dark crime fiction, and unreliable narrators. Speed reader.",
    location: "Accra, Ghana",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const oliver = await upsertUser(prisma, {
    email: "oliver@folio.dev",
    name: "Oliver Braun",
    username: "oliverreads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=oliver",
    bio: "Hard sci-fi or bust. If the science doesn't check out, I'm leaving a review.",
    location: "Berlin, Germany",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const aisha = await upsertUser(prisma, {
    email: "aisha@folio.dev",
    name: "Aisha Nwosu",
    username: "aishareads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=aisha",
    bio: "Non-fiction first, always. Memoir, history, science. I learn through books.",
    location: "Nairobi, Kenya",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const zoe = await upsertUser(prisma, {
    email: "zoe@folio.dev",
    name: "Zoe Hartley",
    username: "zoereads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zoe",
    bio: "Romantasy is my whole personality. Fae courts, dragon riders, morally grey love interests.",
    location: "Melbourne, Australia",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const david = await upsertUser(prisma, {
    email: "david@folio.dev",
    name: "David Kowalski",
    username: "davidreads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
    bio: "Classics, literary fiction, and dystopia. Orwell was right about everything.",
    location: "Warsaw, Poland",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const nina = await upsertUser(prisma, {
    email: "nina@folio.dev",
    name: "Nina Castillo",
    username: "ninareads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nina",
    bio: "Magical realism, mythology, and books that blur the line between real and imagined.",
    location: "Mexico City, Mexico",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const felix = await upsertUser(prisma, {
    email: "felix@folio.dev",
    name: "Felix Andersen",
    username: "felixreads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=felix",
    bio: "Dystopia, dark speculative fiction, and books that make you question everything.",
    location: "Copenhagen, Denmark",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const chloe = await upsertUser(prisma, {
    email: "chloe@folio.dev",
    name: "Chloe Mensah",
    username: "chloereads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=chloe",
    bio: "I'll try anything once. My reading list has no genre loyalty whatsoever.",
    location: "Toronto, Canada",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const raj = await upsertUser(prisma, {
    email: "raj@folio.dev",
    name: "Raj Patel",
    username: "rajreads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=raj",
    bio: "Hard sci-fi and non-fiction. I want to understand the universe, one book at a time.",
    location: "Bangalore, India",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const sophie = await upsertUser(prisma, {
    email: "sophie@folio.dev",
    name: "Sophie Laurent",
    username: "sophiereads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophie",
    bio: "Gothic fiction, dark atmosphere, haunted houses. The eerier the better.",
    location: "Lyon, France",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const leo = await upsertUser(prisma, {
    email: "leo@folio.dev",
    name: "Leo Nakamura",
    username: "leoreads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=leo",
    bio: "New to reading seriously. Trying to find what I actually like.",
    location: "Tokyo, Japan",
    userType: "READER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const grace = await upsertUser(prisma, {
    email: "grace@folio.dev",
    name: "Grace Adeyemi",
    username: "gracereads",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=grace",
    bio: "Book club organiser, literary fiction lover, and lifelong reader. Obsessed with books that start conversations.",
    location: "Lagos, Nigeria",
    userType: "ORGANISER" as const,
    passwordHash: hashedPassword,
    onboarded: true,
  });

  const allUsers = [sarah, marcus, luna, james, priya, alex, elena, currentUser, maya, oliver, aisha, zoe, david, nina, felix, chloe, raj, sophie, leo, grace];

  // ── Book indices ─────────────────────────────────────────────────────────
  const notw = books[0]!;
  const soc = books[1]!;
  const cerulean = books[2]!;
  const littleLife = books[3]!;
  const evelyn = books[4]!;
  const hailMary = books[5]!;
  const midnight = books[6]!;
  const pachinko = books[7]!;
  const thursday = books[8]!;
  const fourthWing = books[9]!;
  const tomorrow = books[10]!;
  const atlasSix = books[11]!;
  const beachRead = books[12]!;
  const poppyWar = books[13]!;
  const mexicanGothic = books[14]!;
  const normalPeople = books[15]!;
  const piranesi = books[16]!;
  const priory = books[17]!;
  const ironFlame = books[18]!;

  // ── User Libraries ────────────────────────────────────────────────────────
  await addBooksToLibrary(prisma, sarah.id, [
    { book: notw, status: "READ", rating: 5 },
    { book: soc, status: "READ", rating: 5 },
    { book: atlasSix, status: "READ", rating: 4 },
    { book: poppyWar, status: "READ", rating: 4 },
    { book: priory, status: "READ", rating: 4 },
    { book: piranesi, status: "READ", rating: 5 },
    { book: mexicanGothic, status: "READ", rating: 4 },
    { book: fourthWing, status: "CURRENTLY_READING", progress: 210 },
    { book: littleLife, status: "WANT_TO_READ", rating: null },
    { book: beachRead, status: "ABANDONED" },
  ]);

  await addBooksToLibrary(prisma, marcus.id, [
    { book: littleLife, status: "READ", rating: 5 },
    { book: pachinko, status: "READ", rating: 5 },
    { book: tomorrow, status: "READ", rating: 4 },
    { book: normalPeople, status: "READ", rating: 4 },
    { book: evelyn, status: "READ", rating: 4 },
    { book: midnight, status: "READ", rating: 3 },
    { book: piranesi, status: "READ", rating: 4 },
    { book: notw, status: "ABANDONED" },
    { book: fourthWing, status: "WANT_TO_READ" },
  ]);

  await addBooksToLibrary(prisma, luna.id, [
    { book: atlasSix, status: "READ", rating: 5 },
    { book: mexicanGothic, status: "READ", rating: 5 },
    { book: poppyWar, status: "READ", rating: 4 },
    { book: thursday, status: "READ", rating: 4 },
    { book: piranesi, status: "READ", rating: 5 },
    { book: soc, status: "READ", rating: 4 },
    { book: pachinko, status: "CURRENTLY_READING", progress: 180 },
    { book: notw, status: "WANT_TO_READ" },
    { book: beachRead, status: "ABANDONED" },
  ]);

  await addBooksToLibrary(prisma, james.id, [
    { book: hailMary, status: "READ", rating: 5 },
    { book: thursday, status: "READ", rating: 4 },
    { book: soc, status: "READ", rating: 4 },
    { book: poppyWar, status: "READ", rating: 3 },
    { book: notw, status: "READ", rating: 3 },
    { book: midnight, status: "READ", rating: 3 },
    { book: atlasSix, status: "WANT_TO_READ" },
    { book: tomorrow, status: "CURRENTLY_READING", progress: 120 },
    { book: normalPeople, status: "ABANDONED" },
  ]);

  await addBooksToLibrary(prisma, priya.id, [
    { book: evelyn, status: "READ", rating: 5 },
    { book: fourthWing, status: "READ", rating: 5 },
    { book: ironFlame, status: "READ", rating: 4 },
    { book: beachRead, status: "READ", rating: 4 },
    { book: cerulean, status: "READ", rating: 5 },
    { book: normalPeople, status: "READ", rating: 4 },
    { book: midnight, status: "READ", rating: 3 },
    { book: tomorrow, status: "CURRENTLY_READING", progress: 200 },
    { book: pachinko, status: "WANT_TO_READ" },
    { book: poppyWar, status: "ABANDONED" },
  ]);

  await addBooksToLibrary(prisma, alex.id, [
    { book: notw, status: "READ", rating: 5 },
    { book: priory, status: "READ", rating: 5 },
    { book: poppyWar, status: "READ", rating: 5 },
    { book: soc, status: "READ", rating: 4 },
    { book: fourthWing, status: "READ", rating: 4 },
    { book: ironFlame, status: "READ", rating: 4 },
    { book: atlasSix, status: "READ", rating: 3 },
    { book: piranesi, status: "CURRENTLY_READING", progress: 100 },
    { book: littleLife, status: "WANT_TO_READ" },
    { book: beachRead, status: "ABANDONED" },
  ]);

  await addBooksToLibrary(prisma, elena.id, [
    { book: pachinko, status: "READ", rating: 5 },
    { book: littleLife, status: "READ", rating: 5 },
    { book: evelyn, status: "READ", rating: 4 },
    { book: tomorrow, status: "READ", rating: 5 },
    { book: normalPeople, status: "READ", rating: 4 },
    { book: midnight, status: "READ", rating: 3 },
    { book: piranesi, status: "READ", rating: 4 },
    { book: notw, status: "WANT_TO_READ" },
    { book: cerulean, status: "CURRENTLY_READING", progress: 150 },
  ]);

  await addBooksToLibrary(prisma, currentUser.id, [
    { book: notw, status: "READ", rating: 5 },
    { book: soc, status: "READ", rating: 5 },
    { book: piranesi, status: "READ", rating: 4 },
    { book: poppyWar, status: "READ", rating: 4 },
    { book: hailMary, status: "READ", rating: 5 },
    { book: tomorrow, status: "READ", rating: 4 },
    { book: fourthWing, status: "CURRENTLY_READING", progress: 180 },
    { book: atlasSix, status: "WANT_TO_READ" },
    { book: littleLife, status: "WANT_TO_READ" },
    { book: pachinko, status: "WANT_TO_READ" },
  ]);

  await addBooksToLibrary(prisma, maya.id, [
    { book: books[38]!, status: "READ", rating: 5 },
    { book: books[39]!, status: "READ", rating: 5 },
    { book: books[42]!, status: "READ", rating: 5 },
    { book: books[40]!, status: "READ", rating: 4 },
    { book: books[43]!, status: "READ", rating: 4 },
    { book: books[41]!, status: "READ", rating: 4 },
    { book: books[8]!, status: "READ", rating: 4 },
    { book: books[0]!, status: "READ", rating: 2 },
    { book: books[6]!, status: "READ", rating: 2 },
    { book: books[17]!, status: "ABANDONED" },
  ]);

  await addBooksToLibrary(prisma, oliver.id, [
    { book: books[19]!, status: "READ", rating: 5 },
    { book: books[24]!, status: "READ", rating: 5 },
    { book: books[5]!, status: "READ", rating: 5 },
    { book: books[21]!, status: "READ", rating: 4 },
    { book: books[25]!, status: "READ", rating: 4 },
    { book: books[35]!, status: "READ", rating: 4 },
    { book: books[57]!, status: "READ", rating: 1 },
    { book: books[9]!, status: "READ", rating: 2 },
    { book: books[12]!, status: "READ", rating: 1 },
    { book: books[30]!, status: "ABANDONED" },
  ]);

  await addBooksToLibrary(prisma, aisha.id, [
    { book: books[59]!, status: "READ", rating: 5 },
    { book: books[60]!, status: "READ", rating: 5 },
    { book: books[61]!, status: "READ", rating: 5 },
    { book: books[47]!, status: "READ", rating: 5 },
    { book: books[7]!, status: "READ", rating: 4 },
    { book: books[50]!, status: "READ", rating: 4 },
    { book: books[9]!, status: "READ", rating: 2 },
    { book: books[12]!, status: "READ", rating: 3 },
    { book: books[1]!, status: "READ", rating: 3 },
    { book: books[18]!, status: "ABANDONED" },
  ]);

  await addBooksToLibrary(prisma, zoe.id, [
    { book: books[30]!, status: "READ", rating: 5 },
    { book: books[9]!, status: "READ", rating: 5 },
    { book: books[31]!, status: "READ", rating: 5 },
    { book: books[18]!, status: "READ", rating: 4 },
    { book: books[1]!, status: "READ", rating: 4 },
    { book: books[29]!, status: "READ", rating: 4 },
    { book: books[3]!, status: "READ", rating: 1 },
    { book: books[55]!, status: "READ", rating: 1 },
    { book: books[7]!, status: "READ", rating: 2 },
    { book: books[15]!, status: "READ", rating: 3 },
    { book: books[11]!, status: "CURRENTLY_READING", progress: 150 },
  ]);

  await addBooksToLibrary(prisma, david.id, [
    { book: books[35]!, status: "READ", rating: 5 },
    { book: books[37]!, status: "READ", rating: 5 },
    { book: books[36]!, status: "READ", rating: 5 },
    { book: books[52]!, status: "READ", rating: 5 },
    { book: books[50]!, status: "READ", rating: 5 },
    { book: books[54]!, status: "READ", rating: 4 },
    { book: books[48]!, status: "READ", rating: 4 },
    { book: books[9]!, status: "READ", rating: 1 },
    { book: books[12]!, status: "READ", rating: 1 },
    { book: books[58]!, status: "READ", rating: 1 },
    { book: books[30]!, status: "ABANDONED" },
  ]);

  await addBooksToLibrary(prisma, nina.id, [
    { book: books[54]!, status: "READ", rating: 5 },
    { book: books[28]!, status: "READ", rating: 5 },
    { book: books[27]!, status: "READ", rating: 5 },
    { book: books[16]!, status: "READ", rating: 5 },
    { book: books[50]!, status: "READ", rating: 4 },
    { book: books[14]!, status: "READ", rating: 4 },
    { book: books[38]!, status: "READ", rating: 3 },
    { book: books[39]!, status: "READ", rating: 2 },
    { book: books[58]!, status: "READ", rating: 2 },
    { book: books[57]!, status: "ABANDONED" },
  ]);

  await addBooksToLibrary(prisma, felix.id, [
    { book: books[35]!, status: "READ", rating: 5 },
    { book: books[36]!, status: "READ", rating: 5 },
    { book: books[32]!, status: "READ", rating: 5 },
    { book: books[37]!, status: "READ", rating: 4 },
    { book: books[33]!, status: "READ", rating: 4 },
    { book: books[23]!, status: "READ", rating: 4 },
    { book: books[34]!, status: "READ", rating: 4 },
    { book: books[2]!, status: "READ", rating: 1 },
    { book: books[12]!, status: "READ", rating: 1 },
    { book: books[57]!, status: "READ", rating: 2 },
    { book: books[58]!, status: "ABANDONED" },
  ]);

  await addBooksToLibrary(prisma, chloe.id, [
    { book: books[4]!, status: "READ", rating: 5 },
    { book: books[46]!, status: "READ", rating: 5 },
    { book: books[38]!, status: "READ", rating: 4 },
    { book: books[29]!, status: "READ", rating: 4 },
    { book: books[10]!, status: "READ", rating: 4 },
    { book: books[35]!, status: "READ", rating: 4 },
    { book: books[19]!, status: "READ", rating: 3 },
    { book: books[26]!, status: "READ", rating: 3 },
    { book: books[12]!, status: "READ", rating: 3 },
    { book: books[53]!, status: "READ", rating: 4 },
    { book: books[45]!, status: "CURRENTLY_READING", progress: 120 },
  ]);

  await addBooksToLibrary(prisma, raj.id, [
    { book: books[19]!, status: "READ", rating: 5 },
    { book: books[24]!, status: "READ", rating: 5 },
    { book: books[60]!, status: "READ", rating: 5 },
    { book: books[5]!, status: "READ", rating: 5 },
    { book: books[22]!, status: "READ", rating: 4 },
    { book: books[59]!, status: "READ", rating: 4 },
    { book: books[61]!, status: "READ", rating: 4 },
    { book: books[27]!, status: "READ", rating: 3 },
    { book: books[57]!, status: "READ", rating: 2 },
    { book: books[30]!, status: "ABANDONED" },
  ]);

  await addBooksToLibrary(prisma, sophie.id, [
    { book: books[43]!, status: "READ", rating: 5 },
    { book: books[14]!, status: "READ", rating: 5 },
    { book: books[42]!, status: "READ", rating: 5 },
    { book: books[40]!, status: "READ", rating: 4 },
    { book: books[48]!, status: "READ", rating: 4 },
    { book: books[28]!, status: "READ", rating: 4 },
    { book: books[11]!, status: "READ", rating: 4 },
    { book: books[9]!, status: "READ", rating: 3 },
    { book: books[46]!, status: "READ", rating: 3 },
    { book: books[58]!, status: "READ", rating: 2 },
  ]);

  await addBooksToLibrary(prisma, leo.id, [
    { book: books[5]!, status: "READ", rating: 4 },
    { book: books[12]!, status: "READ", rating: 3 },
    { book: books[6]!, status: "READ", rating: 4 },
    { book: books[19]!, status: "ABANDONED" },
    { book: books[35]!, status: "CURRENTLY_READING", progress: 88 },
    { book: books[1]!, status: "WANT_TO_READ" },
  ]);

  await addBooksToLibrary(prisma, grace.id, [
    { book: books[45]!, status: "READ", rating: 5 },
    { book: books[46]!, status: "READ", rating: 5 },
    { book: books[7]!, status: "READ", rating: 5 },
    { book: books[51]!, status: "READ", rating: 5 },
    { book: books[4]!, status: "READ", rating: 4 },
    { book: books[49]!, status: "READ", rating: 4 },
    { book: books[42]!, status: "READ", rating: 4 },
    { book: books[32]!, status: "READ", rating: 3 },
    { book: books[19]!, status: "READ", rating: 3 },
    { book: books[59]!, status: "READ", rating: 4 },
    { book: books[10]!, status: "CURRENTLY_READING", progress: 180 },
  ]);

  // ── Taste Profiles ────────────────────────────────────────────────────────
  await upsertTasteProfile(prisma, sarah.id, {
    topGenres: ["Fantasy", "Dark Academia", "Gothic Horror"],
    topAuthors: ["Leigh Bardugo", "Olivie Blake", "Patrick Rothfuss"],
    topThemes: ["magic", "academia", "mystery", "dark atmosphere"],
    topMoods: ["immersive", "atmospheric", "intense"],
    pace: 0.55, tone: 0.72, focus: 0.72, emotionalIntensity: 0.72,
    romanceLevel: 0.35, complexity: 0.78, worldbuildingDepth: 0.78, discussionPotential: 0.82,
    cluster: "dark_academia",
    dislikedGenres: ["Romance", "Contemporary Romance"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, marcus.id, {
    topGenres: ["Literary Fiction", "Contemporary Fiction", "Historical Fiction"],
    topAuthors: ["Hanya Yanagihara", "Min Jin Lee", "Gabrielle Zevin"],
    topThemes: ["identity", "grief", "friendship", "society"],
    topMoods: ["contemplative", "emotional", "literary"],
    pace: 0.25, tone: 0.64, focus: 0.92, emotionalIntensity: 0.86,
    romanceLevel: 0.36, complexity: 0.6, worldbuildingDepth: 0.1, discussionPotential: 0.92,
    cluster: "literary_fiction",
    dislikedGenres: ["Epic Fantasy", "Romantasy"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, luna.id, {
    topGenres: ["Dark Academia", "Mystery", "Gothic Horror"],
    topAuthors: ["Olivie Blake", "Silvia Moreno-Garcia", "Susanna Clarke"],
    topThemes: ["academia", "secrets", "atmosphere", "the macabre"],
    topMoods: ["atmospheric", "tense", "intellectual"],
    pace: 0.46, tone: 0.82, focus: 0.72, emotionalIntensity: 0.72,
    romanceLevel: 0.2, complexity: 0.78, worldbuildingDepth: 0.62, discussionPotential: 0.88,
    cluster: "dark_academia",
    dislikedGenres: ["Contemporary Romance"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, james.id, {
    topGenres: ["Science Fiction", "Thriller", "Mystery"],
    topAuthors: ["Andy Weir", "Richard Osman"],
    topThemes: ["science", "puzzles", "adventure", "problem-solving"],
    topMoods: ["fast-paced", "exciting", "curious"],
    pace: 0.72, tone: 0.35, focus: 0.62, emotionalIntensity: 0.5,
    romanceLevel: 0.15, complexity: 0.65, worldbuildingDepth: 0.72, discussionPotential: 0.72,
    cluster: "thriller_reader",
    dislikedGenres: ["Romance", "Literary Fiction"],
    confidence: "MEDIUM" as const,
  });

  await upsertTasteProfile(prisma, priya.id, {
    topGenres: ["Romance", "Contemporary Romance", "Romantasy"],
    topAuthors: ["Taylor Jenkins Reid", "Rebecca Yarros", "Emily Henry"],
    topThemes: ["love", "ambition", "chosen one", "healing"],
    topMoods: ["romantic", "emotional", "feel-good"],
    pace: 0.62, tone: 0.35, focus: 0.82, emotionalIntensity: 0.7,
    romanceLevel: 0.82, complexity: 0.38, worldbuildingDepth: 0.3, discussionPotential: 0.62,
    cluster: "cozy_romance",
    dislikedGenres: ["Grimdark", "Horror"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, alex.id, {
    topGenres: ["Epic Fantasy", "Fantasy", "Romantasy"],
    topAuthors: ["Patrick Rothfuss", "Samantha Shannon", "Rebecca Yarros"],
    topThemes: ["magic systems", "world-building", "war", "dragons"],
    topMoods: ["epic", "immersive", "adventurous"],
    pace: 0.5, tone: 0.58, focus: 0.72, emotionalIntensity: 0.68,
    romanceLevel: 0.5, complexity: 0.82, worldbuildingDepth: 0.92, discussionPotential: 0.72,
    cluster: "epic_fantasy",
    dislikedGenres: ["Contemporary Romance", "Cozy Mystery"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, elena.id, {
    topGenres: ["Literary Fiction", "Historical Fiction", "Contemporary Fiction"],
    topAuthors: ["Min Jin Lee", "Hanya Yanagihara", "Gabrielle Zevin"],
    topThemes: ["family", "history", "identity", "memory"],
    topMoods: ["contemplative", "emotional", "rich"],
    pace: 0.26, tone: 0.64, focus: 0.9, emotionalIntensity: 0.82,
    romanceLevel: 0.38, complexity: 0.58, worldbuildingDepth: 0.12, discussionPotential: 0.9,
    cluster: "literary_fiction",
    dislikedGenres: ["Thriller", "Horror"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, currentUser.id, {
    topGenres: ["Fantasy", "Science Fiction", "Literary Fiction"],
    topAuthors: ["Patrick Rothfuss", "Leigh Bardugo", "Andy Weir"],
    topThemes: ["magic", "adventure", "character-driven", "world-building"],
    topMoods: ["immersive", "exciting", "thoughtful"],
    pace: 0.58, tone: 0.55, focus: 0.75, emotionalIntensity: 0.65,
    romanceLevel: 0.3, complexity: 0.72, worldbuildingDepth: 0.8, discussionPotential: 0.78,
    cluster: "epic_fantasy",
    dislikedGenres: ["Contemporary Romance"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, maya.id, {
    topGenres: ["Thriller", "Mystery", "Crime"],
    topAuthors: ["Gillian Flynn", "Alex Michaelides", "Tana French"],
    topThemes: ["twists", "crime", "dark psychology", "unreliable narrators"],
    topMoods: ["tense", "gripping", "dark"],
    pace: 0.82, tone: 0.72, focus: 0.75, emotionalIntensity: 0.78,
    romanceLevel: 0.2, complexity: 0.58, worldbuildingDepth: 0.05, discussionPotential: 0.82,
    cluster: "thriller_reader",
    dislikedGenres: ["Epic Fantasy", "Cozy Fantasy"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, oliver.id, {
    topGenres: ["Science Fiction", "Hard Sci-Fi"],
    topAuthors: ["Andy Weir", "Orson Scott Card", "Frank Herbert"],
    topThemes: ["science", "space", "problem-solving", "technology"],
    topMoods: ["analytical", "exciting", "curious"],
    pace: 0.72, tone: 0.35, focus: 0.6, emotionalIntensity: 0.38,
    romanceLevel: 0.05, complexity: 0.78, worldbuildingDepth: 0.82, discussionPotential: 0.8,
    cluster: "sci_fi_reader",
    dislikedGenres: ["Romance", "Cozy Fantasy", "Romantasy"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, aisha.id, {
    topGenres: ["Non-Fiction", "Memoir", "Literary Fiction"],
    topAuthors: ["Tara Westover", "Yuval Noah Harari", "Khaled Hosseini"],
    topThemes: ["identity", "history", "self-determination", "society"],
    topMoods: ["educational", "reflective", "inspiring"],
    pace: 0.48, tone: 0.55, focus: 0.88, emotionalIntensity: 0.72,
    romanceLevel: 0.08, complexity: 0.58, worldbuildingDepth: 0.05, discussionPotential: 0.92,
    cluster: "literary_fiction",
    dislikedGenres: ["Romantasy", "Epic Fantasy"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, zoe.id, {
    topGenres: ["Romantasy", "Fantasy", "Young Adult"],
    topAuthors: ["Sarah J. Maas", "Rebecca Yarros", "Holly Black"],
    topThemes: ["fae", "dragons", "enemies to lovers", "magic academies"],
    topMoods: ["romantic", "exciting", "swoony"],
    pace: 0.72, tone: 0.52, focus: 0.65, emotionalIntensity: 0.72,
    romanceLevel: 0.88, complexity: 0.42, worldbuildingDepth: 0.62, discussionPotential: 0.65,
    cluster: "ya_romantasy",
    dislikedGenres: ["Grimdark", "Literary Fiction", "Non-Fiction"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, david.id, {
    topGenres: ["Classic", "Dystopia", "Literary Fiction"],
    topAuthors: ["George Orwell", "Aldous Huxley", "Toni Morrison"],
    topThemes: ["totalitarianism", "society", "identity", "history"],
    topMoods: ["intellectual", "serious", "challenging"],
    pace: 0.35, tone: 0.75, focus: 0.82, emotionalIntensity: 0.75,
    romanceLevel: 0.12, complexity: 0.82, worldbuildingDepth: 0.62, discussionPotential: 0.98,
    cluster: "literary_fiction",
    dislikedGenres: ["Romance", "Cozy Fantasy", "Romantasy"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, nina.id, {
    topGenres: ["Magical Realism", "Literary Fiction", "Fantasy"],
    topAuthors: ["Gabriel García Márquez", "Neil Gaiman", "Erin Morgenstern"],
    topThemes: ["mythology", "magical realism", "atmosphere", "surreal"],
    topMoods: ["dreamy", "atmospheric", "immersive"],
    pace: 0.28, tone: 0.52, focus: 0.72, emotionalIntensity: 0.68,
    romanceLevel: 0.22, complexity: 0.72, worldbuildingDepth: 0.72, discussionPotential: 0.88,
    cluster: "literary_fiction",
    dislikedGenres: ["Thriller", "Contemporary Romance"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, felix.id, {
    topGenres: ["Dystopia", "Science Fiction", "Dark Fantasy"],
    topAuthors: ["George Orwell", "Margaret Atwood", "Pierce Brown"],
    topThemes: ["totalitarianism", "resistance", "revolution", "dark futures"],
    topMoods: ["intense", "political", "thought-provoking"],
    pace: 0.58, tone: 0.85, focus: 0.72, emotionalIntensity: 0.82,
    romanceLevel: 0.1, complexity: 0.72, worldbuildingDepth: 0.7, discussionPotential: 0.95,
    cluster: "dark_academia",
    dislikedGenres: ["Cozy Fantasy", "Romance", "Contemporary Romance"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, chloe.id, {
    topGenres: ["Literary Fiction", "Thriller", "Fantasy"],
    topAuthors: ["Bonnie Garmus", "Taylor Jenkins Reid", "Neil Gaiman"],
    topThemes: ["women's stories", "crime", "creativity"],
    topMoods: ["varied", "curious", "open"],
    pace: 0.55, tone: 0.45, focus: 0.78, emotionalIntensity: 0.62,
    romanceLevel: 0.38, complexity: 0.52, worldbuildingDepth: 0.35, discussionPotential: 0.82,
    cluster: "literary_fiction",
    dislikedGenres: [],
    confidence: "MEDIUM" as const,
  });

  await upsertTasteProfile(prisma, raj.id, {
    topGenres: ["Science Fiction", "Non-Fiction", "Hard Sci-Fi"],
    topAuthors: ["Frank Herbert", "Andy Weir", "Yuval Noah Harari"],
    topThemes: ["space", "technology", "human history", "exploration"],
    topMoods: ["curious", "analytical", "ambitious"],
    pace: 0.68, tone: 0.38, focus: 0.65, emotionalIntensity: 0.42,
    romanceLevel: 0.08, complexity: 0.78, worldbuildingDepth: 0.8, discussionPotential: 0.85,
    cluster: "sci_fi_reader",
    dislikedGenres: ["Romance", "Cozy Fantasy", "Romantasy"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, sophie.id, {
    topGenres: ["Gothic", "Mystery", "Literary Fiction"],
    topAuthors: ["Daphne du Maurier", "Silvia Moreno-Garcia", "Gillian Flynn"],
    topThemes: ["gothic atmosphere", "haunting", "dark secrets", "psychological"],
    topMoods: ["atmospheric", "eerie", "tense"],
    pace: 0.52, tone: 0.82, focus: 0.82, emotionalIntensity: 0.78,
    romanceLevel: 0.28, complexity: 0.62, worldbuildingDepth: 0.35, discussionPotential: 0.82,
    cluster: "dark_academia",
    dislikedGenres: ["Contemporary Romance", "Cozy Fantasy"],
    confidence: "HIGH" as const,
  });

  await upsertTasteProfile(prisma, leo.id, {
    topGenres: ["Science Fiction", "Contemporary Fiction"],
    topAuthors: ["Andy Weir", "Matt Haig"],
    topThemes: ["adventure", "hope"],
    topMoods: ["light", "fun"],
    pace: 0.65, tone: 0.35, focus: 0.6, emotionalIntensity: 0.45,
    romanceLevel: 0.25, complexity: 0.35, worldbuildingDepth: 0.4, discussionPotential: 0.5,
    cluster: undefined,
    dislikedGenres: [],
    confidence: "LOW" as const,
  });

  await upsertTasteProfile(prisma, grace.id, {
    topGenres: ["Literary Fiction", "Historical Fiction", "Contemporary Fiction"],
    topAuthors: ["Delia Owens", "Bonnie Garmus", "Min Jin Lee"],
    topThemes: ["women's stories", "community", "history", "identity"],
    topMoods: ["inspiring", "thoughtful", "emotional"],
    pace: 0.45, tone: 0.42, focus: 0.85, emotionalIntensity: 0.72,
    romanceLevel: 0.38, complexity: 0.48, worldbuildingDepth: 0.1, discussionPotential: 0.88,
    cluster: "literary_fiction",
    dislikedGenres: ["Hard Sci-Fi", "Grimdark"],
    confidence: "HIGH" as const,
  });

  // ── User Scores ───────────────────────────────────────────────────────────
  await prisma.userScore.upsert({ where: { userId: sarah.id }, update: {}, create: { userId: sarah.id, totalPoints: 1240, streakDays: 14, lastReadAt: new Date(Date.now() - 86400000) } });
  await prisma.userScore.upsert({ where: { userId: marcus.id }, update: {}, create: { userId: marcus.id, totalPoints: 980, streakDays: 7, lastReadAt: new Date(Date.now() - 86400000 * 2) } });
  await prisma.userScore.upsert({ where: { userId: luna.id }, update: {}, create: { userId: luna.id, totalPoints: 1450, streakDays: 21, lastReadAt: new Date(Date.now() - 3600000) } });
  await prisma.userScore.upsert({ where: { userId: james.id }, update: {}, create: { userId: james.id, totalPoints: 720, streakDays: 3, lastReadAt: new Date(Date.now() - 86400000 * 3) } });
  await prisma.userScore.upsert({ where: { userId: priya.id }, update: {}, create: { userId: priya.id, totalPoints: 1620, streakDays: 30, lastReadAt: new Date() } });
  await prisma.userScore.upsert({ where: { userId: alex.id }, update: {}, create: { userId: alex.id, totalPoints: 890, streakDays: 5, lastReadAt: new Date(Date.now() - 86400000) } });
  await prisma.userScore.upsert({ where: { userId: currentUser.id }, update: {}, create: { userId: currentUser.id, totalPoints: 340, streakDays: 2, lastReadAt: new Date() } });
  await prisma.userScore.upsert({ where: { userId: elena.id }, update: {}, create: { userId: elena.id, totalPoints: 1120, streakDays: 9, lastReadAt: new Date(Date.now() - 86400000 * 2) } });
  await prisma.userScore.upsert({ where: { userId: maya.id }, update: {}, create: { userId: maya.id, totalPoints: 890, streakDays: 6, lastReadAt: new Date(Date.now() - 86400000) } });
  await prisma.userScore.upsert({ where: { userId: oliver.id }, update: {}, create: { userId: oliver.id, totalPoints: 760, streakDays: 4, lastReadAt: new Date(Date.now() - 86400000 * 3) } });
  await prisma.userScore.upsert({ where: { userId: aisha.id }, update: {}, create: { userId: aisha.id, totalPoints: 1050, streakDays: 12, lastReadAt: new Date(Date.now() - 86400000) } });
  await prisma.userScore.upsert({ where: { userId: zoe.id }, update: {}, create: { userId: zoe.id, totalPoints: 1380, streakDays: 18, lastReadAt: new Date() } });
  await prisma.userScore.upsert({ where: { userId: david.id }, update: {}, create: { userId: david.id, totalPoints: 640, streakDays: 2, lastReadAt: new Date(Date.now() - 86400000 * 5) } });
  await prisma.userScore.upsert({ where: { userId: nina.id }, update: {}, create: { userId: nina.id, totalPoints: 820, streakDays: 7, lastReadAt: new Date(Date.now() - 86400000) } });
  await prisma.userScore.upsert({ where: { userId: felix.id }, update: {}, create: { userId: felix.id, totalPoints: 710, streakDays: 3, lastReadAt: new Date(Date.now() - 86400000 * 2) } });
  await prisma.userScore.upsert({ where: { userId: chloe.id }, update: {}, create: { userId: chloe.id, totalPoints: 930, streakDays: 8, lastReadAt: new Date(Date.now() - 86400000) } });
  await prisma.userScore.upsert({ where: { userId: raj.id }, update: {}, create: { userId: raj.id, totalPoints: 980, streakDays: 11, lastReadAt: new Date(Date.now() - 86400000 * 2) } });
  await prisma.userScore.upsert({ where: { userId: sophie.id }, update: {}, create: { userId: sophie.id, totalPoints: 870, streakDays: 5, lastReadAt: new Date(Date.now() - 86400000) } });
  await prisma.userScore.upsert({ where: { userId: leo.id }, update: {}, create: { userId: leo.id, totalPoints: 180, streakDays: 1, lastReadAt: new Date(Date.now() - 86400000 * 7) } });
  await prisma.userScore.upsert({ where: { userId: grace.id }, update: {}, create: { userId: grace.id, totalPoints: 1560, streakDays: 22, lastReadAt: new Date() } });

  // ── Reviews ───────────────────────────────────────────────────────────────
  await upsertReview(prisma, sarah.id, notw.id, 5, "An absolute masterpiece. Rothfuss writes with the precision of a poet and the heart of a storyteller. Kvothe's voice is unforgettable.");
  await upsertReview(prisma, sarah.id, soc.id, 5, "The found family. The heist. The tension. Six of Crows does everything perfectly. Kaz Brekker is criminally compelling.");
  await upsertReview(prisma, sarah.id, atlasSix.id, 4, "Dark academia at its finest. The prose is dense but rewarding — every character has secrets. Perfect for long nights with tea.");
  await upsertReview(prisma, marcus.id, littleLife.id, 5, "The most devastatingly beautiful book I have ever read. It broke me and put me back together differently. Everyone should read this.");
  await upsertReview(prisma, marcus.id, pachinko.id, 5, "Multigenerational saga done perfectly. Min Jin Lee captures the quiet tragedy of immigrant identity with such grace and precision.");
  await upsertReview(prisma, luna.id, atlasSix.id, 5, "This is my roman empire. Morally grey characters, devastating philosophy, atmosphere that drips off every page. Reread immediately.");
  await upsertReview(prisma, luna.id, mexicanGothic.id, 5, "Gothic masterpiece. The atmosphere is suffocating in the best way. Noemí is an incredible protagonist and the house is terrifying.");
  await upsertReview(prisma, james.id, hailMary.id, 5, "The most fun I have had reading science fiction in years. Rocky and Ryland's friendship made me ugly cry. Pure joy.");
  await upsertReview(prisma, priya.id, evelyn.id, 5, "My all-time favourite. The structure is genius, the love story is heartbreaking, and Evelyn Hugo is one of fiction's greatest characters.");
  await upsertReview(prisma, priya.id, fourthWing.id, 5, "I know it is not literary fiction but I do not care. Violet and Xaden set my brain on fire. Perfect romantasy.");
  await upsertReview(prisma, alex.id, notw.id, 5, "The world-building in Kingkiller Chronicle is unmatched. The University, the Adem, the Fae — Rothfuss built something astonishing.");
  await upsertReview(prisma, alex.id, priory.id, 5, "The most ambitious standalone fantasy. Samantha Shannon built an entire world, mythology, and three distinct storylines. Stunning achievement.");
  await upsertReview(prisma, elena.id, pachinko.id, 5, "I think about this book constantly. The intersection of history, identity, and family over generations. Min Jin Lee is a genius.");
  await upsertReview(prisma, elena.id, tomorrow.id, 5, "Gabrielle Zevin writes about friendship and art with such tenderness. Tomorrow is not about video games — it is about everything that matters.");
  await upsertReview(prisma, currentUser.id, notw.id, 5, "My favourite book of all time. The prose is music. Kvothe's story is all myth and memory. I think about this book every single day.");
  await upsertReview(prisma, currentUser.id, soc.id, 5, "Six of Crows is the gold standard for ensemble fantasy. The heist plotting is meticulous. I care so deeply about every single character.");

  // ── New user reviews — positive ─────────────────────────────────────────
  await upsertReview(prisma, maya.id, books[38]!.id, 5, "Gone Girl is a masterpiece of psychological manipulation. Flynn plays the reader perfectly. Every reread reveals something new.");
  await upsertReview(prisma, maya.id, books[39]!.id, 5, "The twist genuinely got me. I was convinced I had it figured out and I was completely wrong. That ending will stay with me.");
  await upsertReview(prisma, maya.id, books[42]!.id, 5, "Sharp Objects is nastier than Gone Girl and I loved every page. Flynn has a gift for making the mundane deeply sinister.");
  await upsertReview(prisma, oliver.id, books[19]!.id, 5, "The most ambitious world-building in science fiction. Herbert didn't just create a planet — he created an entire ecology, religion, and political system.");
  await upsertReview(prisma, oliver.id, books[5]!.id, 5, "Andy Weir does what very few sci-fi authors can: makes hard science genuinely thrilling. Ryland's problem-solving is pure joy.");
  await upsertReview(prisma, aisha.id, books[59]!.id, 5, "One of the most important books I have ever read. Westover's self-reinvention is breathtaking. Every page felt like a revelation.");
  await upsertReview(prisma, aisha.id, books[60]!.id, 5, "Harari synthesises 70,000 years of human history in a way that is consistently surprising and readable. Changed how I see everything.");
  await upsertReview(prisma, aisha.id, books[47]!.id, 5, "The Kite Runner destroyed me. Hosseini writes guilt and redemption with an honesty that is almost unbearable.");
  await upsertReview(prisma, zoe.id, books[30]!.id, 5, "ACOTAR unlocked something in me. I read all five books in two weeks. Rhysand is not a character — he is a spiritual experience.");
  await upsertReview(prisma, zoe.id, books[31]!.id, 5, "Holly Black understands the enemies-to-lovers pipeline better than anyone. Cardan is infuriating and perfect simultaneously.");
  await upsertReview(prisma, david.id, books[35]!.id, 5, "Orwell wrote this in 1948 and it reads like today's news. The appendix on Newspeak alone is worth the price of the book.");
  await upsertReview(prisma, david.id, books[36]!.id, 5, "Atwood's vision of Gilead is chillingly plausible. Every time I think it's dated, something in the world proves me wrong.");
  await upsertReview(prisma, david.id, books[50]!.id, 5, "Morrison's prose is unlike anything else in American literature. Beloved demands everything from you and gives back twice as much.");
  await upsertReview(prisma, nina.id, books[54]!.id, 5, "The greatest novel I have ever read. García Márquez writes as if reality itself is optional — in the best possible way.");
  await upsertReview(prisma, nina.id, books[28]!.id, 5, "American Gods understands America better than most Americans do. Gaiman's old gods are genuinely mythic.");
  await upsertReview(prisma, felix.id, books[35]!.id, 5, "Required reading for anyone who wants to understand how authoritarian systems actually work. The world-building is a warning.");
  await upsertReview(prisma, felix.id, books[32]!.id, 5, "Red Rising is the thinking person's Hunger Games. Brown builds a Roman-inspired caste system that is genuinely brutal and compelling.");
  await upsertReview(prisma, sophie.id, books[43]!.id, 5, "Rebecca is gothic perfection. The house itself is a character. Du Maurier's prose creates an atmosphere no horror film has ever matched.");
  await upsertReview(prisma, sophie.id, books[14]!.id, 5, "Mexican Gothic is everything I want in a book: lush atmosphere, a brave protagonist, and a house that genuinely wants to eat you.");
  await upsertReview(prisma, grace.id, books[46]!.id, 5, "Lessons in Chemistry made me laugh and cry on the same page. Elizabeth Zott is one of fiction's greatest protagonists.");
  await upsertReview(prisma, grace.id, books[45]!.id, 5, "I resisted this for years and I was so wrong. The marsh, the mystery, and Kya's resilience — I think about this book constantly.");
  await upsertReview(prisma, raj.id, books[19]!.id, 5, "Dune is the foundation of all modern science fiction. The depth of the world-building is unmatched. A complete civilisation in one book.");
  await upsertReview(prisma, chloe.id, books[4]!.id, 5, "Taylor Jenkins Reid is a genius for structure. The way Evelyn's story unfolds is just immaculate storytelling.");
  await upsertReview(prisma, chloe.id, books[46]!.id, 5, "Bonnie Garmus writes with such warmth and wit. Lessons in Chemistry is funny and furious in equal measure.");
  await upsertReview(prisma, leo.id, books[5]!.id, 4, "Project Hail Mary was my first Andy Weir and I completely understand the hype now. The alien communication arc is genuinely brilliant.");

  // ── Negative and critical reviews (1–3 stars) ───────────────────────────
  await upsertReview(prisma, oliver.id, books[12]!.id, 1, "Beach Read is not a book I should have attempted. The conflict felt manufactured and I finished it out of stubbornness. Not for me.");
  await upsertReview(prisma, oliver.id, books[9]!.id, 2, "Fourth Wing has competent world-building buried under so much romance that I could not see it. The dragon magic system deserved a better book.");
  await upsertReview(prisma, zoe.id, books[3]!.id, 1, "I know this is critically beloved but I found it genuinely unbearable. I needed it to end 400 pages before it did. Too relentlessly dark for me.");
  await upsertReview(prisma, zoe.id, books[55]!.id, 1, "The Road is beautifully written and I hated every second of it. Not all bleakness is meaningful. I needed one single moment of hope.");
  await upsertReview(prisma, david.id, books[9]!.id, 1, "I have tried to understand the appeal and I cannot. Dragons, romance, and a magic academy — competently assembled but utterly uninteresting to me.");
  await upsertReview(prisma, david.id, books[12]!.id, 1, "Contemporary romance is simply not my genre. I'm sure this is enjoyable for its intended audience. I was not that audience.");
  await upsertReview(prisma, felix.id, books[2]!.id, 1, "The House in the Cerulean Sea is a novel with no stakes and no tension. An entirely conflict-free 400 pages. I need something to go wrong.");
  await upsertReview(prisma, felix.id, books[12]!.id, 1, "I did not finish this and I have no regrets. Life is too short.");
  await upsertReview(prisma, maya.id, books[0]!.id, 2, "I can see why fantasy readers love Rothfuss but the pacing just doesn't work for me. Kvothe narrates his own legend at such length it becomes tedious.");
  await upsertReview(prisma, nina.id, books[39]!.id, 2, "The Silent Patient felt clever rather than emotionally true. The twist undermined all the character work that came before it.");
  await upsertReview(prisma, raj.id, books[57]!.id, 2, "I respect what Colleen Hoover is doing with difficult subject matter but I couldn't connect with the writing style. Not for me.");
  await upsertReview(prisma, aisha.id, books[9]!.id, 2, "I can appreciate the craft but I need books that ground themselves in something real. Fourth Wing exists entirely in fantasy-romance logic.");
  await upsertReview(prisma, sophie.id, books[58]!.id, 2, "The Love Hypothesis reads like a fantasy about academia rather than academia itself. The romance was sweet but shallow.");
  await upsertReview(prisma, marcus.id, books[9]!.id, 2, "I finished Fourth Wing because the world-building had flashes of interest. But the romance overwhelmed everything. Not for me, as expected.");
  await upsertReview(prisma, james.id, books[15]!.id, 2, "Normal People frustrated me at every turn. The characters make the same mistakes repeatedly and call it depth. I needed more plot.");
  await upsertReview(prisma, james.id, books[3]!.id, 3, "A Little Life is technically extraordinary but I had to pace myself to get through it. The prose is beautiful; the content nearly broke me.");
  await upsertReview(prisma, sarah.id, books[12]!.id, 1, "Beach Read is exactly the kind of book I know isn't for me but I tried anyway. Fluffy is fine — I just need more edge.");
  await upsertReview(prisma, chloe.id, books[19]!.id, 3, "Dune is undeniably a masterpiece but it is also genuinely hard work. I'm glad I read it; I will not read it again.");
  await upsertReview(prisma, grace.id, books[19]!.id, 3, "Dune deserves all its reputation but the first 150 pages are a brutal slog. The payoff is worth it if you can get there.");

  // ── Reading Sessions ──────────────────────────────────────────────────────
  const now = new Date();
  const day = 86400000;
  for (const user of [sarah, luna, currentUser]) {
    for (let i = 0; i < 14; i++) {
      await prisma.readingSession.create({
        data: {
          userId: user.id,
          bookId: fourthWing.id,
          date: new Date(now.getTime() - i * day),
          pagesRead: Math.floor(Math.random() * 30) + 10,
          minutesRead: Math.floor(Math.random() * 60) + 20,
        },
      });
    }
  }

  // ── Clubs ─────────────────────────────────────────────────────────────────
  const dragonClub = await upsertClub(prisma, {
    name: "The Dragon's Bookshelf",
    description: "A passionate community of epic fantasy readers. We love intricate magic systems, complex world-building, and sprawling multi-book sagas. Monthly reads with weekly discussion threads.",
    ownerId: alex.id,
    genres: ["Fantasy", "Epic Fantasy"],
    themes: ["magic", "dragons", "world-building", "adventure"],
    isOnline: true,
    meetingCadence: "monthly",
    membershipType: "OPEN" as const,
    currentBookId: priory.id,
    upcomingBookId: notw.id,
  });

  const literaryMinds = await upsertClub(prisma, {
    name: "Literary Minds",
    description: "A thoughtful book club for lovers of literary and contemporary fiction. We read deeply, discuss widely, and value prose quality and thematic depth above all.",
    ownerId: marcus.id,
    genres: ["Literary Fiction", "Contemporary Fiction", "Historical Fiction"],
    themes: ["identity", "society", "family", "grief"],
    isOnline: false,
    location: "New York, USA",
    meetingCadence: "monthly",
    membershipType: "APPLICATION" as const,
    currentBookId: pachinko.id,
    upcomingBookId: tomorrow.id,
  });

  const cozyReaders = await upsertClub(prisma, {
    name: "The Cozy Corner",
    description: "For readers who love their books warm, their vibes immaculate, and their endings happy. Cozy fantasy, feel-good romance, and gentle mysteries welcome.",
    ownerId: priya.id,
    genres: ["Romance", "Cozy Fantasy", "Cozy Mystery"],
    themes: ["found family", "love", "community", "comfort"],
    isOnline: true,
    meetingCadence: "biweekly",
    membershipType: "OPEN" as const,
    currentBookId: cerulean.id,
    upcomingBookId: beachRead.id,
  });

  const darkAcademySociety = await upsertClub(prisma, {
    name: "Dark Academia Society",
    description: "Aesthetes, scholars, and lovers of the macabre. We read dark academia, gothic fiction, atmospheric mysteries, and morally complicated literary fiction.",
    ownerId: sarah.id,
    genres: ["Dark Academia", "Gothic", "Mystery", "Literary Fiction"],
    themes: ["academia", "power", "knowledge", "the macabre"],
    isOnline: true,
    meetingCadence: "biweekly",
    membershipType: "APPLICATION" as const,
    currentBookId: atlasSix.id,
    upcomingBookId: mexicanGothic.id,
  });

  const scifiCollective = await upsertClub(prisma, {
    name: "The Sci-Fi Collective",
    description: "We explore the stars, bend time, and argue about whether the science checks out. Science fiction from classic to contemporary.",
    ownerId: james.id,
    genres: ["Science Fiction", "Space Opera", "Hard Sci-Fi"],
    themes: ["space", "technology", "first contact", "future"],
    isOnline: true,
    meetingCadence: "biweekly",
    membershipType: "OPEN" as const,
    currentBookId: hailMary.id,
    upcomingBookId: null,
  });

  const mysteryCircle = await upsertClub(prisma, {
    name: "The Mystery Circle",
    description: "For readers who love crime, thrillers, and psychological mysteries. We meet monthly to dissect plots, debate suspects, and celebrate the perfect twist ending.",
    ownerId: maya.id,
    genres: ["Thriller", "Mystery", "Crime", "Psychological Thriller"],
    themes: ["crime", "twists", "investigation", "dark psychology"],
    isOnline: true,
    meetingCadence: "monthly",
    membershipType: "OPEN" as const,
    currentBookId: books[38]!.id,
    upcomingBookId: books[43]!.id,
  });

  const pagesAndPerspectives = await upsertClub(prisma, {
    name: "Pages & Perspectives",
    description: "A welcoming club for literary fiction, historical fiction, and serious non-fiction. We value diversity of perspective, depth of discussion, and books that leave you different than when you started.",
    ownerId: grace.id,
    genres: ["Literary Fiction", "Historical Fiction", "Non-Fiction"],
    themes: ["identity", "society", "history", "women's stories"],
    isOnline: false,
    location: "Lagos, Nigeria",
    meetingCadence: "monthly",
    membershipType: "APPLICATION" as const,
    currentBookId: books[46]!.id,
    upcomingBookId: books[59]!.id,
  });

  const sciFiFutures = await upsertClub(prisma, {
    name: "Sci-Fi Futures",
    description: "Hard science fiction only. We read the classics and the cutting edge, argue about the physics, and appreciate authors who did their research. Soft sci-fi welcome, unscientific hand-waving is not.",
    ownerId: oliver.id,
    genres: ["Science Fiction", "Hard Sci-Fi", "Space Opera"],
    themes: ["space", "technology", "AI", "future", "hard science"],
    isOnline: true,
    meetingCadence: "biweekly",
    membershipType: "OPEN" as const,
    currentBookId: books[19]!.id,
    upcomingBookId: books[24]!.id,
  });

  const romanceReadersGuild = await upsertClub(prisma, {
    name: "Romance Readers Guild",
    description: "Romance is a genre, not a guilty pleasure. We read contemporary romance, romantasy, historical romance, and anything with a guaranteed HEA. Trope appreciation required.",
    ownerId: zoe.id,
    genres: ["Romance", "Romantasy", "Contemporary Romance"],
    themes: ["love", "found family", "enemies to lovers", "fae", "dragons"],
    isOnline: true,
    meetingCadence: "biweekly",
    membershipType: "OPEN" as const,
    currentBookId: books[30]!.id,
    upcomingBookId: books[57]!.id,
  });

  // ── Club Members ──────────────────────────────────────────────────────────
  await addClubMembers(prisma, dragonClub.id, [
    { userId: alex.id, role: "OWNER" as ClubRole },
    { userId: sarah.id, role: "ORGANISER" as ClubRole },
    { userId: luna.id, role: "MEMBER" as ClubRole },
    { userId: currentUser.id, role: "MEMBER" as ClubRole },
    { userId: james.id, role: "MEMBER" as ClubRole },
  ]);

  await addClubMembers(prisma, literaryMinds.id, [
    { userId: marcus.id, role: "OWNER" as ClubRole },
    { userId: elena.id, role: "ORGANISER" as ClubRole },
    { userId: priya.id, role: "MEMBER" as ClubRole },
  ]);

  await addClubMembers(prisma, cozyReaders.id, [
    { userId: priya.id, role: "OWNER" as ClubRole },
    { userId: currentUser.id, role: "MEMBER" as ClubRole },
    { userId: elena.id, role: "MEMBER" as ClubRole },
    { userId: marcus.id, role: "MEMBER" as ClubRole },
  ]);

  await addClubMembers(prisma, darkAcademySociety.id, [
    { userId: sarah.id, role: "OWNER" as ClubRole },
    { userId: luna.id, role: "ORGANISER" as ClubRole },
    { userId: alex.id, role: "MEMBER" as ClubRole },
    { userId: currentUser.id, role: "MEMBER" as ClubRole },
  ]);

  await addClubMembers(prisma, scifiCollective.id, [
    { userId: james.id, role: "OWNER" as ClubRole },
    { userId: currentUser.id, role: "MEMBER" as ClubRole },
    { userId: marcus.id, role: "MEMBER" as ClubRole },
  ]);

  await addClubMembers(prisma, mysteryCircle.id, [
    { userId: maya.id, role: "OWNER" as ClubRole },
    { userId: sophie.id, role: "ORGANISER" as ClubRole },
    { userId: james.id, role: "MEMBER" as ClubRole },
    { userId: luna.id, role: "MEMBER" as ClubRole },
    { userId: chloe.id, role: "MEMBER" as ClubRole },
    { userId: grace.id, role: "MEMBER" as ClubRole },
  ]);

  await addClubMembers(prisma, pagesAndPerspectives.id, [
    { userId: grace.id, role: "OWNER" as ClubRole },
    { userId: aisha.id, role: "ORGANISER" as ClubRole },
    { userId: marcus.id, role: "MEMBER" as ClubRole },
    { userId: elena.id, role: "MEMBER" as ClubRole },
    { userId: david.id, role: "MEMBER" as ClubRole },
    { userId: chloe.id, role: "MEMBER" as ClubRole },
    { userId: currentUser.id, role: "MEMBER" as ClubRole },
  ]);

  await addClubMembers(prisma, sciFiFutures.id, [
    { userId: oliver.id, role: "OWNER" as ClubRole },
    { userId: raj.id, role: "ORGANISER" as ClubRole },
    { userId: james.id, role: "MEMBER" as ClubRole },
    { userId: currentUser.id, role: "MEMBER" as ClubRole },
    { userId: felix.id, role: "MEMBER" as ClubRole },
    { userId: leo.id, role: "MEMBER" as ClubRole },
  ]);

  await addClubMembers(prisma, romanceReadersGuild.id, [
    { userId: zoe.id, role: "OWNER" as ClubRole },
    { userId: priya.id, role: "ORGANISER" as ClubRole },
    { userId: nina.id, role: "MEMBER" as ClubRole },
    { userId: chloe.id, role: "MEMBER" as ClubRole },
    { userId: grace.id, role: "MEMBER" as ClubRole },
    { userId: currentUser.id, role: "MEMBER" as ClubRole },
  ]);

  // ── Club Reading History ──────────────────────────────────────────────────
  await prisma.clubReadingHistory.createMany({
    skipDuplicates: true,
    data: [
      { clubId: dragonClub.id, bookId: soc.id, startedAt: new Date("2024-10-01"), finishedAt: new Date("2024-10-31"), avgRating: 4.6 },
      { clubId: dragonClub.id, bookId: poppyWar.id, startedAt: new Date("2024-11-01"), finishedAt: new Date("2024-11-30"), avgRating: 4.2 },
      { clubId: dragonClub.id, bookId: ironFlame.id, startedAt: new Date("2024-12-01"), finishedAt: new Date("2024-12-31"), avgRating: 4.0 },
      { clubId: literaryMinds.id, bookId: littleLife.id, startedAt: new Date("2024-10-01"), finishedAt: new Date("2024-10-31"), avgRating: 4.8 },
      { clubId: literaryMinds.id, bookId: tomorrow.id, startedAt: new Date("2024-11-01"), finishedAt: new Date("2024-11-30"), avgRating: 4.3 },
      { clubId: darkAcademySociety.id, bookId: piranesi.id, startedAt: new Date("2024-11-01"), finishedAt: new Date("2024-11-30"), avgRating: 4.7 },
      { clubId: darkAcademySociety.id, bookId: mexicanGothic.id, startedAt: new Date("2024-12-01"), finishedAt: new Date("2024-12-31"), avgRating: 4.4 },
    ],
  });

  await prisma.clubReadingHistory.createMany({
    skipDuplicates: true,
    data: [
      { clubId: mysteryCircle.id, bookId: books[41]!.id, startedAt: new Date("2026-02-01"), finishedAt: new Date("2026-02-28"), avgRating: 4.3 },
      { clubId: sciFiFutures.id, bookId: books[5]!.id, startedAt: new Date("2026-02-01"), finishedAt: new Date("2026-02-28"), avgRating: 4.7 },
      { clubId: pagesAndPerspectives.id, bookId: books[7]!.id, startedAt: new Date("2026-03-01"), finishedAt: new Date("2026-03-31"), avgRating: 4.5 },
    ],
  });

  // ── Club Posts ────────────────────────────────────────────────────────────
  await prisma.clubPost.createMany({
    skipDuplicates: true,
    data: [
      { clubId: darkAcademySociety.id, authorId: sarah.id, title: "This Month: The Atlas Six", content: "Welcome to our February read! The Atlas Six is peak dark academia — six morally grey magicians competing for a place in a secret society. Discussion questions posted below. Reminder: spoilers allowed after the 15th!", isPinned: true },
      { clubId: darkAcademySociety.id, authorId: luna.id, title: "Callum vs. Parisa: Who is the real villain?", content: "I cannot stop thinking about this. Callum manipulates emotions, Parisa manipulates thoughts — but which power is more corrosive? I think Callum is more dangerous because he doesn't need to try.", isPinned: false },
      { clubId: dragonClub.id, authorId: alex.id, title: "February Read: The Priory of the Orange Tree", content: "This month we're tackling Samantha Shannon's epic standalone. At 848 pages it's a commitment — but the world-building and the female-led cast are extraordinary. See you at the discussion on the 28th!", isPinned: true },
      { clubId: literaryMinds.id, authorId: marcus.id, title: "Pachinko Discussion — February", content: "Min Jin Lee said she wanted to write about 'the burden of belonging' — did she succeed? I would argue Pachinko is the most important novel about the immigrant experience in decades.", isPinned: true },
    ],
  });

  await prisma.clubPost.createMany({
    skipDuplicates: true,
    data: [
      { clubId: mysteryCircle.id, authorId: maya.id, title: "March Read: Gone Girl", content: "Welcome to The Mystery Circle! We're starting with Gone Girl — the book that redefined the psychological thriller. Fair warning: spoilers are fine from day one, because figuring out the twist IS the discussion.", isPinned: true },
      { clubId: mysteryCircle.id, authorId: sophie.id, title: "Amy vs Nick: Who's the real villain?", content: "I've been thinking about this for days. Amy is clearly the architect of chaos but Nick's passive dishonesty enabled everything. Are we letting him off too easy because he's the narrator we start with?", isPinned: false },
      { clubId: pagesAndPerspectives.id, authorId: grace.id, title: "April Read: Lessons in Chemistry", content: "Pages & Perspectives is thrilled to welcome everyone to our April read. Bonnie Garmus has written something genuinely funny AND genuinely furious. Come ready to talk about 1960s feminism and brilliant women who refused to be diminished.", isPinned: true },
      { clubId: sciFiFutures.id, authorId: oliver.id, title: "Reading Dune — ground rules", content: "Welcome to Sci-Fi Futures. Dune is our inaugural read. House rules: citations welcome, hand-waving is not. If you want to argue about the spice metabolism, bring your sources. Discussion thread posted after everyone hits page 200.", isPinned: true },
      { clubId: romanceReadersGuild.id, authorId: zoe.id, title: "We're reading ACOTAR", content: "Romance is not a guilty pleasure — it's a genre with craft, intention, and more emotional intelligence per page than most literary fiction. Welcome to the Romance Readers Guild. We start with ACOTAR: fae, court intrigue, and the enemies-to-lovers pipeline at full throttle.", isPinned: true },
    ],
  });

  // ── Club Polls ────────────────────────────────────────────────────────────
  const dragonPoll = await prisma.clubPoll.create({
    data: {
      clubId: dragonClub.id,
      title: "Vote: What should we read in March?",
      description: "Three options based on our club taste profile. Vote by the 20th!",
      status: PollStatus.ACTIVE,
      voteMode: "SINGLE",
      resultsVisible: false,
      endsAt: new Date(now.getTime() + 7 * day),
    },
  });

  await prisma.clubPollOption.createMany({
    data: [
      { pollId: dragonPoll.id, bookId: fourthWing.id, label: "Fourth Wing", matchScore: 87, matchReasons: ["9 members enjoy romantasy", "Strong world-building matches club taste", "High re-read discussions potential"] },
      { pollId: dragonPoll.id, bookId: poppyWar.id, label: "The Poppy War (re-read)", matchScore: 82, matchReasons: ["7 members rated it 4-5 stars", "Grimdark fantasy is in club DNA", "Excellent discussion material"] },
      { pollId: dragonPoll.id, bookId: atlasSix.id, label: "The Atlas Six", matchScore: 74, matchReasons: ["Dark and complex matches tone", "7 members haven't read it yet", "High discussion potential"] },
    ],
  });

  // ── Reading Challenges ────────────────────────────────────────────────────
  const marchChallenge = await prisma.readingChallenge.create({
    data: {
      title: "Dragon's Bookshelf March Sprint",
      description: "Finish The Priory of the Orange Tree before the end of March. All 848 pages. You got this.",
      type: ChallengeType.FASTEST_FINISH,
      creatorId: alex.id,
      clubId: dragonClub.id,
      bookId: priory.id,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-31"),
      isPublic: true,
    },
  });

  const globalPageChallenge = await prisma.readingChallenge.create({
    data: {
      title: "April Pages Challenge",
      description: "Who can read the most pages in April? Global leaderboard — everyone welcome!",
      type: ChallengeType.MOST_PAGES_WEEK,
      creatorId: priya.id,
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-30"),
      target: 1000,
      isPublic: true,
    },
  });

  await prisma.challengeParticipant.createMany({
    skipDuplicates: true,
    data: [
      { challengeId: marchChallenge.id, userId: alex.id, progress: 848 },
      { challengeId: marchChallenge.id, userId: sarah.id, progress: 620 },
      { challengeId: marchChallenge.id, userId: luna.id, progress: 440 },
      { challengeId: marchChallenge.id, userId: currentUser.id, progress: 210 },
      { challengeId: globalPageChallenge.id, userId: priya.id, progress: 876 },
      { challengeId: globalPageChallenge.id, userId: luna.id, progress: 743 },
      { challengeId: globalPageChallenge.id, userId: sarah.id, progress: 621 },
      { challengeId: globalPageChallenge.id, userId: marcus.id, progress: 590 },
      { challengeId: globalPageChallenge.id, userId: currentUser.id, progress: 412 },
      { challengeId: globalPageChallenge.id, userId: alex.id, progress: 380 },
      { challengeId: globalPageChallenge.id, userId: james.id, progress: 298 },
    ],
  });

  // ── Follows ───────────────────────────────────────────────────────────────
  const followPairs = [
    [currentUser.id, sarah.id],
    [currentUser.id, luna.id],
    [currentUser.id, marcus.id],
    [currentUser.id, alex.id],
    [sarah.id, luna.id],
    [sarah.id, alex.id],
    [marcus.id, elena.id],
    [luna.id, sarah.id],
    [priya.id, currentUser.id],
    [james.id, currentUser.id],
  ];

  for (const [followerId, followingId] of followPairs) {
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: followerId!, followingId: followingId! } },
      update: {},
      create: { followerId: followerId!, followingId: followingId! },
    });
  }

  // ── User Achievements ─────────────────────────────────────────────────────
  await prisma.userAchievement.createMany({
    skipDuplicates: true,
    data: [
      { userId: sarah.id, achievementId: achievements[0]!.id },
      { userId: sarah.id, achievementId: achievements[1]!.id },
      { userId: sarah.id, achievementId: achievements[3]!.id },
      { userId: sarah.id, achievementId: achievements[4]!.id },
      { userId: luna.id, achievementId: achievements[0]!.id },
      { userId: luna.id, achievementId: achievements[1]!.id },
      { userId: luna.id, achievementId: achievements[5]!.id },
      { userId: luna.id, achievementId: achievements[6]!.id },
      { userId: priya.id, achievementId: achievements[0]!.id },
      { userId: priya.id, achievementId: achievements[1]!.id },
      { userId: priya.id, achievementId: achievements[7]!.id },
      { userId: currentUser.id, achievementId: achievements[0]!.id },
    ],
  });

  // ── Onboarding Data ───────────────────────────────────────────────────────
  await prisma.onboardingData.upsert({
    where: { userId: currentUser.id },
    update: {},
    create: {
      userId: currentUser.id,
      favoriteGenres: ["Fantasy", "Science Fiction", "Literary Fiction"],
      favoriteBookIds: [notw.id, soc.id, hailMary.id],
      dislikedBookIds: [],
      favoriteAuthors: ["Patrick Rothfuss", "Leigh Bardugo"],
      preferredMoods: ["immersive", "character-driven"],
      preferredThemes: ["magic", "adventure", "friendship"],
      readingGoalBooksPerYear: 24,
      clubPreference: "online",
      interestedInClubs: true,
      interestedInChallenges: true,
      userType: "READER" as const,
      completedAt: new Date(),
    },
  });

  console.log("Folio database seeded successfully.");
  console.log(`  ${books.length} books`);
  console.log(`  ${allUsers.length} users`);
  console.log(`  9 clubs`);
  console.log(`  ${achievements.length} achievements`);
  console.log(`  5 taste clusters`);
}

// ── Helper functions ─────────────────────────────────────────────────────────

type BookInput = {
  title: string; author: string; authors: string[]; cover?: string;
  description?: string; publishedAt?: Date; pageCount?: number;
  genres: string[]; tags: string[]; avgRating?: number; ratingsCount?: number;
  dimensions: {
    pace: number; tone: number; focus: number; emotionalIntensity: number;
    romanceLevel: number; complexity: number; worldbuildingDepth: number;
    discussionPotential: number;
  };
};

async function createBook(prisma: PrismaClient, data: BookInput) {
  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const book = await prisma.book.upsert({
    where: { isbn: slug },
    update: {},
    create: {
      title: data.title,
      author: data.author,
      authors: data.authors,
      cover: data.cover,
      description: data.description,
      publishedAt: data.publishedAt,
      pageCount: data.pageCount,
      genres: data.genres,
      tags: data.tags,
      avgRating: data.avgRating,
      ratingsCount: data.ratingsCount ?? 0,
      isbn: slug,
    },
  });
  await prisma.bookTasteDimension.upsert({
    where: { bookId: book.id },
    update: {},
    create: { bookId: book.id, ...data.dimensions },
  });
  return book;
}

type UserInput = {
  email: string; name: string; username: string; avatar?: string;
  bio?: string; location?: string; userType: "READER" | "ORGANISER" | "MEMBER" | "INFLUENCER";
  passwordHash: string; onboarded: boolean;
};

async function upsertUser(prisma: PrismaClient, data: UserInput) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {},
    create: data,
  });
}

async function addBooksToLibrary(
  prisma: PrismaClient,
  userId: string,
  entries: Array<{ book: { id: string }; status: string; rating?: number | null; progress?: number }>
) {
  for (const entry of entries) {
    await prisma.userBook.upsert({
      where: { userId_bookId: { userId, bookId: entry.book.id } },
      update: {},
      create: {
        userId,
        bookId: entry.book.id,
        status: entry.status as ReadingStatus,
        rating: entry.rating ?? null,
        progress: entry.progress ?? 0,
        startedAt: entry.status === "CURRENTLY_READING" ? new Date(Date.now() - 14 * 86400000) : undefined,
        finishedAt: entry.status === "READ" ? new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000) : undefined,
      },
    });
  }
}

type TasteProfileInput = {
  topGenres: string[]; topAuthors: string[]; topThemes: string[]; topMoods: string[];
  pace: number; tone: number; focus: number; emotionalIntensity: number;
  romanceLevel: number; complexity: number; worldbuildingDepth: number; discussionPotential: number;
  cluster?: string; dislikedGenres: string[];
  confidence: "LOW" | "MEDIUM" | "HIGH";
};

async function upsertTasteProfile(prisma: PrismaClient, userId: string, data: TasteProfileInput) {
  return prisma.tasteProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      topGenres: data.topGenres,
      topAuthors: data.topAuthors,
      topThemes: data.topThemes,
      topMoods: data.topMoods,
      pace: data.pace,
      tone: data.tone,
      focus: data.focus,
      emotionalIntensity: data.emotionalIntensity,
      romanceLevel: data.romanceLevel,
      complexity: data.complexity,
      worldbuildingDepth: data.worldbuildingDepth,
      discussionPotential: data.discussionPotential,
      cluster: data.cluster,
      dislikedGenres: data.dislikedGenres,
      dislikedThemes: [],
      dislikedAuthors: [],
      confidence: data.confidence,
      lastCalculated: new Date(),
    },
  });
}

async function upsertReview(prisma: PrismaClient, userId: string, bookId: string, rating: number, content: string) {
  return prisma.review.upsert({
    where: { userId_bookId: { userId, bookId } },
    update: {},
    create: { userId, bookId, rating, content, isPublic: true },
  });
}

type ClubInput = {
  name: string; description: string; ownerId: string; genres: string[];
  themes: string[]; isOnline: boolean; location?: string; meetingCadence: string;
  membershipType: "OPEN" | "APPLICATION" | "PRIVATE";
  currentBookId?: string | null; upcomingBookId?: string | null;
};

async function upsertClub(prisma: PrismaClient, data: ClubInput) {
  const existing = await prisma.club.findFirst({ where: { name: data.name } });
  if (existing) return existing;
  return prisma.club.create({ data });
}

async function addClubMembers(
  prisma: PrismaClient,
  clubId: string,
  members: Array<{ userId: string; role: ClubRole }>
) {
  for (const member of members) {
    await prisma.clubMember.upsert({
      where: { clubId_userId: { clubId, userId: member.userId } },
      update: {},
      create: { clubId, userId: member.userId, role: member.role },
    });
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
