import { BookOpen, Users, Target, Trophy, Vote, BarChart3 } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Taste-based recommendations",
    description: "We analyse your ratings, abandoned books, preferred themes, and reading patterns to surface books you'll actually love — not just popular titles.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: Users,
    title: "Taste-matched readers",
    description: "Find readers whose taste mirrors yours. See exactly why you're compatible: shared loves, matching styles, overlapping dislikes.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Target,
    title: "Discover book clubs",
    description: "Get matched to clubs based on your taste profile — not just genre. Know your compatibility score and top reasons before you even apply.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: BarChart3,
    title: "Reading tracker",
    description: "Log sessions, track progress, see your reading streaks, and get estimated finish dates. Your reading history at a glance.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: Trophy,
    title: "Reading challenges",
    description: "Compete with friends and club members. Who read the most pages this month? Fastest to finish the club book? Leaderboards make it fun.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Vote,
    title: "Democratic book voting",
    description: "Clubs vote on what to read next. Every option shows its taste match score so members can make informed choices — not just popularity contests.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
];

export function FeatureSection() {
  return (
    <section className="py-24 bg-card/30">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything a reader needs
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Taste matching powers every feature — from recommendations to club discovery to book voting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border bg-card p-6 hover:border-border/80 transition-colors">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.bg} mb-4`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
