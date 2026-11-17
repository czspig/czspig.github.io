---
title: "OpenAI 发布 GPT-6.2 Astra 与 Sol"
published: 2026-11-17
description: "OpenAI 同时更新了旗舰 Astra 和日常款 Sol：Astra 降价 20%，Sol 几乎追平 Astra、成本约五分之一，两者都更省 token；但第三方评测没看到编程能力提升。"
tags: [AI, OpenAI, GPT, 模型发布]
category: AI 风向标
draft: false
---

> 本文整理自 OpenAI 官方公告、开发者社区帖和发布当天的媒体报道，信息以[官方原文](https://openai.com/index/introducing-gpt-6-2-astra-sol/)为准，推出过程中细节可能还会变。

11 月 17 日，OpenAI 发布了 **GPT-6.2 Astra** 和 **GPT-6.2 Sol**。距离 9 月的 GPT-6 Astra 只过了两个月，Sol 则是在 DevDay 升到 6.1 之后再次更新。官方给这一代的说法是"更高效，在真实世界里表现更好"。

## 两个模型，各管一摊

| | GPT-6.2 Astra | GPT-6.2 Sol |
|---|---|---|
| 定位 | 旗舰，面向最难的项目 | 实惠，面向日常编程和写作 |
| API 模型 ID | `gpt-6.2-astra` | `gpt-6.2-sol` |
| 输入 / 输出价格（每百万 token） | $8 / $40 | $2 / $10 |
| 和上一代比 | 标准价下调 20%，缓存输入从 $1 降到 $0.40 | 维持 GPT-6.1 的价格 |

两个模型都支持 Responses 和 Chat Completions 接口。

## 在哪能用

- **ChatGPT Work 和 Codex**：Plus、Pro、Enterprise、Edu 用户今天起就能用。
- **Ultrafast 模式**：生成速度最高能到标准速率的 4.5 倍，但更费额度，在模型选择器里切换。$200/月的 Pro 第一次给 Sol 开了 Ultrafast；$500/月的 Pro 两个模型都有；Enterprise 和 Edu 工作区需要管理员打开。
- **API**：官方说今天开放。不过有媒体发现 API 目录里暂时还挂着 GPT-6 Astra 和 GPT-6.1 Sol，可能还在分批推出。

## 性能：便宜的那个快追上来了

- **Sol 和 Astra 几乎一样强**。在 Cognition 的 FrontierCode 2.0 上（测的是代码改动能不能达到维护者愿意合并的水平），两者都开到最高推理强度时，Sol 和 Astra 的差距不到 0.5 分，成本却只有 Astra 的五分之一左右。
- **更省 token**。完成高难度任务时，两个模型的输出 token 都比上一代少。
- **第三方排名**：Artificial Analysis 智能指数里 Astra 79 分（总榜第二）、Sol 78 分，都高于 Claude Fable 5.2 的 75 分；在"每个任务成本"这条性价比曲线上，它们占了大部分最优位置。OpenAI 自己的 Elo 排名里，Astra 以 1318 分排第一。
- **但编程没明显变强**。Artificial Analysis 测下来，两个模型的编程能力都没有超过各自的上一代。这和 OpenAI 的说法不太一样：OpenAI 说 Astra 在 Codex 里更擅长在已有项目里改代码并跑测试，早期测试者也反馈代码更干净、测试更聚焦、返工更少。两种说法哪个更贴近实际，可能要看具体任务。

## 一个小功能：照着截图做幻灯片

Astra 可以把一张幻灯片截图当模板，照着它的版式、配色甚至字号来做新的幻灯片。

## 安全：网络安全能力过了"Critical"门槛

OpenAI 说两个模型的网络安全能力都达到了它内部框架的 **Critical** 级别，所以这次对高风险的网络安全类请求加了更严的限制。换句话说，模型强到需要专门防止被拿去做攻击了。

## 我的看法

这次最值得注意的不是 Astra，而是 **Sol**：差距不到 0.5 分、价格五分之一。对大多数日常开发，默认用 Sol、碰到真正难的任务再换 Astra，大概是最划算的用法。Astra 降价 20% 加上缓存输入大幅降价，对长上下文、重复调用多的 agent 场景也很友好。

至于编程能力到底有没有进步，官方和第三方的说法还对不上，等社区多跑几天真实任务再下结论也不迟。

## 参考来源

- [Introducing GPT-6.2 Astra and Sol（OpenAI 官方）](https://openai.com/index/introducing-gpt-6-2-astra-sol/)
- [GPT-6.2 Astra and Sol are now available（OpenAI 开发者社区）](https://community.openai.com/t/gpt-6-2-astra-and-sol-are-now-available/1417531)
- [Artificial Analysis 的评测](https://x.com/ArtificialAnlys/status/2122750634210529569)
- [9to5Mac 报道](https://9to5mac.com/2026/11/17/openai-upgrades-chatgpt-and-codex-with-new-gpt-6-2-astra-and-sol-models/)
- [RuntimeWire 报道](https://runtimewire.com/article/runtimewire-confirms-gpt-6-2-astra-and-sol-have-launched)
