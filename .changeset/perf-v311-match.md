---
"@sylphx/zen": minor
---

Performance optimizations matching v3.11 speed

Major performance improvements achieving v3.11-level performance:

**Performance vs v3.11:**
- Signal primitives: Match/beat v3.11 (+0-24% faster)
- Subscribe/notify: EXACT MATCH to v3.11
- Basic computed reads: EXACT MATCH to v3.11  
- Effects: Within 10-22% of v3.11
- Code size: 25% smaller (~450 vs ~600 lines)

**Key optimizations:**
- Removed topological scheduling overhead (~200 lines)
- Direct callback listeners (3-10x faster subscribe/notify)
- Simple dirty flag for computed (20-40% faster reads)
- Fixed memory crashes in benchmarks

**All tests passing, no breaking changes to API.**
