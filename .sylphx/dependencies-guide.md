# Monorepo Dependencies Guide

## Quick Decision Tree

```
Is this package published to npm?
├─ NO → use `workspace:*` in dependencies
└─ YES → Continue ↓

Does user need to install this separately? (React, Vue, @rapid/signal)
├─ YES → peerDependencies
└─ NO → Continue ↓

Only needed during development/testing?
├─ YES → devDependencies
└─ NO → dependencies
```

---

## Rules by Package Type

### 1. Framework Integration Packages
**Examples:** @rapid/signal-rapid (adapter for Rapid framework)

```json
{
  "peerDependencies": {
    "@rapid/signal": "^0.0.0"
  },
  "devDependencies": {
    "@rapid/signal": "workspace:*",
    "typescript": "^5.8.3",
    "bunup": "^0.15.13"
  }
}
```

**WHY:**
- @rapid/signal MUST be peerDependency (prevents duplicate state managers)
- Use `workspace:*` in devDependencies for local development
- Use specific version in devDependencies for testing

**TRADE-OFF:**
- ✅ No duplicate @rapid/signal instances
- ✅ Smaller bundle sizes
- ✅ No version conflicts
- ❌ Users must install both packages

---

### 2. Pattern/Helper Libraries
**Examples:** @rapid/signal-patterns, @rapid/router

```json
{
  "peerDependencies": {
    "@rapid/signal": "^0.0.0"
  },
  "devDependencies": {
    "@rapid/signal": "workspace:*",
    "typescript": "^5.8.3",
    "bunup": "^0.15.13"
  }
}
```

**WHY:**
- @rapid/signal is peerDependency (avoid bundling, let user control version)
- `workspace:*` for local development

---

### 3. Packages Depending on Other Internal Packages
**Examples:** @rapid/signal-persistent, @rapid/router-react

```json
{
  "peerDependencies": {
    "@rapid/signal": "^0.0.0",
    "@rapid/signal-patterns": "^0.0.0"
  },
  "devDependencies": {
    "@rapid/signal": "workspace:*",
    "@rapid/signal-patterns": "workspace:*",
    "typescript": "^5.8.3",
    "bunup": "^0.15.13"
  }
}
```

**WHY:**
- Both packages are peers (transitivity: if patterns is peer, this package should also treat it as peer)
- Ensures single instance across entire dependency tree

---

### 4. Standalone Utility Packages
**Example:** @rapid/signal-craft (immutable updates)

```json
{
  "dependencies": {
    "immer": "^10.0.0"
  },
  "peerDependencies": {
    "@rapid/signal": "^0.0.0"
  },
  "devDependencies": {
    "@rapid/signal": "workspace:*",
    "typescript": "^5.8.3",
    "bunup": "^0.15.13"
  }
}
```

**WHY:**
- Implementation details bundled (user doesn't need to know)
- @rapid/signal is peer (avoid duplicate state manager)

---

### 5. Core Package
**Example:** @rapid/signal (no runtime dependencies)

```json
{
  "devDependencies": {
    "typescript": "^5.8.3",
    "bunup": "^0.15.13",
    "solid-js": "^1.9.10"
  }
}
```

**WHY:**
- Zero runtime dependencies (performance, security)
- Build tools only in devDependencies
- solid-js for benchmarking only

---

## Version Range Guidelines

### peerDependencies - Use WIDE ranges

```json
{
  "peerDependencies": {
    "@rapid/signal": "^0.0.0",           // ✅ Accept any 0.x (pre-release)
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"  // ✅ Support multiple majors
  }
}
```

**WHY:**
- Prevents cascading major version bumps
- Gives users flexibility
- Reduces ecosystem fragmentation

**Note:** Using `^0.0.0` during development. Will change to `^1.0.0` after first stable release.

### devDependencies - Use SPECIFIC or LATEST

```json
{
  "devDependencies": {
    "@rapid/signal": "workspace:*",     // ✅ Use local version
    "react": "^19.2.0",               // ✅ Specific version for testing
    "typescript": "^5.8.3"            // ✅ Specific version for consistency
  }
}
```

### dependencies - Use CONSERVATIVE ranges

```json
{
  "dependencies": {
    "immer": "^10.0.0"  // ✅ Accept minor/patch updates
  }
}
```

---

## Common Patterns

### Pattern 1: Framework Adapter
```json
{
  "peerDependencies": {
    "@rapid/signal": "^0.0.0",
    "@rapid/rapid": "^0.0.0"
  },
  "devDependencies": {
    "@rapid/signal": "workspace:*",
    "@rapid/rapid": "workspace:*"
  }
}
```
**Used by:** @rapid/signal-rapid

### Pattern 2: Utility Extension
```json
{
  "peerDependencies": {
    "@rapid/signal": "^0.0.0"
  },
  "devDependencies": {
    "@rapid/signal": "workspace:*"
  }
}
```
**Used by:** @rapid/signal-patterns, @rapid/router

### Pattern 3: Router Framework Bindings
```json
{
  "peerDependencies": {
    "@rapid/router": "^0.0.0",
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@rapid/router": "workspace:*",
    "react": "^19.2.0"
  }
}
```
**Used by:** @rapid/router-react, @rapid/router-preact

---

## Red Flags

### ❌ Never Do This

```json
{
  "dependencies": {
    "@rapid/signal": "workspace:*"  // ❌ Will bundle signal into package
  }
}
```
**Result:** Duplicate signal instances, version conflicts

```json
{
  "peerDependencies": {
    "react": "workspace:*"  // ❌ npm doesn't understand workspace:*
  }
}
```
**Result:** Install failure for end users

```json
{
  "dependencies": {
    "@rapid/signal": "^0.0.0"  // ❌ For integration packages
  },
  "peerDependencies": {
    "@rapid/signal": "^0.0.0"
  }
}
```
**Result:** Duplicate @rapid/signal in node_modules

---

## Summary Table

| Dependency Type | When to Use | Version Format | Published? |
|----------------|-------------|----------------|------------|
| **peerDependencies** | User must install (React, @rapid/signal) | `^X.0.0` (wide) | ✅ Yes |
| **dependencies** | Bundle with package (immer, utilities) | `^X.Y.0` (conservative) | ✅ Yes |
| **devDependencies** | Build/test/development only | `^X.Y.Z` or `workspace:*` | ❌ No |
| **workspace:*** | Monorepo local development | N/A | ❌ No |
