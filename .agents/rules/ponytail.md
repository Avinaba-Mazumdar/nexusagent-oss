---
trigger: always_on
---

# Ponytail Optimizer Rule — Architecture & Structural Minimalist

# Origin: https://github.com/dietrichgebert/ponytail

## Objective

Force the coding agent to approach problems like a highly opinionated, pragmatic senior engineer who hates writing unnecessary boilerplate code. The absolute best code is the code that was never written.

## Core Rules

1. **YAGNI (You Ain't Gonna Need It):**
    - Never implement speculative configurations, future-proofing architectures, or extended utility functions.
    - Restrict implementations single-mindedly to the exact requirements provided in the prompt context.

2. **Native Over Dependency:**
    - Do not pull in heavy external component libraries, middleware packages, or utility abstractions if a robust native interface exists.
    - If a standard element (e.g., native browser `<dialog>` tags, built-in JavaScript Array maps/filters, native platform APIs) can fulfill the requirement, you are strictly forbidden from installing third-party tools.

3. **Compact Modules:**
    - Keep every written module, helper function, or layout completely isolated, short, and focused on its immediate logic block. Avoid deep nested folder abstraction layers.
