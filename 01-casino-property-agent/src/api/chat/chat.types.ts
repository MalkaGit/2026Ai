export interface ChatRequest {
    message: string;
  }
  export interface ChatResponse {
    answer: string;
    property: string;
    grounded: boolean;
    citations: string[];
  }
  