# Airnest AI 功能实现计划

> 目标：为项目增加深度集成的 AI 功能，展示 AI 工程化能力而非简单的 API 调用。
> 核心原则：AI 功能必须融入现有架构（BFF、Streaming SSR、URL 驱动搜索），而非独立的 demo 页面。

---

## 总览：三个功能按优先级排列

| 优先级 | 功能 | 预计工期 | 技术亮点 | 面试价值 |
|--------|------|----------|----------|----------|
| P0 | AI 自然语言搜索 | 2-3 天 | Function Calling + 降级策略 + 现有搜索链路复用 | ⭐⭐⭐⭐⭐ |
| P1 | AI 评论洞察摘要 | 2-3 天 | 服务端生成 + 缓存失效策略 + 增量更新 | ⭐⭐⭐⭐ |
| P2 | AI 房源助手 (Concierge) | 4-5 天 | RAG + SSE 流式响应 + 对话状态管理 | ⭐⭐⭐⭐⭐ |

---

## P0：AI 自然语言搜索

### 用户体验

用户在搜索栏输入自然语言描述，AI 将其解析为结构化搜索参数，复用现有搜索链路展示结果。

```
输入："海边两卧室的公寓，4人住，200美元以内"
  ↓ AI 解析 (function calling / structured output)
参数：{ location: "beach", bedrooms: 2, guests: 4, maxPrice: 200 }
  ↓ router.replace('/?location=beach&guests=4&bedrooms=2&max-price=200')
结果：现有 Streaming SSR 链路展示结果
```

### 技术架构

```
用户在 SearchBar 输入自然语言 → 点击 AI 搜索按钮（或检测到自然语言意图）
  ↓
前端: POST /api/search/ai-parse  (BFF Route Handler)
  ↓
BFF: 调用 LLM API (OpenAI / Claude) with function calling
  ↓ 返回结构化 JSON
前端: router.replace(构建的 URL)
  ↓ URL 变化触发已有搜索流程
page.tsx → Suspense → ListStreamed → 后端查询 → 流式返回结果
```

### 需要改动的文件

#### 后端（Django）— 可选，取决于是否扩展搜索参数

```
airnest_backend/backend/property/api.py
  → 扩展 properties_list 视图，支持 bedrooms、max_price 等新筛选参数

airnest_backend/backend/property/urls.py
  → （如需新端点则添加）
```

当前后端搜索只支持 location/category/guests/check_in/check_out。
AI 可能解析出 bedrooms、bathrooms、max_price 等参数。
需要在后端扩展这些筛选字段的查询支持。

#### 前端 — BFF 路由

```
新建: airnest_frontend/app/api/search/ai-parse/route.ts
```

这是核心。一个 Next.js Route Handler，职责：
1. 接收用户的自然语言输入
2. 调用 LLM API（OpenAI / Anthropic）做 function calling
3. 返回结构化搜索参数 JSON
4. 失败时返回 fallback（将原始输入当作 location 关键词）

```typescript
// 伪代码 — app/api/search/ai-parse/route.ts

import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `你是一个房源搜索助手。用户会用自然语言描述他们想要的房源。
你的任务是从中提取结构化搜索参数。只提取用户明确提到的字段，其余留空。`;

const searchFunction = {
  name: 'search_properties',
  description: 'Search for rental properties based on user criteria',
  parameters: {
    type: 'object',
    properties: {
      location:  { type: 'string', description: '地点/城市/区域' },
      check_in:  { type: 'string', description: '入住日期 YYYY-MM-DD' },
      check_out: { type: 'string', description: '退房日期 YYYY-MM-DD' },
      guests:    { type: 'number', description: '入住人数' },
      bedrooms:  { type: 'number', description: '卧室数量' },
      max_price: { type: 'number', description: '每晚最高价格(USD)' },
      category:  { type: 'string', enum: ['beach', 'cabin', 'countryside', ...] },
    },
    required: [],
  },
};

export async function POST(req: NextRequest) {
  const { query, locale } = await req.json();

  try {
    const response = await callLLM({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query },
      ],
      tools: [{ type: 'function', function: searchFunction }],
      tool_choice: { type: 'function', function: { name: 'search_properties' } },
    });

    const params = parseToolCallResult(response);
    return NextResponse.json({ success: true, params });
  } catch (error) {
    // 降级：把用户输入当作地点关键词
    return NextResponse.json({
      success: true,
      params: { location: query },
      fallback: true,
    });
  }
}
```

#### 前端 — 搜索 UI 增强

```
修改: airnest_frontend/src/features/search/components/SearchBar.tsx
  → 在地点输入框旁增加 AI 搜索模式（如一个切换按钮/图标）
  → 或检测输入长度 > 阈值时自动视为自然语言

新建: airnest_frontend/src/features/search/hooks/useAISearch.ts
  → 封装 AI 解析调用逻辑
  → 处理 loading/error/fallback 状态
  → 解析返回的参数并调用 replaceUrl()

修改: airnest_frontend/src/features/search/utils/query.ts
  → SearchState 类型扩展（bedrooms, max_price 等）
  → buildQuery / parseQuery 支持新字段
```

#### 前端 — 搜索参数扩展

```
修改: airnest_frontend/src/features/properties/utils/searchParams.ts
  → SearchParams 接口添加 bedrooms, bathrooms, max_price 等可选字段
  → formatApiParams 支持新字段
```

### 关键设计决策

**1. LLM 选择**
- 推荐 OpenAI gpt-4o-mini：便宜（$0.15/1M input tokens）、快速、function calling 稳定
- 备选 Claude 3.5 Haiku：同样便宜且快
- 密钥存在 BFF 环境变量中，不暴露给浏览器

**2. 降级策略（核心面试点）**
- AI 调用超时（3s）→ 降级为关键词搜索
- AI 返回格式异常 → 降级为关键词搜索
- API 配额耗尽 → 降级为关键词搜索
- 面试话术："AI 是增强，不是依赖。核心搜索功能不依赖 AI 可用性。"

**3. 成本控制**
- 短 prompt（<200 tokens input），每次调用成本 < $0.001
- 可选：对常见 query pattern 做内存缓存（如 "beach apartment" → 直接返回）
- 可选：频率限制（每用户每分钟 N 次 AI 搜索）

**4. UX 设计**
- 方案 A：搜索栏旁加一个 ✨ 图标，点击切换到"AI 搜索"模式
- 方案 B：检测到输入是完整句子（长度 > 15 字符 + 包含关键词）时自动提示
- 方案 C：保持现有搜索栏不变，单独加一个 AI 搜索入口（如一个浮动按钮）
- 推荐方案 A，最简洁且用户意图明确

### 验收标准

- [ ] 用自然语言（中/英/法）输入搜索需求，能正确解析为结构化参数
- [ ] AI 失败时无感降级为传统搜索
- [ ] 搜索结果通过现有 Streaming SSR 链路渲染
- [ ] BFF 调用 < 3s（超时则降级）
- [ ] 无 API 密钥泄露（密钥仅在服务端）

---

## P1：AI 评论洞察摘要

### 用户体验

在房源详情页的评论区顶部，展示 AI 生成的结构化评论摘要。

```
┌────────────────────────────────────────────────────┐
│  ✨ AI 评论洞察                    基于 23 条评论   │
│                                                     │
│  👍 住客最爱                                        │
│  • 绝佳的海景位置，步行可达沙滩                       │
│  • 房东响应极快，提供了丰富的当地推荐                  │
│  • 厨房设备齐全，适合长住                            │
│                                                     │
│  ⚠️ 值得注意                                       │
│  • 隔音一般，对噪音敏感的住客请注意                    │
│  • 停车位有限，建议提前沟通                           │
│                                                     │
│  👥 最适合：情侣旅行 · 短期度假 · 远程办公            │
│                                                     │
│  ⏱ 上次更新：2 天前                                 │
└────────────────────────────────────────────────────┘
```

### 技术架构

```
新评论提交成功
  ↓
后端：标记该房源的 AI 摘要为 stale（需要重新生成）
  ↓
用户访问房源详情页
  ↓
前端请求：GET /api/properties/{id}/ai-review-summary
  ↓
BFF 代理 → 后端：
  ├─ 缓存命中 & 未过期 → 直接返回缓存的摘要
  └─ 缓存未命中 / 已过期 → 拉取所有评论 → 调用 LLM 生成摘要 → 存入缓存 → 返回
```

### 需要改动的文件

#### 后端（Django）

```
新建: airnest_backend/backend/property/ai_service.py
  → LLM 调用封装
  → Prompt 模板
  → 响应解析和验证

修改: airnest_backend/backend/property/models.py
  → 新增 PropertyReviewSummary 模型（缓存 AI 生成的摘要）

新建: 对应的 migration 文件

修改: airnest_backend/backend/property/api.py
  → 新增端点 GET /api/properties/{id}/ai-review-summary/
  → 修改 create_review 视图，新评论提交后标记摘要为 stale

修改: airnest_backend/backend/property/urls.py
  → 注册新端点
```

#### 新增模型

```python
# property/models.py 新增

class PropertyReviewSummary(models.Model):
    """AI 生成的评论摘要缓存"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property_ref = models.OneToOneField(
        Property, related_name='ai_review_summary', on_delete=models.CASCADE
    )
    
    # AI 生成的结构化摘要
    highlights = models.JSONField(default=list)     # ["绝佳海景", "房东热情"]
    concerns = models.JSONField(default=list)       # ["隔音一般"]
    best_for = models.JSONField(default=list)       # ["情侣旅行", "短期度假"]
    summary_text = models.TextField(blank=True)     # 一句话总结
    
    # 缓存控制
    reviews_count_at_generation = models.IntegerField(default=0)
    is_stale = models.BooleanField(default=False)   # 有新评论时标记
    generated_at = models.DateTimeField(auto_now=True)
    model_version = models.CharField(max_length=50, default='gpt-4o-mini')
    
    # 多语言：每种语言各存一份
    locale = models.CharField(max_length=10, default='en')
    
    class Meta:
        unique_together = ['property_ref', 'locale']
```

#### 前端

```
新建: airnest_frontend/src/features/properties/reviews/Reviews.AIInsights.tsx
  → AI 评论洞察 UI 组件
  → 加载骨架屏
  → 错误降级（不显示 AI 洞察，不影响评论列表）

修改: airnest_frontend/src/features/properties/reviews/Reviews.Container.tsx
  → 在 ReviewsSummary 之后添加 AIInsights 组件
```

### 关键设计决策

**1. 生成时机**
- 不是实时生成——太慢且太贵
- 访问时生成 + 缓存：第一个访问者触发生成（~2-3s），后续访问者直接读缓存
- 新评论提交时标记 stale，下次访问时重新生成

**2. 增量更新（面试加分点）**
- 如果只新增了 1 条评论，不需要重新分析所有 23 条
- 将旧摘要 + 新评论一起喂给 AI，让它做增量更新
- 节省 token 成本，降低延迟

**3. 最低评论数阈值**
- 评论 < 3 条时不生成 AI 摘要（数据量不足以提供有意义的洞察）
- 显示 "评论数量不足，暂无 AI 洞察" 的提示

**4. 多语言**
- 按 locale 分别缓存摘要（en/zh/fr 各一份）
- 或：只生成英文摘要，前端通过现有翻译系统翻译（更省成本）

### 验收标准

- [ ] 评论 >= 3 条的房源详情页展示 AI 洞察卡片
- [ ] 摘要有缓存，不会每次访问都调用 LLM
- [ ] 新评论提交后，下次访问能看到更新后的摘要
- [ ] AI 服务不可用时，评论区正常展示（优雅降级）
- [ ] 支持中英法三种语言的摘要

---

## P2：AI 房源助手 (Concierge)

### 用户体验

在房源详情页提供一个 AI 对话框，用户可以就该房源提出任何问题。

```
┌─────────────────────────────────────┐
│  🤖 AI 房源助手                      │
│                                      │
│  👤 这里离最近的超市多远？             │
│                                      │
│  🤖 根据房源描述和其他住客的评价，      │
│     步行约 5 分钟可到达一家杂货店。     │
│     房东 John 也提到附近有一家...       │
│     （正在输入中 ▊）                  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ 输入你的问题...         发送  │    │
│  └──────────────────────────────┘    │
└─────────────────────────────────────┘
```

### 技术架构

```
用户在详情页打开 AI 助手面板 → 输入问题
  ↓
前端: POST /api/ai/concierge (BFF Route Handler)
  body: { propertyId, question, conversationHistory }
  ↓
BFF:
  1. 通过 BFF 代理从后端获取房源详情 + 评论（作为 RAG context）
  2. 构建 prompt: system(角色+规则) + context(房源数据) + history + user question
  3. 调用 LLM with streaming
  4. 通过 SSE (Server-Sent Events) 流式返回给前端
  ↓
前端: ReadableStream → 逐字显示 AI 回复（打字机效果）
```

### 需要改动的文件

#### 前端 — BFF 路由

```
新建: airnest_frontend/app/api/ai/concierge/route.ts
  → SSE 流式响应的 Route Handler
  → RAG context 组装（房源描述、设施、评论摘要）
  → 对话历史管理
  → 安全：限制 context 长度，防止 prompt injection
```

#### 前端 — UI 组件

```
新建: airnest_frontend/src/features/ai-concierge/
  ├── components/
  │   ├── ConciergePanel.tsx      # 主面板（可折叠的浮动面板）
  │   ├── ConciergeMessage.tsx    # 单条消息（支持 Markdown 渲染）
  │   └── ConciergeInput.tsx      # 输入框 + 发送按钮
  ├── hooks/
  │   ├── useConcierge.ts         # 对话状态管理 + SSE 流式读取
  │   └── usePropertyContext.ts   # 获取房源上下文数据
  └── types/
      └── types.ts                # 类型定义

修改: airnest_frontend/app/[locale]/properties/[id]/page.tsx
  → 在详情页底部或侧边添加 ConciergePanel
```

### RAG Context 设计（核心面试点）

```typescript
function buildContext(property: PropertyDetail, reviews: Review[]): string {
  return `
## 房源信息
- 名称：${property.title}
- 位置：${property.city}, ${property.country}
- 类型：${property.place_type}（${property.category}）
- 容量：${property.guests} 人，${property.bedrooms} 卧，${property.bathrooms} 卫
- 价格：$${property.price_per_night}/晚
- 设施标签：${property.property_tags.join(', ')}

## 房源描述
${property.description}

## 住客评价摘要（共 ${reviews.length} 条）
${reviews.slice(0, 10).map(r => `- [${r.rating}星] ${r.content.slice(0, 200)}`).join('\n')}
`;
}
```

### SSE 流式响应实现

```typescript
// app/api/ai/concierge/route.ts 伪代码

export async function POST(req: NextRequest) {
  const { propertyId, question, history } = await req.json();
  
  // 1. 获取房源上下文（通过 BFF 代理）
  const [property, reviews] = await Promise.all([
    fetchPropertyDetail(propertyId),
    fetchPropertyReviews(propertyId),
  ]);
  
  const context = buildContext(property, reviews);
  
  // 2. 调用 LLM with streaming
  const stream = await callLLMStream({
    messages: [
      { role: 'system', content: CONCIERGE_SYSTEM_PROMPT },
      { role: 'system', content: `房源上下文：\n${context}` },
      ...history,
      { role: 'user', content: question },
    ],
  });
  
  // 3. 转为 SSE 返回
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 关键设计决策

**1. Context 长度控制**
- 房源描述：截断到 500 字符
- 评论：最多取 10 条最新/最相关的，每条截断到 200 字符
- 对话历史：只保留最近 6 轮（12 条消息）
- 总 context < 2000 tokens，控制成本

**2. 安全防护**
- 用户输入过滤：检测并拒绝 prompt injection 尝试
- 回答范围限制：system prompt 明确限定只回答与该房源相关的问题
- 敏感信息过滤：不暴露房东私人信息（联系方式等）

**3. 流式 UX**
- 打字机效果：逐 token 显示回复
- 中断支持：用户可以中途停止生成（AbortController）
- 错误处理：流中断时显示"生成被中断"提示

**4. 状态管理**
- 对话历史保存在组件 state 中（不持久化，刷新清空）
- 可选：保存到 sessionStorage，同一会话内跨刷新保持

### 验收标准

- [ ] 房源详情页出现 AI 助手入口（浮动按钮或面板）
- [ ] 能基于房源信息 + 评论回答相关问题
- [ ] 流式打字机效果显示回复
- [ ] 不回答与房源无关的问题（如"帮我写代码"）
- [ ] 网络中断 / LLM 不可用时的优雅降级
- [ ] 支持多语言对话（检测用户语言，用同语言回复）

---

## 通用工程事项

### 环境变量

```bash
# .env.local (前端)
OPENAI_API_KEY=sk-...               # 只在 BFF 服务端可访问
AI_MODEL=gpt-4o-mini                # 默认模型
AI_TIMEOUT_MS=5000                   # AI 调用超时
AI_MAX_REQUESTS_PER_MIN=20          # 每用户每分钟限制

# .env (后端, P1 需要)
OPENAI_API_KEY=sk-...               # 后端直接调用（评论摘要生成）
```

### LLM 调用封装（前后端共用模式）

无论前端 BFF 还是后端 Django，都应该有一个统一的 LLM 调用封装：

```
前端 BFF:
  新建: airnest_frontend/src/shared/ai/llm-client.ts
  → 封装 OpenAI / Anthropic SDK 调用
  → 超时控制、重试、错误分类
  → 统一的日志和监控埋点

后端 Django (P1):
  新建: airnest_backend/backend/property/ai_service.py
  → 同样的封装，Python 版本
```

### 成本监控

- 每次 AI 调用记录 token 消耗
- 设置月度预算告警（如 $10/月）
- Dashboard 或日志中可查看：
  - 每日调用次数
  - 平均 token 消耗
  - 平均延迟
  - 错误率

### 频率限制

```
AI 搜索 (P0):  每用户 20 次/分钟（防滥用）
评论摘要 (P1):  每房源每小时最多触发 1 次生成（防重复调用）
AI 助手 (P2):  每用户 10 条消息/分钟（防刷）
```

---

## 实施时间线

### 第 1 周：P0 — AI 自然语言搜索

| 天 | 任务 |
|----|------|
| Day 1 | 后端扩展搜索参数（bedrooms, max_price 等）；前端 SearchState 类型扩展 |
| Day 2 | BFF Route Handler 实现：LLM 调用 + function calling + 降级逻辑 |
| Day 3 | SearchBar UI 增强：AI 搜索模式切换；useAISearch hook；端到端测试 |

### 第 2 周：P1 — AI 评论洞察摘要

| 天 | 任务 |
|----|------|
| Day 4 | 后端：PropertyReviewSummary 模型 + migration；ai_service.py LLM 封装 |
| Day 5 | 后端：摘要生成逻辑 + API 端点；缓存失效逻辑（新评论触发 stale） |
| Day 6 | 前端：Reviews.AIInsights 组件；集成到详情页；多语言支持 |

### 第 3 周：P2 — AI 房源助手

| 天 | 任务 |
|----|------|
| Day 7 | BFF：SSE 流式 Route Handler；RAG context 组装；安全过滤 |
| Day 8 | 前端：ConciergePanel + ConciergeMessage 组件；useConcierge hook（SSE 读取） |
| Day 9 | 前端：打字机效果；中断支持；对话历史管理 |
| Day 10 | 集成到详情页；UX 打磨（浮动面板动画、移动端适配） |
| Day 11 | 全功能端到端测试；性能调优；文档更新 |

---

## 面试叙事框架

### 被问到"为什么加 AI"时

> "用户用自然语言描述需求比手动填 5 个表单字段更高效。AI 在这里解决了一个
> 真实的 UX 问题。同时我设计了完整的降级策略——AI 不可用时无感回退到传统
> 搜索，核心功能不依赖 AI 的可用性。"

### 被问到"技术实现细节"时

> "我用 LLM function calling 将自然语言转为结构化参数，这些参数直接复用
> 现有的 URL 驱动搜索架构——同一套 Streaming SSR 链路，同一套后端查询逻辑。
> AI 只是在 BFF 层加了一步语义解析，没有引入任何新的数据流。"

### 被问到"成本和可扩展性"时

> "每次 AI 搜索约消耗 200 tokens，成本 < $0.001。我设了每用户频率限制，
> 也做了常见 query 的缓存。评论摘要采用生成+缓存策略，只在有新评论时
> 重新生成，避免重复调用。"

### 被问到"RAG 实现"时

> "房源助手使用 RAG 模式：将房源描述、设施标签、最近 10 条评论作为 context
> 注入 prompt。我做了 context 长度控制（< 2000 tokens）和安全过滤
> （限定只回答房源相关问题）。响应通过 SSE 流式传输，前端实现打字机效果。"
