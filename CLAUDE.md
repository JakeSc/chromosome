# Claude Code Guidelines

This document contains guidelines for Claude Code when working on this repository.

## Source Control Guidance

### Git Add Rules
- **NEVER use `git add -A` or `git add .`** - These commands are dangerous in collaborative environments where multiple editors (human and agent) may be working simultaneously
- **ALWAYS stage files explicitly** - Use `git add <specific-file>` or `git add <specific-directory>/` 
- **Review changes before staging** - Use `git status` and `git diff` to understand what's being committed
- **Stage only related changes** - Group logically related changes into single commits

### Examples
```bash
# ✅ Good - explicit file staging
git add package.json pnpm-lock.yaml
git add src/app/page.tsx
git add src/components/NewComponent.tsx

# ❌ Bad - bulk staging (dangerous)
git add -A
git add .
```

### Commit Guidelines
- Use descriptive commit messages
- Include the Claude Code footer in commit messages
- Keep commits focused on single logical changes
- Test builds before committing when possible

## Development Workflow
- Always run builds to verify changes before committing
- Check for TypeScript/ESLint errors and warnings
- Update dependencies responsibly with explicit package names