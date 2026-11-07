# Upstream

Vendored copy of the CC Design skill (MIT).

- Source: https://github.com/wanyedaren/cc-design
- Commit: cfbb3a165d4f8e3e8bb484751af9abefd43360b6 (2026-04-20)
- Left out: `screenshots/` (README preview images only, ~4.5 MB; the skill does not use them)

## Local changes (keep them when updating)

- `scripts/verify.js` — new: structural checks + screenshots with plain Playwright, for sessions without the Playwright MCP tools.
- `references/hebrew-rtl.md` — new: Hebrew fonts, RTL layout, bidi and Israeli small-business conventions.
- `SKILL.md` — routing row for Hebrew/RTL, verify fallback in step 6, Hebrew note in "Avoid AI slop".
- `references/platform-tools.md`, `references/verification-protocol.md` — point to `scripts/verify.js`.

To update, clone the source again, copy everything except `.git/` and `screenshots/` over this folder, then re-apply the local changes above.
