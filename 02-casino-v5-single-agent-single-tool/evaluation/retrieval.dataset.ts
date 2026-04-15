export type RetrievalTestCase = {
  question: string;
  expectedSections: string[];
};

export const retrievalDataset: RetrievalTestCase[] = [
  // 🟣 Restaurants
  {
    question: "Where can I eat?",
    expectedSections: ["## Restaurants"]
  },
  {
    question: "What food options are available?",
    expectedSections: ["## Restaurants"]
  },
  {
    question: "Are there any restaurants?",
    expectedSections: ["## Restaurants"]
  },
  {
    question: "Can I dine at the resort?",
    expectedSections: ["## Restaurants"]
  },

  // 🟣 Amenities
  {
    question: "Is there a spa?",
    expectedSections: ["## Amenities"]
  },
  {
    question: "Can I relax somewhere?",
    expectedSections: ["## Amenities"]
  },
  {
    question: "What facilities are available?",
    expectedSections: ["## Amenities"]
  },
  {
    question: "Is there a pool?",
    expectedSections: ["## Amenities"]
  },

  // 🟣 Entertainment
  {
    question: "What entertainment is there?",
    expectedSections: ["## Entertainment"]
  },
  {
    question: "Are there live shows?",
    expectedSections: ["## Entertainment"]
  },
  {
    question: "What can I watch there?",
    expectedSections: ["## Entertainment"]
  },

  // 🟣 Rooms
  {
    question: "Can I stay overnight?",
    expectedSections: ["## Rooms"]
  },
  {
    question: "What rooms are available?",
    expectedSections: ["## Rooms"]
  },
  {
    question: "Do you have suites?",
    expectedSections: ["## Rooms"]
  },

  // 🟣 Promotions
  {
    question: "Are there any deals?",
    expectedSections: ["## Promotions"]
  },
  {
    question: "Do you have special offers?",
    expectedSections: ["## Promotions"]
  },
  {
    question: "Are there seasonal promotions?",
    expectedSections: ["## Promotions"]
  },

  // 🟣 Overview (general questions)
  {
    question: "What is Mohegan Sun?",
    expectedSections: ["## Overview"]
  },
  {
    question: "Tell me about the casino resort",
    expectedSections: ["## Overview"]
  }
];