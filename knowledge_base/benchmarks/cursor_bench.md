# CursorBench Agentic Coding & IDE Refactoring Leaderboard

Source: cursorbench.com/leaderboard
Category: Agentic Code Editing, SWE Bug Fixing, Multi-File AST Transformation
Last Updated: September 2026
Test Suites: SWE-Bench Verified (Full 2026 Edition), Multi-File Refactoring Benchmark, Live Repo Repair Loop

> [!NOTE]
> Values marked with `-` indicate that the model was not evaluated on this benchmark suite or that the reasoning effort level is not supported for full repository repair.

---

## 1. Agentic Coding & Refactoring Matrix (Across Reasoning Efforts)

Thinking / reasoning effort levels:

- **Low Effort**: Inline autocomplete and local function edits (<1,000 reasoning tokens).
- **Medium Effort**: Scoped component refactors and cross-module edits (2,048 - 8,192 reasoning tokens).
- **High Effort**: Full repository test-driven repair and complex architecture rewrites (16,384 - 32,768 reasoning tokens).

| Model Family         | Model Name          | Reasoning Effort | SWE-Bench Verified | Multi-File Edit Success | Syntax Error Rate | Mean Repair Rounds |
| :------------------- | :------------------ | :--------------- | :----------------- | :---------------------- | :---------------- | :----------------- |
| **Anthropic Claude** | Claude Opus 5       | High             | 64.2%              | 94.8%                   | 0.8%              | 1.15               |
|                      |                     | Medium           | 59.5%              | 91.2%                   | 1.3%              | 1.38               |
|                      |                     | Low              | -                  | 86.4%                   | 2.1%              | 1.74               |
|                      | Claude Sonnet 5     | High             | 62.8%              | 93.6%                   | 0.9%              | 1.18               |
|                      |                     | Medium           | 58.1%              | 89.9%                   | 1.5%              | 1.42               |
|                      |                     | Low              | -                  | 85.0%                   | 2.4%              | 1.80               |
|                      | Claude Fable 5.1    | High             | 60.4%              | 91.5%                   | 1.2%              | 1.25               |
|                      |                     | Medium           | 55.8%              | 87.6%                   | 1.8%              | 1.51               |
|                      |                     | Low              | -                  | 82.7%                   | 2.9%              | 1.92               |
|                      | Claude Fable 5      | High             | 58.6%              | 89.8%                   | 1.4%              | 1.30               |
|                      |                     | Medium           | 54.0%              | 85.9%                   | 2.1%              | 1.58               |
|                      |                     | Low              | -                  | 80.8%                   | 3.3%              | 2.02               |
| **OpenAI ChatGPT**   | ChatGPT 6 Astra     | High             | 65.0%              | 95.2%                   | 0.7%              | 1.12               |
|                      |                     | Medium           | 60.3%              | 91.8%                   | 1.2%              | 1.35               |
|                      |                     | Low              | -                  | 87.0%                   | 1.9%              | 1.70               |
|                      | ChatGPT 5.6 Sol     | High             | 61.5%              | 92.4%                   | 1.1%              | 1.22               |
|                      |                     | Medium           | 56.9%              | 88.7%                   | 1.7%              | 1.47               |
|                      |                     | Low              | -                  | 83.8%                   | 2.6%              | 1.87               |
|                      | ChatGPT 5.6 Terra   | High             | 57.8%              | 89.0%                   | 1.5%              | 1.33               |
|                      |                     | Medium           | 53.2%              | 85.1%                   | 2.2%              | 1.62               |
|                      |                     | Low              | -                  | 80.0%                   | 3.5%              | 2.08               |
|                      | ChatGPT 5.6 Luna    | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |
| **Google Gemini**    | Gemini 3.1 Pro      | High             | 63.4%              | 94.0%                   | 0.9%              | 1.17               |
|                      |                     | Medium           | 58.7%              | 90.4%                   | 1.4%              | 1.40               |
|                      |                     | Low              | -                  | 85.5%                   | 2.2%              | 1.77               |
|                      | Gemini 3.8 Flash    | High             | 59.8%              | 90.9%                   | 1.3%              | 1.27               |
|                      |                     | Medium           | 55.2%              | 87.0%                   | 1.9%              | 1.54               |
|                      |                     | Low              | -                  | 82.0%                   | 3.0%              | 1.96               |
|                      | Gemini 3.7 Flash    | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |
|                      | Gemini 3.6 Flash    | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |
| **DeepSeek**         | DeepSeek V4.0 Pro   | High             | 63.8%              | 94.2%                   | 0.8%              | 1.16               |
|                      |                     | Medium           | 59.1%              | 90.7%                   | 1.4%              | 1.39               |
|                      |                     | Low              | -                  | 85.8%                   | 2.2%              | 1.76               |
|                      | DeepSeek V4.1 Flash | High             | 60.1%              | 91.2%                   | 1.2%              | 1.26               |
|                      |                     | Medium           | 55.5%              | 87.3%                   | 1.8%              | 1.53               |
|                      |                     | Low              | -                  | 82.3%                   | 2.9%              | 1.94               |
|                      | DeepSeek V4.0 Flash | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |
| **xAI Grok**         | Grok 4.6            | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |
|                      | Grok 4.5            | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |
| **Moonshot Kimi**    | Kimi K3             | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |
| **Alibaba Qwen**     | Qwen 3.8 Max        | High             | 62.4%              | 93.1%                   | 1.0%              | 1.19               |
|                      |                     | Medium           | 57.7%              | 89.4%                   | 1.5%              | 1.43               |
|                      |                     | Low              | -                  | 84.6%                   | 2.4%              | 1.82               |
|                      | Qwen 3.8            | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |
|                      | Qwen 3.7 Coder      | High             | 61.2%              | 92.5%                   | 1.1%              | 1.21               |
|                      |                     | Medium           | 56.7%              | 88.6%                   | 1.7%              | 1.48               |
|                      |                     | Low              | -                  | 83.9%                   | 2.7%              | 1.86               |
| **Zhipu GLM**        | GLM 5.3             | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |
|                      | GLM 5.3 Flash       | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |
| **Google Gemma**     | Gemma 4             | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |
| **Muse Spark**       | Muse 1.3 Spark      | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |
|                      | Muse 1.2 Spark      | High             | -                  | -                       | -                 | -                  |
|                      |                     | Medium           | -                  | -                       | -                 | -                  |
|                      |                     | Low              | -                  | -                       | -                 | -                  |

---

## 2. Cursor IDE Integration Insights

- **Zero Syntax Breakage**: Frontier models at High reasoning effort (ChatGPT 6 Astra, Claude Opus 5, Gemini 3.1 Pro, DeepSeek V4.0 Pro) achieve sub-1% syntax error rates, allowing automated tests to run cleanly on the first pass.
- **Dedicated Coder Models**: Qwen 3.7 Coder achieves 61.2% on SWE-Bench Verified at a fraction of frontier API costs, making it the top open-weights agentic coding backend.
