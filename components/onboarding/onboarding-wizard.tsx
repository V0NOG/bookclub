"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { saveOnboardingAction } from "@/app/onboarding/actions";

const GENRES = ["Fantasy", "Science Fiction", "Literary Fiction", "Historical Fiction", "Mystery", "Romance", "Thriller", "Horror", "Contemporary Fiction", "Non-fiction", "Biography", "Dark Academia", "Cozy Fantasy", "Romantasy"];
const MOODS = ["Immersive", "Fast-paced", "Character-driven", "Atmospheric", "Feel-good", "Thought-provoking", "Emotional", "Adventurous", "Dark", "Witty"];
const AUTHORS = ["Patrick Rothfuss", "Leigh Bardugo", "Hanya Yanagihara", "Taylor Jenkins Reid", "Andy Weir", "Min Jin Lee", "Susanna Clarke", "Olivie Blake", "Sally Rooney", "Rebecca Yarros", "Emily Henry", "Matt Haig", "Richard Osman", "Silvia Moreno-Garcia", "RF Kuang"];
const GOALS = [6, 12, 24, 36, 52];
const USER_TYPES = [
  { value: "READER" as const, label: "Reader", desc: "I want to discover books and track my reading" },
  { value: "ORGANISER" as const, label: "Club Organiser", desc: "I run or want to start a book club" },
  { value: "MEMBER" as const, label: "Club Member", desc: "I want to join existing book clubs" },
  { value: "INFLUENCER" as const, label: "Booktoker / Influencer", desc: "I share book content with an audience" },
];

type Step = "genres" | "authors" | "moods" | "goals" | "clubs" | "type";
const STEPS: Step[] = ["genres", "authors", "moods", "goals", "clubs", "type"];

export function OnboardingWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
  const [favoriteAuthors, setFavoriteAuthors] = useState<string[]>([]);
  const [preferredMoods, setPreferredMoods] = useState<string[]>([]);
  const [preferredThemes] = useState<string[]>([]);
  const [readingGoal, setReadingGoal] = useState(12);
  const [clubPreference, setClubPreference] = useState("online");
  const [interestedInClubs, setInterestedInClubs] = useState(true);
  const [interestedInChallenges, setInterestedInChallenges] = useState(true);
  const [userType, setUserType] = useState<"READER" | "ORGANISER" | "MEMBER" | "INFLUENCER">("READER");

  const currentStep = STEPS[stepIndex]!;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  function toggle<T>(arr: T[], item: T, setter: (v: T[]) => void) {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  }

  async function handleFinish() {
    setLoading(true);
    setError(null);
    try {
      await saveOnboardingAction({
        favoriteGenres,
        favoriteAuthors,
        preferredMoods,
        preferredThemes,
        readingGoalBooksPerYear: readingGoal,
        clubPreference,
        interestedInClubs,
        interestedInChallenges,
        userType,
      });
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  const canProceed =
    (currentStep === "genres" && favoriteGenres.length >= 2) ||
    (currentStep === "authors" && favoriteAuthors.length >= 1) ||
    (currentStep === "moods" && preferredMoods.length >= 2) ||
    currentStep === "goals" ||
    currentStep === "clubs" ||
    currentStep === "type";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Building your taste profile</span>
            <span>{stepIndex + 1} / {STEPS.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Step card */}
        <div className="bg-card border border-border rounded-xl p-8 min-h-[400px] flex flex-col shadow-sm">
          {currentStep === "genres" && (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">What genres do you love?</h2>
              <p className="text-muted-foreground mb-6">Pick at least 2. This shapes your taste profile.</p>
              <div className="flex flex-wrap gap-2 flex-1">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggle(favoriteGenres, g, setFavoriteGenres)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                      favoriteGenres.includes(g)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === "authors" && (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">Any favourite authors?</h2>
              <p className="text-muted-foreground mb-6">Select any you love. Helps us find readers who read like you.</p>
              <div className="flex flex-wrap gap-2 flex-1">
                {AUTHORS.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggle(favoriteAuthors, a, setFavoriteAuthors)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                      favoriteAuthors.includes(a)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === "moods" && (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">What moods do you read for?</h2>
              <p className="text-muted-foreground mb-6">Pick at least 2 reading vibes.</p>
              <div className="flex flex-wrap gap-2 flex-1">
                {MOODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => toggle(preferredMoods, m, setPreferredMoods)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                      preferredMoods.includes(m)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === "goals" && (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">How many books this year?</h2>
              <p className="text-muted-foreground mb-6">Set a reading goal. You can change this any time.</p>
              <div className="grid grid-cols-5 gap-3 flex-1 content-start">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setReadingGoal(g)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border text-sm font-medium transition-all aspect-square",
                      readingGoal === g
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    <span className="text-2xl font-bold">{g}</span>
                    <span className="text-xs mt-1">books</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === "clubs" && (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">Clubs and challenges?</h2>
              <p className="text-muted-foreground mb-6">Help us personalise your discovery feed.</p>
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Club preference</p>
                  <div className="flex gap-3">
                    {["online", "local", "both"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setClubPreference(p)}
                        className={cn(
                          "flex-1 py-3 rounded-lg border text-sm font-medium transition-all capitalize",
                          clubPreference === p
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setInterestedInClubs(!interestedInClubs)}
                    className={cn(
                      "flex-1 flex items-center gap-3 p-4 rounded-xl border text-sm transition-all",
                      interestedInClubs ? "bg-secondary/10 border-secondary/60" : "border-border hover:border-secondary/50"
                    )}
                  >
                    {interestedInClubs && <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0" />}
                    <span className={interestedInClubs ? "text-secondary" : "text-muted-foreground"}>I&apos;m interested in book clubs</span>
                  </button>
                  <button
                    onClick={() => setInterestedInChallenges(!interestedInChallenges)}
                    className={cn(
                      "flex-1 flex items-center gap-3 p-4 rounded-xl border text-sm transition-all",
                      interestedInChallenges ? "bg-secondary/10 border-secondary/60" : "border-border hover:border-secondary/50"
                    )}
                  >
                    {interestedInChallenges && <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0" />}
                    <span className={interestedInChallenges ? "text-secondary" : "text-muted-foreground"}>I&apos;m interested in challenges</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {currentStep === "type" && (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">How do you describe yourself?</h2>
              <p className="text-muted-foreground mb-6">This helps us tailor your experience.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 content-start">
                {USER_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setUserType(t.value)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      userType === t.value
                        ? "bg-secondary/10 border-secondary/60"
                        : "border-border hover:border-secondary/50"
                    )}
                  >
                    <p className={cn("font-medium mb-1", userType === t.value ? "text-secondary" : "text-foreground")}>{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <p className="mt-4 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Back
            </button>
            {stepIndex < STEPS.length - 1 ? (
              <button
                onClick={() => setStepIndex((i) => i + 1)}
                disabled={!canProceed}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="px-8 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Setting up your profile..." : "Start reading →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
