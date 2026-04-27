-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('READER', 'ORGANISER', 'MEMBER', 'INFLUENCER');

-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('WANT_TO_READ', 'CURRENTLY_READING', 'READ', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('USER_TO_USER', 'USER_TO_BOOK', 'USER_TO_CLUB', 'CLUB_TO_BOOK');

-- CreateEnum
CREATE TYPE "MatchConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('OPEN', 'APPLICATION', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ClubVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('OWNER', 'ORGANISER', 'MEMBER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('ACTIVE', 'CLOSED', 'DRAFT');

-- CreateEnum
CREATE TYPE "VoteMode" AS ENUM ('SINGLE', 'MULTI');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('BOOKS_PER_YEAR', 'PAGES_PER_MONTH', 'MINUTES_PER_DAY');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('FASTEST_FINISH', 'MOST_PAGES_WEEK', 'MOST_MINUTES_MONTH', 'CLUB_MONTHLY', 'FRIEND_GROUP', 'PERSONAL_GOAL');

-- CreateEnum
CREATE TYPE "FeedItemType" AS ENUM ('REVIEW_CREATED', 'BOOK_FINISHED', 'BOOK_STARTED', 'CLUB_JOINED', 'CHALLENGE_JOINED', 'CHALLENGE_COMPLETED', 'ACHIEVEMENT_EARNED', 'CLUB_POST', 'CLUB_POLL', 'READING_MILESTONE', 'TASTE_EVOLUTION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "username" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "userType" "UserType" NOT NULL DEFAULT 'READER',
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authors" TEXT[],
    "isbn" TEXT,
    "cover" TEXT,
    "description" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publisher" TEXT,
    "pageCount" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'en',
    "genres" TEXT[],
    "tags" TEXT[],
    "avgRating" DOUBLE PRECISION,
    "ratingsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookTasteDimension" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "pace" DOUBLE PRECISION,
    "tone" DOUBLE PRECISION,
    "focus" DOUBLE PRECISION,
    "emotionalIntensity" DOUBLE PRECISION,
    "romanceLevel" DOUBLE PRECISION,
    "complexity" DOUBLE PRECISION,
    "worldbuildingDepth" DOUBLE PRECISION,
    "discussionPotential" DOUBLE PRECISION,

    CONSTRAINT "BookTasteDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "status" "ReadingStatus" NOT NULL DEFAULT 'WANT_TO_READ',
    "rating" INTEGER,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewLike" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ReviewLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shelf" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShelfBook" (
    "id" TEXT NOT NULL,
    "shelfId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShelfBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasteProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topGenres" TEXT[],
    "topAuthors" TEXT[],
    "topThemes" TEXT[],
    "topMoods" TEXT[],
    "pace" DOUBLE PRECISION,
    "tone" DOUBLE PRECISION,
    "focus" DOUBLE PRECISION,
    "emotionalIntensity" DOUBLE PRECISION,
    "romanceLevel" DOUBLE PRECISION,
    "complexity" DOUBLE PRECISION,
    "worldbuildingDepth" DOUBLE PRECISION,
    "discussionPotential" DOUBLE PRECISION,
    "cluster" TEXT,
    "dislikedGenres" TEXT[],
    "dislikedThemes" TEXT[],
    "dislikedAuthors" TEXT[],
    "confidence" "MatchConfidence" NOT NULL DEFAULT 'LOW',
    "lastCalculated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TasteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasteDimensionScore" (
    "id" TEXT NOT NULL,
    "tasteProfileId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TasteDimensionScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasteMatch" (
    "id" TEXT NOT NULL,
    "userAId" TEXT,
    "userBId" TEXT,
    "bookId" TEXT,
    "clubId" TEXT,
    "matchType" "MatchType" NOT NULL,
    "score" INTEGER NOT NULL,
    "confidence" "MatchConfidence" NOT NULL,
    "matchReasons" TEXT[],
    "positiveSignals" JSONB NOT NULL,
    "negativeSignals" JSONB NOT NULL,
    "sharedBooks" TEXT[],
    "sharedGenres" TEXT[],
    "sharedAuthors" TEXT[],
    "sharedThemes" TEXT[],
    "sharedTasteDimensions" TEXT[],
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "TasteMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasteCluster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "genres" TEXT[],
    "themes" TEXT[],
    "dimensions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TasteCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "favoriteGenres" TEXT[],
    "favoriteBookIds" TEXT[],
    "dislikedBookIds" TEXT[],
    "favoriteAuthors" TEXT[],
    "preferredMoods" TEXT[],
    "preferredThemes" TEXT[],
    "readingGoalBooksPerYear" INTEGER,
    "clubPreference" TEXT,
    "interestedInClubs" BOOLEAN NOT NULL DEFAULT false,
    "interestedInChallenges" BOOLEAN NOT NULL DEFAULT false,
    "userType" "UserType" NOT NULL DEFAULT 'READER',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OnboardingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "banner" TEXT,
    "avatar" TEXT,
    "ownerId" TEXT NOT NULL,
    "genres" TEXT[],
    "themes" TEXT[],
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "meetingCadence" TEXT,
    "membershipType" "MembershipType" NOT NULL DEFAULT 'OPEN',
    "visibility" "ClubVisibility" NOT NULL DEFAULT 'PUBLIC',
    "maxMembers" INTEGER,
    "currentBookId" TEXT,
    "upcomingBookId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMember" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClubRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubApplication" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubReadingHistory" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "avgRating" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "ClubReadingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubPost" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubDiscussion" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "discussionId" TEXT,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubPoll" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PollStatus" NOT NULL DEFAULT 'ACTIVE',
    "voteMode" "VoteMode" NOT NULL DEFAULT 'SINGLE',
    "resultsVisible" BOOLEAN NOT NULL DEFAULT false,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubPollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "bookId" TEXT,
    "label" TEXT NOT NULL,
    "matchScore" INTEGER,
    "matchReasons" TEXT[],

    CONSTRAINT "ClubPollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pagesRead" INTEGER,
    "minutesRead" INTEGER,
    "chaptersRead" INTEGER,
    "notes" TEXT,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "target" INTEGER NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,

    CONSTRAINT "ReadingGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingChallenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ChallengeType" NOT NULL,
    "creatorId" TEXT NOT NULL,
    "clubId" TEXT,
    "bookId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "target" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeParticipant" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChallengeParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "points" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "UserScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "type" "FeedItemType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "content" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relevanceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");

-- CreateIndex
CREATE INDEX "Book_author_idx" ON "Book"("author");

-- CreateIndex
CREATE UNIQUE INDEX "BookTasteDimension_bookId_key" ON "BookTasteDimension"("bookId");

-- CreateIndex
CREATE INDEX "UserBook_userId_status_idx" ON "UserBook"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserBook_userId_bookId_key" ON "UserBook"("userId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_bookId_key" ON "Review"("userId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewLike_reviewId_userId_key" ON "ReviewLike"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "Shelf_userId_idx" ON "Shelf"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShelfBook_shelfId_bookId_key" ON "ShelfBook"("shelfId", "bookId");

-- CreateIndex
CREATE UNIQUE INDEX "TasteProfile_userId_key" ON "TasteProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TasteDimensionScore_tasteProfileId_dimension_key" ON "TasteDimensionScore"("tasteProfileId", "dimension");

-- CreateIndex
CREATE INDEX "TasteMatch_userAId_matchType_idx" ON "TasteMatch"("userAId", "matchType");

-- CreateIndex
CREATE INDEX "TasteMatch_clubId_matchType_idx" ON "TasteMatch"("clubId", "matchType");

-- CreateIndex
CREATE UNIQUE INDEX "TasteCluster_name_key" ON "TasteCluster"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingData_userId_key" ON "OnboardingData"("userId");

-- CreateIndex
CREATE INDEX "Club_genres_idx" ON "Club"("genres");

-- CreateIndex
CREATE INDEX "Club_isOnline_idx" ON "Club"("isOnline");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_clubId_userId_key" ON "ClubMember"("clubId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubApplication_clubId_userId_key" ON "ClubApplication"("clubId", "userId");

-- CreateIndex
CREATE INDEX "ClubReadingHistory_clubId_idx" ON "ClubReadingHistory"("clubId");

-- CreateIndex
CREATE INDEX "ClubPoll_clubId_status_idx" ON "ClubPoll"("clubId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ClubVote_pollId_memberId_optionId_key" ON "ClubVote"("pollId", "memberId", "optionId");

-- CreateIndex
CREATE INDEX "ReadingSession_userId_date_idx" ON "ReadingSession"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingGoal_userId_type_year_key" ON "ReadingGoal"("userId", "type", "year");

-- CreateIndex
CREATE INDEX "ReadingChallenge_clubId_idx" ON "ReadingChallenge"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeParticipant_challengeId_userId_key" ON "ChallengeParticipant"("challengeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserScore_userId_key" ON "UserScore"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "FeedItem_userId_createdAt_idx" ON "FeedItem"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookTasteDimension" ADD CONSTRAINT "BookTasteDimension_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBook" ADD CONSTRAINT "UserBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBook" ADD CONSTRAINT "UserBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewLike" ADD CONSTRAINT "ReviewLike_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shelf" ADD CONSTRAINT "Shelf_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfBook" ADD CONSTRAINT "ShelfBook_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShelfBook" ADD CONSTRAINT "ShelfBook_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TasteProfile" ADD CONSTRAINT "TasteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TasteDimensionScore" ADD CONSTRAINT "TasteDimensionScore_tasteProfileId_fkey" FOREIGN KEY ("tasteProfileId") REFERENCES "TasteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingData" ADD CONSTRAINT "OnboardingData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_currentBookId_fkey" FOREIGN KEY ("currentBookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_upcomingBookId_fkey" FOREIGN KEY ("upcomingBookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubApplication" ADD CONSTRAINT "ClubApplication_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubApplication" ADD CONSTRAINT "ClubApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubReadingHistory" ADD CONSTRAINT "ClubReadingHistory_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubReadingHistory" ADD CONSTRAINT "ClubReadingHistory_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPost" ADD CONSTRAINT "ClubPost_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubDiscussion" ADD CONSTRAINT "ClubDiscussion_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubComment" ADD CONSTRAINT "ClubComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ClubPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubComment" ADD CONSTRAINT "ClubComment_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "ClubDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPoll" ADD CONSTRAINT "ClubPoll_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPollOption" ADD CONSTRAINT "ClubPollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "ClubPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubPollOption" ADD CONSTRAINT "ClubPollOption_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubVote" ADD CONSTRAINT "ClubVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "ClubPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubVote" ADD CONSTRAINT "ClubVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ClubPollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubVote" ADD CONSTRAINT "ClubVote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingGoal" ADD CONSTRAINT "ReadingGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingChallenge" ADD CONSTRAINT "ReadingChallenge_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingChallenge" ADD CONSTRAINT "ReadingChallenge_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "ReadingChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserScore" ADD CONSTRAINT "UserScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
