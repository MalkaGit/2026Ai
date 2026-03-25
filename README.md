##  Overview
This project implements a conversational AI system for a casino hospitality.

The agent can answer questions about:
- restaurants
- amenities
- rooms
- entertainment
- promotions

The agent:
- ✅ answers only based on a single loaded property 
- ❌ does not perform actions (no booking, reservations, payments)
- ❌ does not answer unrelated questions



## Architecture

-The agent answers questions about a single casino property 
 using only local knowledge (src\knowledge\property.md).

-AI agent built using **LangGraph**.  

- When LLM provider is not configured in .env,
  The system degrades gracefully,
  allowing it to run in a deterministic mode for testing and evaluation



---
## ⚙️ Execution & tests

### to run with docker
      Build
      docker build -t casino-property-agent .
      Run
      docker run --env-file .env -p 3000:3000 casino-property-agent

      note: if .evn has no api key, there is a fallbakck (no setup, no key)

### to run without docker

   1. Install dependencies
      npm install
   2. Configure environment
      Create .env:
      PORT=3000
      PROPERTY_NAME=Mohegan Sun
      OPENAI_API_KEY=your_key_here - optional
   3. Run the app
      npm run dev
      note: if .evn has no api key, there is a fallbakck (no setup, no key)


### to test API  from psotman 
   
   GET http://localhost:3000/health

   POST http://localhost:3000/chat 
   "Content-Type: application/json" 
   {"message":"What restaurants are there?"}

   postman collection stored at: 
   \01-casino-property-agent\tests\_tests.postman_collection
               
               ✅ In-scope question
               What restaurants are there?
               → Returns grounded answer

               ✅  Missing information
               What is the check-in age policy?
               → Returns:
               I do not know based on the provided property information.

               ✅ Action request
               Book me a room
               → Rejected

               ✅ Out-of-scope question
               What is the weather in Boston?
               → Rejected

### Automated Tests
   Run:
      npm run test
      What is tested
         • API validation
         • scope logic (blocking invalid requests)
         • property search behavior
      LLM responses are not strictly asserted to avoid brittle tests.



               


---
## 🧠 Architecture

### Flow (**LLM orchestration flow**)
Pipe iincludes: HTTP request → LangGraph agent → nodes → response

### Graph Nodes
1. **Scope Check**
   - Determines if the question is allowed
   - Blocks:
     - booking/actions
     - unrelated questions
2. **Context Retrieval**
   - Extracts relevant sections from property knowledge
   - Uses exact string matching (nessage V knowledge chunk)
3. **Answer Generation**
   - LLM generates answer using only retrieved context
   - If context is missing → returns “I don’t know”

---
## 🧠 Why LangGraph
LangGraph is used to explicitly model the workflow:
- deterministic control over execution
- clear separation between steps
- easy to test and reason about
This is preferred over a “black-box” agent.

---
## 📚 Knowledge Handling
- The agent loads a single property file (knwledge\`property.md`)
- Retrieval is:
  - simple
  - deterministic
  - fast
### Why not embeddings / vector DB?
For this assignment:
- data size is small
- single property context
A simple keyword-based retrieval is sufficient and easier to test.



⚠️ Limitations
	• Single property only               (knwledge\`property.md`)
	• Simple keyword-based retrieval     (exact match and not semilarity)
	• No conversation memory
	• No external integrations           (eg, ingesting property data from web)


🔮 Future Improvements
	• Multi-property support
 	• Better semantic scope detection
     (match question to property chunck by semilarity)
	• Add embeddings / vector search 
	• Conversation memory
	• Observability (tracing)


🧠 Design Summary
This solution prioritizes:
	• clarity
	• control
	• testability
	• simplicity
The system is intentionally minimal while demonstrating:
	• structured LLM orchestration
	• safe prompt usage
	• deterministic boundaries

---
## 🧱 Project Structure

src/
   api/
      chat/
         chat.route.ts
         chat.types.ts
   agent/
      agent.graph.ts
      agent.state.ts
      agent.prompts.ts
   tools/
      property.loader.ts
      property.search.ts
      scope.service.ts
   prompts/
   knowledge/
      property.md
   config/
      env.ts
   app.ts
   server.ts

### Key Design Decisions
- **Agent layer (LangGraph)** acts as the application service
- **Tools** provide deterministic logic (scope, retrieval)
- **Prompts** are separated as a first-class concern  (Not for now)
- **Knowledge** is local and property-specific





