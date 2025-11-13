# Version Notes

## v3.7.0 (2025-11-13)

### Version Numbering Explanation

**Original Plan**: v3.6.0
**Actual Release**: v3.7.0

**Why the jump?**
- We manually set `package.json` to `3.6.0`
- Changesets detected this as already published (due to changeset file)
- Changesets auto-incremented to `3.7.0` during release
- npm doesn't allow unpublishing or overwriting versions
- Therefore, v3.7.0 is the correct and only published version

**Lesson Learned**: Don't manually edit version numbers when using changesets. Let changesets handle all versioning automatically.

### Release Content

This release (v3.7.0) contains:

1. **Version Number Tracking**
   - Each signal has `_version` incremented on write
   - Computed stores `_sourceVersions` for fast checking
   - Skip recomputation when dependencies unchanged
   - 5-10% improvement potential

2. **Observer Slots O(1) Cleanup**
   - Bidirectional slot tracking
   - Swap-and-pop algorithm
   - O(n) → O(1) complexity improvement
   - 3-5% improvement potential

### Bundle Size

- **Brotli**: 2.09 KB (v3.5: 1.96 KB, +6.6%)
- **Gzip**: 2.37 KB (v3.5: 2.21 KB, +7.2%)
- **Trade-off**: +130-160 bytes for O(1) cleanup and version tracking

### Performance

- **No regressions**: All benchmarks stable or improved
- **Diamond pattern**: 740k-1.1M ops/sec
- **Create/destroy**: 2.18M ops/sec
- **Real-world patterns**: 3.6k-4.4k ops/sec

### Breaking Changes

**None** - Fully backward compatible with v3.5.0

---

## Version History

```
v3.0  → v3.1  → v3.2  → v3.3  → v3.4  → v3.5  → v3.7
                12.8x   8.9x    8.6x    3.1x    2.97x (vs Solid)
```

**Note**: v3.6.0 was never published. The version jumped from v3.5.0 directly to v3.7.0.

---

## Future Versioning

Going forward:
- Let changesets handle all version bumps
- Don't manually edit `package.json` version
- Next release will be v3.8.0 (or higher based on changesets)

---

## References

- **npm**: https://www.npmjs.com/package/@sylphx/zen
- **GitHub Release**: https://github.com/SylphxAI/zen/releases/tag/%40sylphx/zen%403.7.0
- **Commit**: 1c36169
- **PR**: #7 (Version Packages)
