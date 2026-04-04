
export interface AgentState {
  question: string;
  propertyName: string;
  propertyContent: string;
  isInScope: boolean;
  rejectionReason?: string;
  retrievedChunks: string[];
  citations: string[];
  answer: string;
  grounded: boolean;
}

/*
export interface AgentState {
    question: string;
    isInScope: boolean;
    retrievedChunks: string[];
    answer: string;
    grounded: boolean;
    citations: string[];
  }
  */