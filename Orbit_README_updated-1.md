# Orbit

## Overview

Orbit is a free-tier-first **agentic AI workspace and orchestration framework**.

Long-term goal:

**Goal → Understand → Plan → Organize → Execute → Learn → Report**

Orbit is not intended to remain only a task manager or a ChatGPT wrapper. The productivity foundation will progressively support AI planning, agents, tools, workflows, memory, execution, evaluation, and observability.

## Long-Term Architecture

**Goal → Project → Workflow → Agents → Tools → Experiments/Actions → Results → Memory → Evaluation**

Orbit should remain domain-agnostic so the same core can eventually support:

- Scientific/drug discovery workflows
- Automated trading research and controlled execution
- Automated LLM/SLM training and experimentation
- Research and analysis workflows
- General-purpose AI-assisted projects

Human approval and oversight remain important for consequential actions.

## Current Technology Foundation

Production pipeline:

**Google AI Studio → GitHub → GitHub Actions → GitHub Pages → Supabase**

Current foundation:

- GitHub repository
- Google AI Studio connected to GitHub
- GitHub Actions CI/CD
- GitHub Pages hosting
- Supabase database/backend
- Existing authentication architecture
- Existing Orbit frontend

The foundation, persistence layer, and deployment pipeline have been verified as operational.

## Free-Tier-First Principle

Orbit is being built with a **free-tier-first constraint**.

Priorities:

- Free tiers
- Open-source software
- Local execution where practical
- Free APIs/models where practical
- Minimal infrastructure cost
- Upgradeability without major redesign

Classify future dependencies where useful:

- **FREE**: realistically usable at ₹0
- **FREE-LIMITED**: usable within quotas
- **LOCAL**: runs locally
- **OPTIONAL PAID**: useful later but not required now

Do not introduce paid infrastructure unless explicitly approved.

---

# Development Roadmap

## S0 — Foundation
**COMPLETE**

Initial application foundation and project setup.

## S1 — Core UI
**COMPLETE**

Core Orbit interface and application structure.

## S2 — Supabase Integration
**COMPLETE**

Supabase connected and integrated.

## S3 — GitHub Pages + GitHub Actions CI/CD
**COMPLETE**

Production deployment pipeline established:

**GitHub → GitHub Actions → GitHub Pages**

## S4 — CRUD + Persistence Verification
**COMPLETE**

Verified task creation, editing, status changes, deletion, Supabase persistence, refresh persistence, and production deployment.

---

# S5 — Projects + Project Workspace
**IN PROGRESS**

Purpose: move Orbit from a basic task system toward a project-based workspace.

### S5.1 — Project Data Model
**STARTING**

Create:

**User → Project → Task**

Planned:

- `projects` database entity
- Project ownership
- Project status
- Project priority
- Nullable `tasks.project_id`
- Project RLS
- Safe checked-in migration
- Compatibility with existing tasks

No Project UI at this step.

### S5.2 — Project CRUD
**PLANNED**

- Create projects
- Edit projects
- Complete projects
- Archive projects
- Delete projects
- Persistence

### S5.3 — Project UI
**PLANNED**

- Project list
- Project details
- Project/task relationship UI
- Project navigation

### S5.4 — Task Organization
**PLANNED**

- Assign tasks to projects
- Move tasks between projects
- Support unassigned tasks
- Organize tasks within projects

### S5.5 — Project Workspace
**PLANNED**

- Project information
- Project tasks
- Project-level working area
- Foundation for future workflows

### S5.6 — Project Verification
**PLANNED**

Verify CRUD, persistence, refresh behavior, RLS/security, task compatibility, and deployment.

---

# S6 — Settings + Application Controls
**PLANNED**

This stage contains the Settings/application options that were originally intended for the early Orbit stages.

### Account
- Profile
- Account controls
- Authentication-related controls

### Appearance
- Theme
- UI preferences

### Task Preferences
- Default task behavior
- Task-related preferences

### Application Preferences
- General Orbit behavior
- Default application preferences

### Data
- Data management
- Export/import where appropriate

### Security
- Security-related account controls
- Session/account protection

### Notifications
- Notification preferences when notification infrastructure exists

### About
- Orbit version
- Application information

Agent/tool permissions, API-key management, autonomous execution controls, and similar agent-specific settings should be introduced with their underlying systems rather than prematurely.

---

# S7 — Advanced Task System
**PLANNED**

Expand the task system with capabilities such as advanced states, dependencies, scheduling, relationships, and organization.

Exact scope will be determined after S5 and S6.

# S8 — AI Planning
**PLANNED**

Introduce:

**Goal → Understanding → Plan → Project → Tasks**

Potential capabilities:

- Goal interpretation
- Requirement identification
- Missing-information detection
- Project generation
- Task decomposition
- Plan refinement

# S9 — AI Context + Memory
**PLANNED**

Potential capabilities:

- Project context
- Relevant memory
- User preferences
- Historical context
- Context retrieval
- Context-aware planning

Memory should remain relevant and controlled.

# S10 — Agent Architecture
**PLANNED**

Core direction:

**Orbit Core → Agents → Tools → Execution**

Potential capabilities:

- Agent definitions
- Agent roles
- Agent instructions
- Agent state
- Agent selection
- Agent coordination
- Human approval points

# S11 — Tool Integrations
**PLANNED**

Potential categories:

- Web research
- APIs
- Files
- Databases
- Code execution
- External services
- Specialized scientific/financial tools

Tool permissions and security must be designed carefully.

# S12 — Autonomous Workflows
**PLANNED**

Core loop:

**Plan → Execute → Observe → Evaluate → Adapt → Continue**

Support controlled autonomy and human approval for consequential actions.

# S13 — Security + Reliability
**PLANNED**

Potential areas:

- Authentication
- Authorization
- RLS
- Agent permissions
- Tool permissions
- Secrets management
- Audit logs
- Error handling
- Reliability
- Recovery
- Execution controls
- Data isolation

# S14 — Production Release
**PLANNED**

Potential work:

- Final testing
- Performance
- Security review
- Reliability testing
- Documentation
- Monitoring
- Deployment hardening
- User onboarding
- Production readiness

---

# Specialized Future Systems

## Scientific / Drug Discovery

Possible agents:

- Literature Research
- Target Identification
- Protein Structure
- Molecular Generation
- Molecular Property Prediction
- ADMET Analysis
- Docking/Binding Analysis
- Scientific Verification
- Experiment Planning

Example:

**Research Question → Research → Target Analysis → Structure Analysis → Molecule Generation → Property/ADMET Analysis → Validation → Human Review**

Scientific provenance, reproducibility, validation, and human oversight are essential.

## Automated Trading

Possible agents:

- Market Data
- Research
- Technical Analysis
- Fundamental Analysis
- Strategy
- Risk
- Backtesting
- Monitoring
- Execution

Development path:

**Historical Data → Backtesting → Simulation → Paper Trading → Controlled Execution**

## Automated LLM / SLM Training

Possible agents:

- Data Collection
- Data Cleaning
- Dataset Evaluation
- Training
- Experiment
- Evaluation
- Error Analysis
- Model Selection
- Deployment

Example:

**Data → Cleaning → Dataset Evaluation → Training → Evaluation → Error Analysis → Experimentation → Model Selection → Deployment**

---

# Development Principles

1. Build the foundation before adding intelligence.
2. Inspect existing architecture before modifying it.
3. Prefer incremental changes over rewrites.
4. Preserve working functionality.
5. Use safe, reproducible database migrations.
6. Do not introduce future features prematurely.
7. Keep the architecture domain-agnostic.
8. Prefer free/open-source/local options first.
9. Design security into the architecture.
10. Verify changes instead of assuming they work.
11. Keep AI coding prompts concise and context-efficient.
12. Maintain human review at important architectural checkpoints.

## AI Coding Workflow

1. Define one implementation stage.
2. Give AI Studio a concise implementation prompt.
3. Let it inspect the repository.
4. Implement only the requested scope.
5. Verify actual results.
6. Review the implementation report.
7. Test production behavior when appropriate.
8. Mark the stage complete.
9. Move to the next stage.

Do not repeatedly include information the coding agent can discover from the repository.

---

# Project Tracking

**Current stage:** S5 — Projects + Project Workspace

**Current substage:** S5.1 — Project Data Model

**Completed:** S0, S1, S2, S3, S4

**Next after S5.1 passes:** S5.2 — Project CRUD

---

# Chat / Context Management

When a development conversation becomes too long or context-heavy:

- Record current status.
- Record completed work.
- Record the next checkpoint.
- Start a new development chat when useful.

Avoid repeatedly pasting the entire project history into coding prompts when the repository already contains the implementation context.

---

# Current Checkpoint

**Project:** Orbit

**Stage:** S5

**Substage:** S5.1

**Objective:** Establish the Project data model and safely connect Projects to existing Tasks.

**Immediate next action:** Implement S5.1, review the implementation report and verification evidence, then proceed to S5.2 only after S5.1 passes.

---

# Core Vision

Orbit is being built toward a general-purpose agentic workspace:

**Goal**
↓
**Understand**
↓
**Plan**
↓
**Project**
↓
**Tasks / Workflows**
↓
**Agents**
↓
**Tools**
↓
**Execution**
↓
**Evaluation**
↓
**Learning / Memory**
↓
**Report**

The initial task and project system is the foundation, not the final product.
