You are a technical documentation specialist. Your task is to merge two attached documents—**agent-prompt-edoreczenia-implementation.md**, **edoreczenia-additional-information.md** and **reimplementation-guide-v2.md**—into a single, consolidated prompt designed for a coding agent to execute. 

Pomiń informacje, które są zawarte w pliku `agents.md` i zostaną i tak uwzględnione przy rozpoczęciu kodowania.

**What to preserve from both documents:**
- The complete technical objective and scope (reference recurements to business document: `docs\docs\domains\prawo\administracja-publiczna\wdrozenie\records-przesylki-wplywajace.mdx`)
- Use the mapping info `docs\docs\domains\prawo\administracja-publiczna\mapping\openmercato-ezd\index.mdx`
- Use the UI if needed `docs\docs\domains\prawo\administracja-publiczna\example UI`
- All architectural requirements: Yarn 4 monorepo, Next.js 16 App Router, MikroORM/PostgreSQL backend, Turborepo orchestration
- Core entities and their relationships: RecordsIncomingShipment, RecordsDocument, RecordsJrwaClass, CorrespondenceSource
- All implementation phases (0 through 4) with their timeframes and deliverables
- Mandatory validation gates and success criteria from both sources
- Quality expectations: 80% unit test coverage + integration tests + manual runtime smoke tests
- Critical technical rules: module registration before UI creation, post-backend compilation steps, naming conventions, feature toggles, i18n patterns

**What to synthesize:**
- Extract the actionable implementation plan from both documents (no code examples or finished implementations)
- Consolidate the four-phase structure with explicit validation checkpoints at each phase boundary
- Integrate the three-layer testing strategy: unit tests (mocked), integration tests (real database), runtime smoke tests (manual browser)
- Merge overlapping instructions into single, clear directives
- Emphasize the lesson from the first failure: passing tests alone don't guarantee working applications—integration and manual validation are mandatory
- Organize requirements so the coding agent understands the full technical scope, architectural patterns, and quality gates in one reading

**Output format:**
Deliver a single prompt written in second person, addressed directly to a coding agent. The prompt must be ready to copy-paste and execute immediately. It should contain:
- The technical objective and deliverables (29 pages, 6 table components, feature toggles, full test coverage)
- All architecture and entity specifications from the implementation guide
- The four-phase implementation roadmap with concrete milestones and deliverables per phase
- The three-layer testing strategy with explicit requirements for each layer
- Validation gates: what must be confirmed before proceeding to the next phase
- Coding standards and patterns: naming conventions, i18n approach, FeatureGuard wrapping, configuration validation
- Dependencies and system context: Yarn build commands, module registry generation, backend compilation requirements
- Success criteria: what constitutes "Done" for each phase (working UI + passing integration tests + manual browser validation, not just green unit tests)

**Do not include:**
- Code examples or partial implementations
- Meta-commentary about the source documents or their failure history
- Instructions for how the agent should structure their code (they will determine that based on the architecture provided)
- Explanations of design decisions or rationale

**Focus on:** *What needs to be built* (29 pages with specific types, 6 components), *how it works technically* (architecture, entities, services, API routes), and *how quality is validated at each step* (no proceeding without passing integration tests and manual browser confirmation).