"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";

export type ShellSearchResult = {
  id: string;
  type: "book" | "club" | "reader" | "challenge";
  title: string;
  subtitle: string;
  href: string;
};

export type ShellNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  type: "like" | "follow" | "club" | "challenge";
};

const SEARCH_LIMIT = 5;

export async function searchShell(query: string): Promise<ShellSearchResult[]> {
  const session = await getSession();
  if (!session) return [];

  const term = query.trim();
  if (term.length < 2) return [];

  const [books, clubs, readers, challenges] = await Promise.all([
    db.book.findMany({
      where: {
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { author: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, author: true },
      orderBy: { updatedAt: "desc" },
      take: SEARCH_LIMIT,
    }),
    db.club.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, meetingCadence: true, isOnline: true },
      orderBy: { updatedAt: "desc" },
      take: SEARCH_LIMIT,
    }),
    db.user.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { username: { contains: term, mode: "insensitive" } },
          { bio: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, username: true, userType: true },
      orderBy: { updatedAt: "desc" },
      take: SEARCH_LIMIT,
    }),
    db.readingChallenge.findMany({
      where: {
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, endDate: true, isPublic: true },
      orderBy: { createdAt: "desc" },
      take: SEARCH_LIMIT,
    }),
  ]);

  return [
    ...books.map((book) => ({
      id: book.id,
      type: "book" as const,
      title: book.title,
      subtitle: book.author,
      href: `/books/${book.id}`,
    })),
    ...clubs.map((club) => ({
      id: club.id,
      type: "club" as const,
      title: club.name,
      subtitle: club.meetingCadence ?? (club.isOnline ? "Online club" : "Local club"),
      href: "/clubs",
    })),
    ...readers.map((reader) => ({
      id: reader.id,
      type: "reader" as const,
      title: reader.name ?? reader.username ?? "Reader",
      subtitle: reader.username ? `@${reader.username}` : reader.userType.toLowerCase(),
      href: reader.id === session.user.id ? "/profile" : "/feed",
    })),
    ...challenges.map((challenge) => ({
      id: challenge.id,
      type: "challenge" as const,
      title: challenge.title,
      subtitle: challenge.isPublic ? "Public challenge" : "Private challenge",
      href: "/challenges",
    })),
  ].slice(0, 12);
}

export async function getShellNotifications(): Promise<ShellNotification[]> {
  const session = await getSession();
  if (!session) return [];

  const userId = session.user.id;

  const [likes, follows, clubMemberships, challengeMemberships] = await Promise.all([
    db.activityLike.findMany({
      where: {
        userId: { not: userId },
        activity: { userId },
      },
      include: {
        user: { select: { name: true, username: true } },
        activity: {
          include: {
            book: { select: { title: true } },
            club: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.clubMember.findMany({
      where: { userId },
      select: { clubId: true },
      take: 30,
    }),
    db.challengeParticipant.findMany({
      where: { userId },
      select: { challengeId: true },
      take: 30,
    }),
  ]);

  const clubIds = clubMemberships.map((membership) => membership.clubId);
  const challengeIds = challengeMemberships.map((membership) => membership.challengeId);

  const [clubPosts, clubPolls, challenges] = await Promise.all([
    clubIds.length
      ? db.clubPost.findMany({
          where: { clubId: { in: clubIds } },
          include: { club: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 4,
        })
      : [],
    clubIds.length
      ? db.clubPoll.findMany({
          where: { clubId: { in: clubIds } },
          include: { club: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 4,
        })
      : [],
    challengeIds.length
      ? db.readingChallenge.findMany({
          where: { id: { in: challengeIds } },
          include: { club: { select: { name: true } }, book: { select: { title: true } } },
          orderBy: { createdAt: "desc" },
          take: 4,
        })
      : [],
  ]);

  const notifications: ShellNotification[] = [
    ...likes.map((like) => {
      const actor = like.user.name ?? like.user.username ?? "A reader";
      const target = like.activity.book?.title ?? like.activity.club?.name ?? "your activity";
      return {
        id: `like-${like.id}`,
        title: `${actor} liked your update`,
        body: target,
        href: "/feed",
        createdAt: like.createdAt.toISOString(),
        type: "like" as const,
      };
    }),
    ...follows.map((follow) => {
      const actor = follow.follower.name ?? follow.follower.username ?? "A reader";
      return {
        id: `follow-${follow.id}`,
        title: `${actor} followed you`,
        body: "Your reading activity now appears in their social graph.",
        href: "/profile",
        createdAt: follow.createdAt.toISOString(),
        type: "follow" as const,
      };
    }),
    ...clubPosts.map((post) => ({
      id: `club-post-${post.id}`,
      title: post.title ?? "New club post",
      body: post.club.name,
      href: "/clubs",
      createdAt: post.createdAt.toISOString(),
      type: "club" as const,
    })),
    ...clubPolls.map((poll) => ({
      id: `club-poll-${poll.id}`,
      title: poll.title,
      body: `New poll in ${poll.club.name}`,
      href: "/clubs",
      createdAt: poll.createdAt.toISOString(),
      type: "club" as const,
    })),
    ...challenges.map((challenge) => ({
      id: `challenge-${challenge.id}`,
      title: challenge.title,
      body: challenge.club?.name ?? challenge.book?.title ?? "Challenge update",
      href: "/challenges",
      createdAt: challenge.createdAt.toISOString(),
      type: "challenge" as const,
    })),
  ];

  return notifications
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);
}
