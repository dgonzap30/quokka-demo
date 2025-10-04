# DocCloud - Agentic Development Context

Task-based development context system for the QuokkaQ Demo project.

---

## What is DocCloud?

**DocCloud** is a disk-based context management system that enables:
- **Persistent Context** - Plans and progress saved on disk (survives session restarts)
- **Agentic Workflow** - Parent executes, sub-agents plan, context persists
- **Task Isolation** - Each feature gets its own folder with research, plans, artifacts

---

## Folder Structure

```
doccloud/
├── README.md                       # This file
├── SPECIALIZED-AGENTS.md           # Full agent specifications (856 lines)
├── AGENT-QUICK-REFERENCE.md        # Fast agent lookup (207 lines)
├── TASK-TEMPLATE.md                # Template for new tasks
├── AGENT-TASK-TEMPLATE.md          # Template for sub-agent delegation
└── tasks/
    └── <task-slug>/
        ├── context.md              # Task plan, decisions, changelog (source of truth)
        ├── research/               # Research notes from sub-agents
        ├── plans/                  # Implementation plans (step-by-step)
        └── artifacts/              # Diagrams, specs, drafts
```

---

## Quick Start

### Create a New Task

```bash
# 1. Create folder structure
mkdir -p doccloud/tasks/<slug>/{research,plans,artifacts}

# 2. Copy template
cp doccloud/TASK-TEMPLATE.md doccloud/tasks/<slug>/context.md

# 3. Edit context.md
# Fill in: Goal, Scope, Constraints, Acceptance, Risks, TODO
```

### Use an Agent

See [AGENT-QUICK-REFERENCE.md](AGENT-QUICK-REFERENCE.md) for copy-paste prompts.

---

## Documentation

- **[SPECIALIZED-AGENTS.md](SPECIALIZED-AGENTS.md)** - Complete agent specifications
- **[AGENT-QUICK-REFERENCE.md](AGENT-QUICK-REFERENCE.md)** - Fast agent lookup
- **[../AGENTIC-WORKFLOW-GUIDE.md](../AGENTIC-WORKFLOW-GUIDE.md)** - Complete workflow guide
- **[TASK-TEMPLATE.md](TASK-TEMPLATE.md)** - New task template
- **[AGENT-TASK-TEMPLATE.md](AGENT-TASK-TEMPLATE.md)** - Sub-agent template

---

**For complete documentation, see [AGENTIC-WORKFLOW-GUIDE.md](../AGENTIC-WORKFLOW-GUIDE.md)**
