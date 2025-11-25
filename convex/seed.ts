import { mutation } from "./_generated/server";
import { v } from "convex/values";

const questionSchema = v.object({
  prompt: v.string(),
  type: v.union(v.literal("text"), v.literal("multiple_choice"), v.literal("numeric"), v.literal("media")),
  correctAnswer: v.string(),
  acceptedAnswers: v.optional(v.array(v.string())),
  options: v.optional(v.array(v.string())),
  mediaUrl: v.optional(v.string()),
  mediaType: v.optional(v.union(v.literal("image"), v.literal("video"), v.literal("audio"), v.literal("youtube"))),
  answerFields: v.optional(v.array(v.object({
    id: v.string(),
    label: v.string(),
    correctAnswer: v.string(),
    acceptedAnswers: v.optional(v.array(v.string())),
  }))),
  points: v.number(),
});

const roundSchema = v.object({
  title: v.string(),
  type: v.union(v.literal("standard"), v.literal("listening"), v.literal("media")),
  questions: v.array(questionSchema),
});

const gameSchema = v.object({
  joinCode: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  maxTeams: v.optional(v.number()),
  rounds: v.array(roundSchema),
});

export const importGame = mutation({
  args: { game: gameSchema },
  handler: async (ctx, { game }) => {
    // Check if join code already exists
    const existingGame = await ctx.db
      .query("games")
      .withIndex("by_joinCode", (q) => q.eq("joinCode", game.joinCode))
      .first();
    
    if (existingGame) {
      return {
        success: false,
        message: `Game with join code "${game.joinCode}" already exists. Use a different code or delete the existing game.`,
      };
    }

    // Create the game
    const gameId = await ctx.db.insert("games", {
      joinCode: game.joinCode,
      title: game.title,
      description: game.description,
      state: "lobby",
      isArchived: false,
      maxTeams: game.maxTeams ?? 20,
      createdAt: Date.now(),
    });

    let totalQuestions = 0;

    // Create rounds and questions
    for (let roundIndex = 0; roundIndex < game.rounds.length; roundIndex++) {
      const round = game.rounds[roundIndex];
      
      const roundId = await ctx.db.insert("rounds", {
        gameId,
        title: round.title,
        roundNumber: roundIndex + 1,
        type: round.type,
      });

      for (let qIndex = 0; qIndex < round.questions.length; qIndex++) {
        const q = round.questions[qIndex];
        
        await ctx.db.insert("questions", {
          roundId,
          indexInRound: qIndex,
          prompt: q.prompt,
          type: q.type,
          correctAnswer: q.correctAnswer,
          acceptedAnswers: q.acceptedAnswers,
          options: q.options,
          mediaUrl: q.mediaUrl,
          mediaType: q.mediaType,
          answerFields: q.answerFields,
          points: q.points,
        });
        
        totalQuestions++;
      }
    }

    return {
      success: true,
      message: `Game "${game.title}" imported successfully!`,
      data: {
        gameId,
        joinCode: game.joinCode,
        rounds: game.rounds.length,
        questions: totalQuestions,
      },
    };
  },
});

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if games already exist
    const existingGames = await ctx.db.query("games").collect();
    if (existingGames.length > 0) {
      return {
        success: false,
        message: `Database already has ${existingGames.length} games. Clear the database first or skip seeding.`,
      };
    }

    // Game 1: Classical Music Basics
    const game1Id = await ctx.db.insert("games", {
      joinCode: "MUSIC1",
      title: "Classical Music Basics",
      description: "Test your knowledge of classical music fundamentals",
      state: "lobby",
      isArchived: false,
      createdAt: Date.now(),
    });

    const round1_1 = await ctx.db.insert("rounds", {
      gameId: game1Id,
      title: "Famous Composers",
      roundNumber: 1,
      type: "standard",
    });

    const round1_2 = await ctx.db.insert("rounds", {
      gameId: game1Id,
      title: "Musical Terms",
      roundNumber: 2,
      type: "standard",
    });

    const round1_3 = await ctx.db.insert("rounds", {
      gameId: game1Id,
      title: "Listening Round",
      roundNumber: 3,
      type: "listening",
    });

    // Round 1 Questions
    await ctx.db.insert("questions", {
      roundId: round1_1,
      indexInRound: 0,
      prompt: "Who composed the 'Moonlight Sonata'?",
      type: "text",
      correctAnswer: "Ludwig van Beethoven",
      acceptedAnswers: ["Beethoven", "L. van Beethoven", "L.v. Beethoven"],
      points: 10,
    });

    await ctx.db.insert("questions", {
      roundId: round1_1,
      indexInRound: 1,
      prompt: "Which composer wrote 'The Four Seasons'?",
      type: "multiple_choice",
      options: ["Johann Sebastian Bach", "Antonio Vivaldi", "Wolfgang Amadeus Mozart", "George Frideric Handel"],
      correctAnswer: "Antonio Vivaldi",
      points: 10,
    });

    await ctx.db.insert("questions", {
      roundId: round1_1,
      indexInRound: 2,
      prompt: "How many symphonies did Beethoven compose?",
      type: "numeric",
      correctAnswer: "9",
      points: 15,
    });

    await ctx.db.insert("questions", {
      roundId: round1_1,
      indexInRound: 3,
      prompt: "Which composer was known as the 'Father of the Symphony'?",
      type: "text",
      correctAnswer: "Joseph Haydn",
      acceptedAnswers: ["Haydn", "Franz Joseph Haydn", "J. Haydn"],
      points: 10,
    });

    await ctx.db.insert("questions", {
      roundId: round1_1,
      indexInRound: 4,
      prompt: "Who composed 'The Magic Flute'?",
      type: "multiple_choice",
      options: ["Ludwig van Beethoven", "Johann Sebastian Bach", "Wolfgang Amadeus Mozart", "Franz Schubert"],
      correctAnswer: "Wolfgang Amadeus Mozart",
      points: 10,
    });

    // Round 2 Questions
    await ctx.db.insert("questions", {
      roundId: round1_2,
      indexInRound: 0,
      prompt: "What does 'Allegro' mean in musical terms?",
      type: "text",
      correctAnswer: "Fast",
      points: 10,
    });

    await ctx.db.insert("questions", {
      roundId: round1_2,
      indexInRound: 1,
      prompt: "What is the Italian term for 'very loud'?",
      type: "multiple_choice",
      options: ["Piano", "Forte", "Fortissimo", "Mezzo"],
      correctAnswer: "Fortissimo",
      points: 10,
    });

    await ctx.db.insert("questions", {
      roundId: round1_2,
      indexInRound: 2,
      prompt: "What does 'Crescendo' indicate in music?",
      type: "text",
      correctAnswer: "Gradually getting louder",
      points: 10,
    });

    await ctx.db.insert("questions", {
      roundId: round1_2,
      indexInRound: 3,
      prompt: "How many movements does a typical symphony have?",
      type: "numeric",
      correctAnswer: "4",
      points: 15,
    });

    await ctx.db.insert("questions", {
      roundId: round1_2,
      indexInRound: 4,
      prompt: "What is a 'cadenza' in a concerto?",
      type: "text",
      correctAnswer: "A solo passage for the performer",
      points: 15,
    });

    // Round 3 Questions (Listening)
    await ctx.db.insert("questions", {
      roundId: round1_3,
      indexInRound: 0,
      prompt: "Name the composer and piece in this video:",
      type: "media",
      mediaUrl: "https://www.youtube.com/embed/JTc1mDieQI8",
      mediaType: "youtube",
      correctAnswer: "Johann Sebastian Bach - Toccata and Fugue in D minor",
      answerFields: [
        { id: "composer", label: "Composer", correctAnswer: "Johann Sebastian Bach" },
        { id: "piece", label: "Piece Name", correctAnswer: "Toccata and Fugue in D minor" },
      ],
      points: 20,
    });

    // Game 2: Opera & Vocal Music
    const game2Id = await ctx.db.insert("games", {
      joinCode: "OPERA1",
      title: "Opera & Vocal Music",
      description: "From arias to art songs - test your vocal music knowledge",
      state: "lobby",
      isArchived: false,
      createdAt: Date.now() - 86400000, // 1 day ago
    });

    const round2_1 = await ctx.db.insert("rounds", {
      gameId: game2Id,
      title: "Famous Operas",
      roundNumber: 1,
      type: "standard",
    });

    const round2_2 = await ctx.db.insert("rounds", {
      gameId: game2Id,
      title: "Opera Composers",
      roundNumber: 2,
      type: "standard",
    });

    // Round 1 Questions (Game 2)
    await ctx.db.insert("questions", {
      roundId: round2_1,
      indexInRound: 0,
      prompt: "Which opera features the aria 'La donna è mobile'?",
      type: "text",
      correctAnswer: "Rigoletto",
      points: 10,
    });

    await ctx.db.insert("questions", {
      roundId: round2_1,
      indexInRound: 1,
      prompt: "In which language was Mozart's 'The Magic Flute' originally written?",
      type: "multiple_choice",
      options: ["Italian", "German", "French", "Latin"],
      correctAnswer: "German",
      points: 10,
    });

    await ctx.db.insert("questions", {
      roundId: round2_1,
      indexInRound: 2,
      prompt: "What is the name of the famous duet from 'The Pearl Fishers'?",
      type: "text",
      correctAnswer: "Au fond du temple saint",
      points: 15,
    });

    await ctx.db.insert("questions", {
      roundId: round2_1,
      indexInRound: 3,
      prompt: "How many acts does Puccini's 'La Bohème' have?",
      type: "numeric",
      correctAnswer: "4",
      points: 10,
    });

    await ctx.db.insert("questions", {
      roundId: round2_1,
      indexInRound: 4,
      prompt: "Which opera features the 'Habanera'?",
      type: "multiple_choice",
      options: ["Tosca", "Carmen", "Aida", "Madama Butterfly"],
      correctAnswer: "Carmen",
      points: 10,
    });

    // Round 2 Questions (Game 2)
    await ctx.db.insert("questions", {
      roundId: round2_2,
      indexInRound: 0,
      prompt: "Who composed 'The Barber of Seville'?",
      type: "text",
      correctAnswer: "Gioachino Rossini",
      acceptedAnswers: ["Rossini", "G. Rossini"],
      points: 10,
    });

    await ctx.db.insert("questions", {
      roundId: round2_2,
      indexInRound: 1,
      prompt: "Which composer wrote the opera 'Turandot'?",
      type: "multiple_choice",
      options: ["Giuseppe Verdi", "Giacomo Puccini", "Gaetano Donizetti", "Vincenzo Bellini"],
      correctAnswer: "Giacomo Puccini",
      points: 10,
    });

    await ctx.db.insert("questions", {
      roundId: round2_2,
      indexInRound: 2,
      prompt: "Who composed 'Der Ring des Nibelungen' (The Ring Cycle)?",
      type: "text",
      correctAnswer: "Richard Wagner",
      acceptedAnswers: ["Wagner", "R. Wagner"],
      points: 15,
    });

    await ctx.db.insert("questions", {
      roundId: round2_2,
      indexInRound: 3,
      prompt: "How many operas are in Wagner's Ring Cycle?",
      type: "numeric",
      correctAnswer: "4",
      points: 15,
    });

    await ctx.db.insert("questions", {
      roundId: round2_2,
      indexInRound: 4,
      prompt: "Which composer is known for 'The Marriage of Figaro'?",
      type: "text",
      correctAnswer: "Wolfgang Amadeus Mozart",
      acceptedAnswers: ["Mozart", "W.A. Mozart", "W. Mozart"],
      points: 10,
    });

    return {
      success: true,
      message: "Database seeded successfully!",
      data: {
        games: 2,
        game1: { id: game1Id, code: "MUSIC1", rounds: 3, questions: 11 },
        game2: { id: game2Id, code: "OPERA1", rounds: 2, questions: 10 },
      },
    };
  },
});

export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all answers first (due to foreign keys)
    const answers = await ctx.db.query("answers").collect();
    for (const answer of answers) {
      await ctx.db.delete(answer._id);
    }

    // Delete all questions
    const questions = await ctx.db.query("questions").collect();
    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    // Delete all rounds
    const rounds = await ctx.db.query("rounds").collect();
    for (const round of rounds) {
      await ctx.db.delete(round._id);
    }

    // Delete all teams
    const teams = await ctx.db.query("teams").collect();
    for (const team of teams) {
      await ctx.db.delete(team._id);
    }

    // Delete all games
    const games = await ctx.db.query("games").collect();
    for (const game of games) {
      await ctx.db.delete(game._id);
    }

    return {
      success: true,
      message: "Database cleared successfully!",
      deleted: {
        answers: answers.length,
        questions: questions.length,
        rounds: rounds.length,
        teams: teams.length,
        games: games.length,
      },
    };
  },
});

