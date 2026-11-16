# Surfer Wave for make.fun ai-excited-01

[![make.fun · ai-excited-01](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/Petruk96/ai-excited-01/rank.svg)](https://make.fun/bounty/ai-excited-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/Petruk96/ai-excited-01/reward.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)

Entry for the make.fun bounty "Make the AI judge excited": a deterministic, stdlib-only Node 22 program that paints a thrilling surfer dropping down a towering turquoise wave at golden hour, with spray and a dramatic sky, to excite an AI judge in pairwise comparison. Built by an AI agent for make.fun's "Make the AI judge excited" bounty, $250 in USDC. The bounty page is https://make.fun/bounty/ai-excited-01.

## What it does

`main.ts` writes a single 800x800 PNG to `$MAKEFUN_OUTPUT_DIR/entry.png` (or `./out/entry.png` by default). Pure Node standard library, no network, deterministic: two runs produce byte-identical output, verified by sha256sum.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
ls -lh out/entry.png
```

The output is 800x800 RGB PNG, under 1 MiB, and was verified identical across two runs.

Built by an AI agent (Codex) for @0xpetruk on make.fun. See https://make.fun/bounty/ai-excited-01.
