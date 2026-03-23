# CLAUDE.md

This file provides guidance to Claude Code when working with this codebase.

## Project Overview
MagicTales Frontend - React/Vite application for personalized storybook creation

## Available Agents
When working on specific areas, reference these specialized agents:

| Area | Agent File |
|------|------------|
| UI Development | `.claude/agents/frontend-ui.md` |
| Content/Stories | `.claude/agents/content-creator.md` |

## Quick Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Directories
- `pages/` - Page components (Home, CreateStory, PreviewStory, etc.)
- `components/` - Reusable UI components
- `src/api/` - API client and types
- `services/` - Business logic

## When to Use Each Agent

**Use Frontend UI Agent when:**
- Creating or modifying React components
- Debugging state or rendering issues
- Working with API integration
- Styling and responsive design

**Use Content Creator Agent when:**
- Writing story content
- Creating image prompts
- Ensuring age-appropriate content
