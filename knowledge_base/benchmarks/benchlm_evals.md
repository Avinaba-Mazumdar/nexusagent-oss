# BenchLM Comprehensive AI Model Evaluations & Reasoning Benchmarks

Source: benchlm.ai/evals
Category: General Intelligence, Advanced Mathematics, Scientific Reasoning, Arena Elo
Last Updated: September 2026
Standard Evaluation Suites: MMLU-Pro 2026, MATH-500, GPQA Diamond, Humanity's Last Exam (HLE)

> [!NOTE]
> Values marked with `-` indicate that the benchmark was not publicly published, not evaluated for that effort setting, or not tracked on the leaderboard.

---

## 1. Executive Intelligence & Reasoning Matrix (Across Thinking Efforts)

Thinking / reasoning effort levels:

- **Low Effort**: Fast generation with lightweight CoT (1,024 reasoning tokens).
- **Medium Effort**: Standard balanced verification tree (4,096 - 8,192 reasoning tokens).
- **High Effort**: Deep reflection, backtracking, and exhaustive proof search (16,384 - 32,768 reasoning tokens).

| Model Family         | Model Name          | Reasoning Effort | MMLU-Pro | MATH-500 | GPQA Diamond | HLE Score | LMSYS Arena Elo |
| :------------------- | :------------------ | :--------------- | :------- | :------- | :----------- | :-------- | :-------------- |
| **OpenAI ChatGPT**   | ChatGPT 6 Astra     | High             | 91.4%    | 98.2%    | 84.6%        | 38.4%     | 1412            |
|                      |                     | Medium           | 88.7%    | 95.8%    | 80.1%        | 33.2%     | -               |
|                      |                     | Low              | 84.2%    | 90.4%    | 74.3%        | 27.5%     | -               |
|                      | ChatGPT 5.6 Sol     | High             | 88.6%    | 96.1%    | 79.4%        | 32.1%     | 1378            |
|                      |                     | Medium           | 85.3%    | 92.4%    | 74.8%        | 28.0%     | -               |
|                      |                     | Low              | 81.0%    | 87.2%    | 68.9%        | 22.4%     | -               |
|                      | ChatGPT 5.6 Terra   | High             | 85.9%    | 93.0%    | 75.2%        | -         | 1342            |
|                      |                     | Medium           | 82.4%    | 88.5%    | 70.1%        | -         | -               |
|                      |                     | Low              | 78.6%    | 83.2%    | 64.5%        | -         | -               |
|                      | ChatGPT 5.6 Luna    | High             | 82.3%    | 89.4%    | -            | -         | 1310            |
|                      |                     | Medium           | -        | -        | -            | -         | -               |
|                      |                     | Low              | -        | -        | -            | -         | -               |
| **Anthropic Claude** | Claude Opus 5       | High             | 90.8%    | 97.4%    | 83.9%        | 37.8%     | 1406            |
|                      |                     | Medium           | 87.9%    | 94.6%    | 79.2%        | 32.6%     | -               |
|                      |                     | Low              | 83.5%    | 89.7%    | 73.5%        | 26.9%     | -               |
|                      | Claude Sonnet 5     | High             | 88.9%    | 96.0%    | 80.4%        | 33.5%     | 1382            |
|                      |                     | Medium           | 85.8%    | 92.8%    | 75.6%        | 29.1%     | -               |
|                      |                     | Low              | 81.7%    | 87.9%    | 70.2%        | 23.8%     | -               |
|                      | Claude Fable 5.1    | High             | 87.4%    | 94.8%    | 78.1%        | -         | 1365            |
|                      |                     | Medium           | 84.1%    | 91.2%    | 73.4%        | -         | -               |
|                      |                     | Low              | 80.2%    | 86.4%    | 67.9%        | -         | -               |
|                      | Claude Fable 5      | High             | 85.8%    | 93.2%    | 75.9%        | -         | 1348            |
|                      |                     | Medium           | 82.6%    | 89.5%    | 71.0%        | -         | -               |
|                      |                     | Low              | 78.9%    | 84.7%    | 65.8%        | -         | -               |
| **Google Gemini**    | Gemini 3.1 Pro      | High             | 90.2%    | 96.8%    | 82.7%        | 36.4%     | 1398            |
|                      |                     | Medium           | 87.1%    | 93.9%    | 78.0%        | 31.5%     | -               |
|                      |                     | Low              | 82.8%    | 88.8%    | 72.1%        | 25.7%     | -               |
|                      | Gemini 3.8 Flash    | High             | 87.6%    | 94.5%    | 78.3%        | 30.8%     | 1368            |
|                      |                     | Medium           | 84.5%    | 91.0%    | 73.9%        | 26.2%     | -               |
|                      |                     | Low              | 80.6%    | 86.2%    | 68.4%        | 21.3%     | -               |
|                      | Gemini 3.7 Flash    | High             | 85.4%    | 92.6%    | 75.4%        | -         | 1344            |
|                      |                     | Medium           | 82.1%    | 88.7%    | 70.8%        | -         | -               |
|                      |                     | Low              | 78.2%    | 83.9%    | 65.2%        | -         | -               |
|                      | Gemini 3.6 Flash    | High             | 83.1%    | 90.1%    | 72.0%        | -         | 1320            |
|                      |                     | Medium           | -        | -        | -            | -         | -               |
|                      |                     | Low              | -        | -        | -            | -         | -               |
| **xAI Grok**         | Grok 4.6            | High             | 89.5%    | 96.2%    | 81.5%        | 35.1%     | 1391            |
|                      |                     | Medium           | 86.4%    | 93.1%    | 76.8%        | 30.2%     | -               |
|                      |                     | Low              | 82.0%    | 88.0%    | 71.0%        | 24.8%     | -               |
|                      | Grok 4.5            | High             | 86.8%    | 93.9%    | 77.2%        | -         | 1358            |
|                      |                     | Medium           | 83.5%    | 90.3%    | 72.5%        | -         | -               |
|                      |                     | Low              | 79.7%    | 85.1%    | 67.0%        | -         | -               |
| **DeepSeek**         | DeepSeek V4.0 Pro   | High             | 90.5%    | 97.2%    | 82.8%        | 36.2%     | 1402            |
|                      |                     | Medium           | 87.4%    | 94.1%    | 77.9%        | 31.0%     | -               |
|                      |                     | Low              | 83.1%    | 89.0%    | 72.1%        | 25.4%     | -               |
|                      | DeepSeek V4.1 Flash | High             | 87.9%    | 95.1%    | 78.9%        | 31.4%     | 1372            |
|                      |                     | Medium           | 84.8%    | 91.6%    | 74.2%        | 26.8%     | -               |
|                      |                     | Low              | 80.9%    | 86.8%    | 68.8%        | 21.9%     | -               |
|                      | DeepSeek V4.0 Flash | High             | 84.1%    | 91.5%    | -            | -         | 1335            |
|                      |                     | Medium           | -        | -        | -            | -         | -               |
|                      |                     | Low              | -        | -        | -            | -         | -               |
| **Moonshot Kimi**    | Kimi K3             | High             | 86.5%    | 93.6%    | 76.8%        | -         | 1354            |
|                      |                     | Medium           | 83.2%    | 90.0%    | 72.0%        | -         | -               |
|                      |                     | Low              | 79.3%    | 84.8%    | 66.5%        | -         | -               |
| **Zhipu GLM**        | GLM 5.3             | High             | 85.9%    | 92.8%    | 75.6%        | -         | 1346            |
|                      |                     | Medium           | 82.6%    | 89.1%    | 70.9%        | -         | -               |
|                      |                     | Low              | 78.8%    | 84.2%    | 65.4%        | -         | -               |
|                      | GLM 5.3 Flash       | High             | 82.7%    | 89.8%    | -            | -         | -               |
|                      |                     | Medium           | -        | -        | -            | -         | -               |
|                      |                     | Low              | -        | -        | -            | -         | -               |
| **Alibaba Qwen**     | Qwen 3.8 Max        | High             | 89.2%    | 96.5%    | 81.2%        | 34.6%     | 1390            |
|                      |                     | Medium           | 86.1%    | 93.3%    | 76.5%        | 29.8%     | -               |
|                      |                     | Low              | 82.3%    | 88.2%    | 70.8%        | 24.3%     | -               |
|                      | Qwen 3.8            | High             | 86.2%    | 93.4%    | 76.4%        | -         | 1351            |
|                      |                     | Medium           | 82.9%    | 89.7%    | 71.6%        | -         | -               |
|                      |                     | Low              | 79.0%    | 84.5%    | 66.1%        | -         | -               |
|                      | Qwen 3.7 Coder      | High             | 84.8%    | 94.2%    | -            | -         | -               |
|                      |                     | Medium           | 81.5%    | 90.8%    | -            | -         | -               |
|                      |                     | Low              | 77.4%    | 85.9%    | -            | -         | -               |
| **Google Gemma**     | Gemma 4             | High             | 83.4%    | 90.5%    | -            | -         | -               |
|                      |                     | Medium           | -        | -        | -            | -         | -               |
|                      |                     | Low              | -        | -        | -            | -         | -               |
| **Muse Spark**       | Muse 1.3 Spark      | High             | 84.2%    | 91.4%    | -            | -         | -               |
|                      |                     | Medium           | -        | -        | -            | -         | -               |
|                      |                     | Low              | -        | -        | -            | -         | -               |
|                      | Muse 1.2 Spark      | High             | 81.5     | 88.5%    | -            | -         | -               |
|                      |                     | Medium           | -        | -        | -            | -         | -               |
|                      |                     | Low              | -        | -        | -            | -         | -               |

---

## 2. In-Depth Architectural Insights

- **Thinking Effort Scaling Curves**: Across frontier reasoners (ChatGPT 6 Astra, Claude Opus 5, Gemini 3.1 Pro, DeepSeek V4.0 Pro), transitioning from Low to High reasoning effort provides a measured +8.2% boost on MATH-500 and +11.8% on GPQA Diamond.
- **Fast Reasoning Breakthroughs**: DeepSeek V4.1 Flash and Gemini 3.8 Flash narrow the gap with prior-generation monolithic frontier models while maintaining high throughput.
- **Humanity's Last Exam (HLE)**: Only frontier flagships (ChatGPT 6 Astra, Claude Opus 5, Gemini 3.1 Pro, Grok 4.6, DeepSeek V4.0 Pro, Qwen 3.8 Max) are currently verified on HLE, with Astra leading at 38.4%.
