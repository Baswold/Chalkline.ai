# Chalkline.AI

so, this would be a ai interface that would let a teacher set homework/tasks for students, and then you could do them *inside* the ai tool. it would let you chat to an ai assistant, have something akin to google docs where you can do your homework, a back end for the teacher(s) to set homework, tasks, projects .ect. to prevent cheating, there would be strict guard rails where the ai would only answer direct questions about topics it *knows* are not in homework, as it will know the tasks set. It will need a way to sync with a teachers doc so they can view work, a drawing tool for drawing on stuff, some sort of ai thing, so maybe like a image gen from drawings, so if a student draws a square like this:

![Screenshot 2025-08-10 at 1.17.11 pm.png](Chalkline%20AI%2024b9ccf78c82803c8995e3a41f2fd179/Screenshot_2025-08-10_at_1.17.11_pm.png)

it would turn it into this: 

![Screenshot 2025-08-10 at 1.18.36 pm.png](Chalkline%20AI%2024b9ccf78c82803c8995e3a41f2fd179/Screenshot_2025-08-10_at_1.18.36_pm.png)

### Answer policy

if you are struggling with a question, it will look if you have answered the question, then if you have not, tell you to have a crack. once you have, it will look at it, and tell you a website maybe? that you can visit to learn more, or some other way that *helping not doing.* it would need Kami capabilities too, as we use that a lot in class.

### Self marking?

maybe self marking  for the teachers? if they provide the marking rubric, than that would be good. it could then read the entire doc, and give feedback on it. this would be optional, as teachers might like marking themselves.

### questions and Student struggle

another thing [School AI](https://schoolai.com) does is tells the teacher that a student may be struggling either emotionally or with the work, and then the teacher can do what they wish. this is a nice feature.
APIs… this will be a struggle, as it will need a new one per app. is there a way to make it so that it will automatically make a new api? yes, the school would have to pay a bit, but it hink it would be worth it.

---

# AIs views and thoughts:

# **1) The open question you left (APIs)**

> “APIs… this will be a struggle, as it will need a new one per app. is there a way to make it so that it will automatically make a new api?”
> 

Short answer: you don’t auto-create “new APIs” per app; you set up **multi-tenant connectors** and let schools **consent** to them.

- **Google Workspace / Classroom**: Publish a single multi-tenant Workspace/Marketplace app with OAuth 2.0 + (optionally) domain-wide delegation. Each school’s admin consents once, and all users in that domain can use the connector. Pilot AI features and lesson-planning are already flowing into Classroom and LearnLM/Gemini, so you’ll want to be a “good neighbor” in that ecosystem.
- **Microsoft 365 / Teams for EDU**: Create one Azure App Registration marked multi-tenant. Schools consent via Entra ID; you integrate with Graph/Assignments and Copilot EDU programs.
- **LMS (Canvas/Moodle/Schoology/D2L)**: Use **LTI 1.3 + LTI Advantage**. You register one tool; each institution completes a deployment (keys/Issuer). This scales cleanly and is the standard way to plug into LMSes.
- **LLM vendors**: Don’t hand out raw provider keys per school. Run your own **LLM proxy/gateway** (rate limits, budget buckets, audit logs) and meter usage per tenant.

# **2) Product sharpeners (with paste-ready snippets)**

## **A. Core architecture (high level)**

- **Auth**: OAuth 2.0 (Google/Microsoft), plus school SSO.
- **Connectors**: Google Classroom + Drive, Microsoft Assignments/OneDrive, LMS via LTI 1.3.
- **Doc editor**: ProseMirror/TipTap (rich text, comments), PDF.js (Kami-style annotations).
- **LLM Gateway**: your proxy fronting providers (OpenAI/Anthropic/local).
- **Policy engine**: checks assignment context → decides “hint vs. answer.”
- **Rubric service**: rubric JSON → structured evaluation + teacher override.
- **Signals**: engagement metrics (time on task, revision churn) → “may be struggling” **suggestion** (opt-in, never diagnostic).

## **B. “Don’t do my homework—help me do it” policy**

**Idea:** Load the active assignment context. If the student hasn’t attempted, nudge them to “have a crack.” If they have, allow **Socratic hints** or direct them to sources; block “full answer dumps.”

**TypeScript (policy + hinting skeleton):**

```jsx
// aiPolicy.ts
type Assignment = { id:string; title:string; questions:string[] };
type Submission = { questionId:string; text:string; attempts:number };

export function decideResponseMode(
  userMsg: string,
  assignment: Assignment | null,
  submission: Submission | null
): "NORM_CHAT" | "TRY_FIRST" | "HINTS_ONLY" {
  if (!assignment) return "NORM_CHAT";
  const asksForAnswer = /\b(answer|solve|what's.*answer|final.*answer)\b/i.test(userMsg);
  const isOnAssignment = assignment.questions.some(q => userMsg.toLowerCase().includes(q.toLowerCase()));
  if (!isOnAssignment) return "NORM_CHAT";
  if (submission?.attempts === 0) return "TRY_FIRST";
  return asksForAnswer ? "HINTS_ONLY" : "HINTS_ONLY";
}
```

**Response builder:**

```jsx
// response.ts
import { decideResponseMode } from "./aiPolicy";

export async function buildTutorReply(ctx) {
  const mode = decideResponseMode(ctx.msg, ctx.assignment, ctx.submission);
  if (mode === "TRY_FIRST") {
    return "Have a crack first—write your best attempt below. I’ll then nudge you with targeted hints.";
  }
  if (mode === "HINTS_ONLY") {
    return await generateHints(ctx); // uses RAG + Socratic questions
  }
  return await normalChat(ctx);
}
```

## **C. “Press space for AI” inline assist**

Spacebar is used constantly; popping AI on every space is chaos. Safer: **hold Space ≥ 500 ms** or **Cmd/Ctrl+J** to open ghost suggestions.

**TipTap plugin sketch (React/TypeScript):**

```jsx
// aiInlineAssist.ts
import { Plugin } from 'prosemirror-state';

export const aiInlineAssist = () => new Plugin({
  props: {
    handleKeyDown(view, event) {
      if ((event.code === "Space" && event.repeat) || (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "j") {
        openAISuggestionPopover(view); // fetches context-aware “complete next step” suggestions
        event.preventDefault();
        return true;
      }
      return false;
    }
  }
});
```

## **D. Kami-style annotation and drawing**

Use **PDF.js** for rendering, store annotations as W3C Web Annotations (portable). A “shape-snap” layer turns rough drawings into clean geometry.

**Shape snap (rough sketch):**

```jsx
// snap.ts
export function snapToShape(points: {x:number,y:number}[]) {
  // Compute best-fit: line, rectangle, circle using least squares; return vector params
  // Outline omitted for brevity; emit SVG path + editable handles
  return { kind:"rectangle", svgPath:"M..." };
}
```

**Doc–>Kami parity:** open PDFs, highlight/ink/text, Drive/OneDrive integrations.

## **E. “Draw → clean figure” and optional image gen**

- For crisp geometry: snap + export to SVG.
- For pretty renders: use **edge-to-image** via ControlNet-style models (if allowed in your environment) using your LLM gateway to call an image backend. (Keep it optional for schools.)

## **F. Self-marking with a teacher-provided rubric (teacher is always in charge)**

**Rubric schema + evaluator (Python):**

```jsx
# rubric_eval.py
from pydantic import BaseModel, Field
from typing import List, Optional

class Criterion(BaseModel):
    id: str
    description: str
    levels: List[dict]  # [{"label":"Excellent","min":4,"max":4}, ...]

class Rubric(BaseModel):
    id: str
    criteria: List[Criterion]
    weighting: Optional[dict] = None  # {"criterion_id": 0.25, ...}

def evaluate_submission(rubric: Rubric, submission_text: str, model_call):
    analysis = model_call(prompt=f"""
You are grading with this rubric:\n{rubric.model_dump_json()}\n
Student submission:\n{submission_text}\n
Return JSON: for each criterion -> chosen level and justification in 1–3 sentences. Also return overall suggestions.
Only grade; do not rewrite the student's work.
""")
    return analysis  # store alongside teacher overrides
```

**Notes:** Many schools also use **Gradescope** for AI-assisted grouping/marking; your flow should import/export with it gracefully.

## **G. “Have a crack → then help” flow (front end)**

```jsx
// attemptFlow.ts
if (mode === "TRY_FIRST") {
  showBanner("Give it a go. Submit your attempt to unlock hints.");
  lockHints(true);
} else {
  lockHints(false);
}
```

**H. LLM gateway with tenant budgets and logs**

```jsx
// llmGateway.ts (Express)
app.post("/v1/llm", async (req, res) => {
  const { tenantId, prompt } = req.body;
  const budget = await getBudget(tenantId);
  if (!budget.hasRemaining()) return res.status(402).send("Tenant budget exhausted");
  const policyOk = await policyCheck(prompt, tenantId);
  if (!policyOk) return res.status(200).json({ content: "I can offer hints, not answers." });

  const provider = selectProviderForTenant(tenantId); // OpenAI/Anthropic/local
  const result = await provider.chat(prompt);
  await logUsage(tenantId, result.tokens);
  res.json(result);
});
```

## **I. Signals for “may be struggling” (ethics-first)**

Use **engagement heuristics** (time-on-task, repeated blank submissions, rapid copy-paste) + **explicit student check-ins**. Never infer mental health. The teacher gets a **gentle nudge**, not a label.

## **J. Connectors quick-start**

- **Google Classroom/Drive** to list coursework, submissions, and attach Docs: handled via Classroom + Drive APIs, which Google is actively evolving with AI-assisted planning and “guided learning”.
- **Microsoft EDU** via Graph; Copilot EDU guidance exists.
- **LMS via LTI 1.3** for grade return and roster sync.

# **3) Competitive landscape (and where you win)**

**Tutor/Study assistants**

- **ChatGPT Study Mode** – Socratic tutoring + scaffolds; strong for concept learning, but can still be coaxed into writing.
- **Google NotebookLM** – document-grounded study, now with “featured notebooks” and audio summaries; great for source-faithful Q&A.
- **Gemini Guided Learning** – step-by-step, quizlike flows aimed at avoiding cheating.
- **Khanmigo** – nonprofit positioning, district offers, AI tutor + teacher tools.

**Grading & integrity**

- **Gradescope (Turnitin)** – AI-assisted answer grouping and faster grading. You should integrate/export here, not replace it out of the gate.
- **Turnitin AI detection** – widely used, accuracy debated; treat as **one signal**, not a verdict.

**Annotation/worksheets**

- **Kami** – entrenched in K-12 for PDFs, Drive/OneDrive flows; your editor should meet this baseline and add the AI guardrails+hints.

**LMS ecosystems**

- **Google Classroom** and **Canvas (LTI 1.3)** are the rails. Ride them, don’t fight them.

**Name collision alert**

There’s an existing **SchoolAI** platform aimed at “student success” and teacher insights. If you plan to go public, consider a distinct brand.

## **Your wedge (how “School AI” beats them)**

- **Policy-first homework guardrails** that are assignment-aware (RAG from the *actual* task), not generic chat.
- **Unified workspace**: chat + doc + annotation + drawing-to-clean-figure in one canvas; teacher can see *thinking traces* and version history.
- **Teacher-controlled rubrics** with fast AI pre-marking and clean override UX (Gradescope-style grouping, but in your editor).
- **Privacy posture**: minimal data retention, clear audit trails, tenant-level LLM proxying.

# **4) Practical risks & mitigations**

- **“Space to open AI” UX**: switch to hold-space or Cmd/Ctrl+J to avoid accidental triggers.
- **False flags on “struggling”**: use opt-in signals + a **“Check on me”** button students can press.
- **AI detection expectations**: set the norm that you evaluate **process + drafts + oral checks**, not just final text.
- **Jurisdictional privacy**: store in region; let admins choose providers; ship a data processing addendum template.

# **5) Fast next steps (you can actually build this this week)**

1. TipTap editor + PDF.js annotations + the **TRY_FIRST/HINTS_ONLY** policy shown above.
2. LLM gateway with tenant budgets and full request logs.
3. One connector (pick Google Classroom first for reach), read-only list + attach submissions.
4. A minimal rubric evaluator (Python) with JSON import/export.

---

> Why not a Notion clone?
> 

> Homework is multi-modal (PDFs, diagrams, short answers) and time-bounded. A Studio layout surfaces
> 
> 
> **task state, hints, and rubric**
> 

> 
> 

> Guardrails philosophy
> 
- Detect if the user is on an assignment; if no attempt, return **TRY_FIRST**.
- After an attempt, allow **HINTS_ONLY** (Socratic nudges, worked examples with holes, sources).
- Full answers only in **teacher-approved reveal** mode or after submission is graded.

> 
> 

> Signals without creepiness
> 

> Time-on-task, revision churn, and “blank retries” can
> 
> 
> **suggest**
> 
> **“Ask my teacher to check in.”**
> 

> 
> 

> Rubrics > detectors
> 

> Use teacher rubrics and revision trail for authenticity. AI detection is one noisy signal, not a verdict. Assess
> 
> 
> **process**
> 

> 
> 

> Privacy posture
> 

> Tenant LLM gateway, short retention, per-tenant budgets and logs, regional storage. Admin chooses providers.
> 

> 
> 

> Keyboard UX
> 
- Hold **Space** to open hints under the cursor.
- **Cmd/Ctrl+J**: inline ghost suggestion.
- **Cmd/Ctrl+/**: command palette (insert diagram, convert sketch → SVG, cite source).

> 
> 

> Teacher speed
> 
- “Pre-mark” pass with rubric JSON → teacher approves/edits.
- Group similar answers (Gradescope-style) to batch feedback.

> 
> 

> Naming nits
> 

> Consider a distinct brand to avoid collision with “SchoolAI”:
> 
> 
> **Homeroom**
> 
> **Studio Class**
> 
> **Chalkline**
> 
> **DraftLab**
> 
> **Guided**
> 

```jsx
// App.tsx
export default function App() {
  return (
    <div className="layout">
      <header>Homeroom • Algebra 9 • Kaladin K.</header>
      <aside className="tray"><AssignmentTray/></aside>
      <main className="work"><WorkArea/></main>
      <aside className="tutor"><TutorDock/></aside>
      <footer className="timeline"><Timeline/></footer>
    </div>
  );
}
```

```jsx
/* layout.css */
.layout {
  display: grid;
  grid-template-rows: 48px 1fr 120px;
  grid-template-columns: 280px 1fr 360px;
  grid-template-areas:
    "hdr hdr hdr"
    "tray work tutor"
    "timeline timeline tutor";
  height: 100vh;
}
header { grid-area: hdr; }
.tray { grid-area: tray; overflow:auto; }
.work { grid-area: work; overflow:auto; }
.tutor { grid-area: tutor; overflow:auto; border-left: 1px solid #ddd; }
.timeline { grid-area: timeline; overflow:auto; border-top: 1px solid #ddd; }
```

```jsx
// WorkArea.tsx (tabs for Doc/PDF/Board)
export function WorkArea() {
  const [tab, setTab] = useState<"DOC"|"PDF"|"BOARD">("DOC");
  return (
    <>
      <TabBar tabs={["DOC","PDF","BOARD"]} value={tab} onChange={setTab}/>
      {tab==="DOC" && <DocEditor/>}
      {tab==="PDF" && <PdfAnnotator/>}
      {tab==="BOARD" && <Whiteboard/>}
    </>
  );
}
```

```jsx
// keybinds.ts – hold Space + Cmd/Ctrl+J
export function installKeybinds(root: HTMLElement, openHints: ()=>void, inlineSuggest: ()=>void) {
  let spaceDownAt: number | null = null;
  root.addEventListener("keydown", e => {
    if (e.code==="Space" && !e.repeat) { spaceDownAt = Date.now(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==="j") { e.preventDefault(); inlineSuggest(); }
  });
  root.addEventListener("keyup", e => {
    if (e.code==="Space" && spaceDownAt) {
      const held = Date.now() - spaceDownAt;
      if (held >= 500) openHints(); // summon hints
      spaceDownAt = null;
    }
  });
}
```

```jsx
// tutorPolicy.ts – uses your TRY_FIRST/HINTS_ONLY modes
export function tutorReply(ctx){
  const mode = decideResponseMode(ctx.msg, ctx.assignment, ctx.submission);
  if (mode==="TRY_FIRST") return banner("Give it a go. Submit an attempt to unlock hints.");
  if (mode==="HINTS_ONLY") return generateHints(ctx);
  return normalChat(ctx);
}
```

```jsx
// rubricTicks.ts – show rubric in the timeline
type Tick = { t: number; criterionId: string; level: string; note?: string };
export function renderTicks(ticks: Tick[]) {
  // group by criterion, draw layered bars with hover notes
}
```

# **Teacher & student flows (quick and concrete)**

- **Student**: Open assignment → Studio loads → banner “Have a crack.” → attempt → submit draft → hints unlock → iterate → submit final → oral check (optional).
- **Teacher**: Create task (rubric optional) → students’ drafts stream in → run pre-mark pass → batch group similar answers → nudge individuals flagged by signals → return with rubric ticks and feed items.

# **Competitive shape (non-Notion inspirations)**

- **Kami** for PDF/ink baseline.
- **Gradescope** for grouping + fast marking.
- **Desmos Classroom** for stepwise guardrails in maths.
- **Replit/VS Code** for split-pane focus and keybindings.

# **Build order (2 sprints)**

- **Sprint 1**: Studio layout, Doc editor (TipTap), PDF.js annotator, TRY_FIRST/HINTS_ONLY, tutor dock, version timeline.
- **Sprint 2**: Rubric pre-mark pass, grouping view, Canvas tab (basic shapes + snap), Classroom read-only connector, tenant LLM gateway.

---

# Prompt for Claude Code

```markdown
You are CLAUDE CODE, my heads-down implementation copilot for “Assignment Studio” (aka Homeroom). Your job is to write, refactor, run, and explain code with high mechanical sympathy. Deliver working software first, commentary second.

## Mission
Build a small but real MVP:
- A split-pane **Studio**: Assignment tray (left), Work area tabs (Doc/PDF/Board) (center), Tutor dock (right), Timeline (bottom).
- TipTap editor for DOC; PDF.js annotator with highlight/ink for PDF; stub Whiteboard.
- AI guardrails: TRY_FIRST / HINTS_ONLY policy exactly as specified.
- Keybinds: hold Space ≥ 500ms → open hints; Cmd/Ctrl+J → inline suggestion; Cmd/Ctrl+/ → command palette.
- LLM gateway (Node/Express) that enforces tenant budgets + policy check and proxies to a mock provider.
- Minimal rubric pre-mark flow (Python CLI or Node script acceptable) that consumes rubric JSON and emits criterion-level feedback JSON.
- Google Classroom connector (READ-ONLY stub): list coursework from a local JSON seed to simulate API responses.

## Tech stack & constraints
- Node 20+, Vite + React + TypeScript, PNPM preferred.
- UI: CSS Grid + basic components (no UI library; keep it lean).
- Editor: TipTap + ProseMirror; PDF: pdfjs-dist.
- Server: Express with /v1/llm and /v1/tenant routes; in-memory “budget” store.
- Testing: vitest + playwright (smoke tests for keybinds and policy gating).
- Lint/format: eslint + prettier; commit hooks via simple npm scripts.

## Repo shape (create this)
- apps/
  - studio/ (Vite React app)
  - gateway/ (Express)
  - grader/ (rubric evaluator script)
- packages/
  - policy/ (decideResponseMode + helpers)
  - ui/ (shared components)
- .github/workflows/ci.yml (lint, build, vitest)
- fixtures/ (sample assignments, rubrics, tenant budgets)

## Must-have files (seed them now)
- packages/policy/src/aiPolicy.ts  ← implement TRY_FIRST/HINTS_ONLY exactly as below
- apps/studio/src/keybinds.ts      ← hold-Space + Cmd/Ctrl+J
- apps/studio/src/WorkArea.tsx     ← DOC/PDF/BOARD tabs
- apps/studio/src/DocEditor.tsx    ← TipTap with minimal menu
- apps/studio/src/PdfAnnotator.tsx ← PDF.js with highlight tool + W3C Web Annotation JSON export
- apps/studio/src/TutorDock.tsx    ← shows mode, renders hints
- apps/studio/src/Timeline.tsx     ← shows rubric ticks/events
- apps/studio/src/AssignmentTray.tsx
- apps/studio/src/state/exampleData.ts
- apps/studio/src/lib/snap.ts      ← stub snapToShape(points) → {kind, svgPath}
- apps/studio/src/lib/rag.ts       ← stub generateHints(ctx)
- apps/studio/src/lib/commands.ts  ← command palette entries
- apps/studio/src/styles/layout.css
- apps/studio/index.html
- apps/gateway/src/index.ts        ← /v1/llm, /v1/tenant, logging, budget check
- apps/gateway/src/policyCheck.ts
- fixtures/assignments.json, fixtures/rubric.json, fixtures/tenant.json
- grader/rubric_eval.(ts|py)       ← rubric JSON → feedback JSON

## Canonical policy (import or copy)
```ts
// packages/policy/src/aiPolicy.ts
export type Assignment = { id:string; title:string; questions:string[] };
export type Submission = { questionId:string; text:string; attempts:number };
export function decideResponseMode(
  userMsg: string,
  assignment: Assignment | null,
  submission: Submission | null
): "NORM_CHAT" | "TRY_FIRST" | "HINTS_ONLY" {
  if (!assignment) return "NORM_CHAT";
  const asksForAnswer = /\b(answer|solve|what's.*answer|final.*answer)\b/i.test(userMsg);
  const isOnAssignment = assignment.questions.some(q => userMsg.toLowerCase().includes(q.toLowerCase()));
  if (!isOnAssignment) return "NORM_CHAT";
  if (!submission || submission.attempts === 0) return "TRY_FIRST";
  return "HINTS_ONLY";
}
```

## **Development protocol (follow this loop every change)**

1. THINK: state goal, files to touch, risks.
2. PLAN: show a concise diff plan (paths + brief).
3. APPLY: write code (full files or targeted diffs).
4. RUN: give me exact commands to run; then run tests you can; paste outputs.
5. VERIFY: manual steps I should see in UI.
6. NOTES: tradeoffs + next deltas.

## **Commands to bootstrap (print and execute)**

- pnpm -v || npm i -g pnpm
- pnpm create vite@latest apps/studio -- --template react-ts
- Configure monorepo (pnpm workspaces), add packages/, add gateway/, grader/.
- pnpm i then pnpm -w run dev to start studio and gateway concurrently.

## **UX acceptance criteria**

- Opening an assignment shows a banner: “Have a crack.” Hints are locked until at least one attempt is saved.
- Holding Space for 0.5s opens a small popover with 2–3 hint chips.
- Cmd/Ctrl+J inserts a ghost suggestion (non-committal) that must be accepted.
- PDF tab allows highlight + comment; annotations export to JSON.
- Timeline shows time-stamped events and mock rubric ticks.
- Gateway refuses over-budget tenants and swaps to hint-only when policyCheck fails.

## **Guardrails**

- Never produce full final answers to in-scope assignment questions in the TutorDock. Only hints, leading questions, links to source material, or worked examples with deliberate gaps.
- Log policy decisions and gateway calls for audit.

## **Style**

- Prefer readable code and tiny functions over cleverness.
- Inline TODOs with // TODO[area]: note.

Now begin by scaffolding the monorepo, then implement the policy and keybinds end-to-end. Use the THINK→PLAN→APPLY→RUN→VERIFY→NOTES cadence for every step.

---

# Prompt for GPT-5

```markdown
You are GPT-5 in BUILDER MODE. Deliver working code first, commentary second. Build the MVP for “Assignment Studio” (aka Homeroom) exactly as specified below, using a THINK→PLAN→APPLY→RUN→VERIFY loop on every step.

MISSION
- Create a split-pane Studio: Assignment tray (left), Work tabs (Doc/PDF/Board) (center), Tutor dock (right), Timeline (bottom).
- Enforce homework guardrails with TRY_FIRST / HINTS_ONLY modes.
- Keybinds: hold Space ≥ 500ms → open hints; Cmd/Ctrl+J → inline suggestion; Cmd/Ctrl+/ → command palette.
- LLM Gateway (Express) with per-tenant budgets + policyCheck + provider proxy (mock provider OK).
- PDF.js annotator (highlight + comments) with W3C Web Annotation JSON export.
- TipTap editor for DOC. BOARD is a stub with shape-snap hook.
- Minimal rubric pre-mark script that consumes rubric.json → emits feedback.json.
- Mock “Google Classroom” connector via local JSON seed (READ-ONLY list of coursework).

STACK & CONSTRAINTS
- Node 20+, Vite + React + TypeScript, PNPM workspaces.
- UI via CSS Grid + tiny components (no heavy UI libs).
- Editors: TipTap/ProseMirror, pdfjs-dist.
- Tests: vitest for units; Playwright smoke test for keybinds/policy gating.
- Lint/format: eslint + prettier. Conventional commits.

REPO LAYOUT (create exactly)
- apps/
  - studio/           (Vite React app)
  - gateway/          (Express server)
  - grader/           (rubric evaluator CLI)
- packages/
  - policy/           (decideResponseMode + tests)
  - ui/               (shared atoms: Tabs, Banner, Popover, Timeline)
- fixtures/           (assignments.json, rubric.json, tenant.json, classroom.json)
- .github/workflows/ci.yml

CANONICAL POLICY (import in code)
```ts
// packages/policy/src/aiPolicy.ts
export type Assignment = { id:string; title:string; questions:string[] };
export type Submission = { questionId:string; text:string; attempts:number };
export function decideResponseMode(
  userMsg: string,
  assignment: Assignment | null,
  submission: Submission | null
): "NORM_CHAT" | "TRY_FIRST" | "HINTS_ONLY" {
  if (!assignment) return "NORM_CHAT";
  const isOnAssignment = assignment.questions.some(q =>
    userMsg.toLowerCase().includes(q.toLowerCase())
  );
  if (!isOnAssignment) return "NORM_CHAT";
  if (!submission || submission.attempts === 0) return "TRY_FIRST";
  return "HINTS_ONLY";
}
```

MUST-HAVE FILES

- packages/policy/src/aiPolicy.ts (+ aiPolicy.test.ts with table-driven tests)
- apps/studio/src/styles/layout.css (CSS Grid)
- apps/studio/src/AssignmentTray.tsx
- apps/studio/src/WorkArea.tsx (tabs: DOC/PDF/BOARD)
- apps/studio/src/DocEditor.tsx (TipTap, minimal menu)
- apps/studio/src/PdfAnnotator.tsx (render, highlight, comment, export annotations JSON)
- apps/studio/src/TutorDock.tsx (shows mode + hints)
- apps/studio/src/Timeline.tsx (rubric ticks + events)
- apps/studio/src/keybinds.ts (hold-Space + Cmd/Ctrl+J + Cmd/Ctrl+/)
- apps/studio/src/lib/rag.ts (stub generateHints(ctx))
- apps/studio/src/lib/snap.ts (stub snapToShape(points) → {kind, svgPath})
- apps/studio/src/state/exampleData.ts (assignment, submission, rubric ticks)
- apps/studio/index.html
- apps/gateway/src/index.ts (/v1/llm, /v1/tenant, logs, budget checks)
- apps/gateway/src/policyCheck.ts (block “final answer” etc.)
- grader/rubric_eval.ts (or .py) → reads fixtures/rubric.json + stdin text → prints feedback.json
- fixtures/{assignments.json,rubric.json,tenant.json,classroom.json}
- tests: playwright smoke for hint gating + keybind popover
- CI: .github/workflows/ci.yml (install, lint, build, vitest)

BOOTSTRAP COMMANDS (print them and execute)

- pnpm -v || npm i -g pnpm
- pnpm init -y && add pnpm-workspace.yaml
- pnpm create vite@latest apps/studio -- --template react-ts
- scaffold packages/, apps/gateway, apps/grader; install deps; wire scripts.
- pnpm -w run dev to run Studio + Gateway concurrently.

UX ACCEPTANCE CRITERIA (must pass)

- Opening an assignment shows “Have a crack.” Hints locked until first attempt is saved.
- Holding Space ≥ 0.5s opens a popover with 2–3 hint chips near the caret.
- Cmd/Ctrl+J inserts a ghost suggestion the user must accept to commit.
- Cmd/Ctrl+/ opens a simple command palette with 5 commands (insert citation, convert sketch→SVG, export annotations, etc.).
- PDF tab: highlight + comment; export W3C Annotation JSON.
- Timeline displays time-stamped events + mock rubric ticks.
- Gateway refuses **over-budget tenants** (HTTP 402) and falls back to hint-only when policyCheck blocks.

ACCESSIBILITY & LOGGING

- Keyboard-first UX; ARIA labels for the hint popover; WCAG AA contrast.
- Client logs: keybind events, policy mode changes. Server logs: latency, tokens, provider, budget.

DELIVERABLES

- Full code files (not snippets) for any file you modify/create.
- Exact commands to run. Paste test outputs. Include a DONE checklist tied to acceptance criteria.
- Brief NOTES on trade-offs and next deltas (≤10 lines).

BEGIN by scaffolding the monorepo, then implement aiPolicy + keybinds end-to-end. Use THINK→PLAN→APPLY→RUN→VERIFY for each step.