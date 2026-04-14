/**
 * Checks if the agent can answer the question (before calling the LLM)
 * @param question - the question to evaluate
 * @returns the scope check result
 * if the question is about an action, return false
 * if the question is not about a property, return false
 */
export function evaluateQuestionScope(question: string): ScopeCheckResult {
  if (isActionRequest(question)) {
    return {
      isInScope: false,
      rejectionReason: "I can answer questions about the property, but I cannot make bookings, reservations, payments, or account changes."
    };
  }

  if (!isPropertyQuestion(question)) {
    return {
      isInScope: false,
      rejectionReason:  "I can only answer questions about the loaded casino property and its amenities, rooms, dining, entertainment, and related guest information."
    };
  }

  return {
    isInScope: true
  };
}

export interface ScopeCheckResult {
  isInScope: boolean;
  rejectionReason?: string;
}

/**
 * Checks if the question is about an action
 * @param question - the question to evaluate
 * @returns true if the question is about an action, false otherwise
 */
function isActionRequest(question: string): boolean {
    const normalized = question.toLowerCase();
  const actionPhrases = [
      "book",
      "reserve",
      "reservation",
      "cancel my booking",
      "change my booking",
      "make a reservation",
      "pay",
      "charge",
      "open account",
      "check my account"
    ];
  return actionPhrases.some((phrase) => normalized.includes(phrase));
}


/**
 * Checks if the question is about a property
 * @param question - the question to evaluate
 * @returns true if the question is about a property, false otherwise
 */
function isPropertyQuestion(question: string): boolean {
    const normalized = question.toLowerCase();
  const propertyKeywords = [
      "restaurant",
      "restaurants",
      "food",
      "dining",
      "spa",
      "pool",
      "room",
      "rooms",
      "suite",
      "suites",
      "hotel",
      "casino",
      "promotion",
      "promotions",
      "show",
      "shows",
      "entertainment",
      "amenities",
      "parking",
      "property",
      "resort"
    ];
  
  return propertyKeywords.some((keyword) => normalized.includes(keyword));
  }
  