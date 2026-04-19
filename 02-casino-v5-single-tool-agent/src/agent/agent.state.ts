
export interface AgentState {
  question: string;
  propertyName: string;
  propertyContent: string;
  isInScope: boolean;
  rejectionReason?: string;

  //agent state includes the result of decideAction step (node).
  //when agent asks llm which action to run, llm replies 
  //and agnet stores llm result in agent state
  action?: "search_property" | "answer_directly";   //llm decision: the action that the agent should run 
  actionInput?: string;                             //llm decision: the question that the agent should pass to the tool  (lets the LLM slightly rewire the user's question if usefull)
  
  //agent state includes the result of retrieveContext step (node).
  //when agent calls retrieveContext tool, it returns the chunks and citations
  //and agnet stores the result in agent state
  retrievedChunks: string[];
  citations: string[];

  //agent state includes the result of answerQuestion step (node).
  //when agent calls answerQuestion tool, it returns the answer and grounded
  //and agnet stores llm result in agent state
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