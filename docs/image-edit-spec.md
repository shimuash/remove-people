# Image Edit 功能 SPEC 文档

> 对接 Kie.ai nano-banana-edit API，替换当前 image-editor 的 mock 实现，实现真实的 AI 图片编辑功能。

---

## 1. 概述

### 1.1 目标

将现有 image-editor 组件中的两个 mock API（inpaint、chat）替换为 Kie.ai 的 `nano-banana-edit` 模型，实现真正的 AI 图片编辑能力。

### 1.2 核心流程

```
用户操作 → 上传图片到 R2 → 调用 Kie createTask → 前端轮询状态 → 成功后下载结果到 R2 → 返回结果给编辑器
```

### 1.3 两种编辑模式

| 模式 | 触发组件 | 图片来源 | Prompt 来源 | 遮罩 |
|------|---------|---------|------------|------|
| **Brush/Remove** | `remove-button.tsx` | composite 图（原图 + 粉色遮罩） | 内置 prompt | 一定有 |
| **Chat** | `chat-panel.tsx` | `currentImage`（当前工作图，无遮罩） | 用户输入 prompt 原文 | 一定没有 |

两种模式的关键区别：
- **图片来源不同**：Remove 发送带遮罩的 composite 图，Chat 发送无遮罩的当前工作图（`currentImage`，会随 undo/redo/编辑操作变化）
- **Prompt 来源不同**：Remove 用内置 prompt，Chat 用用户原文
- **遮罩互斥**：`editor-toolbar.tsx` 切换到 Chat 模式时会 `clearLines()` 清空遮罩（line 75-77），Chat 模式下不支持遮罩。因此无需 `hasMask` 参数，由 `mode` 隐式确定

### 1.4 Prompt 策略

**Remove 模式（一定有遮罩）：**
```
Remove the object covered by the pink mask and fill in the background naturally. Seamlessly blend the edges.
```

**Chat 模式（一定无遮罩）：**
直接使用用户输入的 prompt 原文，不做任何包裹。

---

## 2. 技术架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Image Editor)                                     │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ RemoveButton  │  │  ChatPanel   │                         │
│  └──────┬───────┘  └──────┬───────┘                         │
│         │                  │                                 │
│         ▼                  ▼                                 │
│  ┌──────────────────────────────┐                            │
│  │  useEditTask() Hook          │ ← TanStack Query 轮询      │
│  │  startEdit() / getEdit()     │                            │
│  └──────────────┬───────────────┘                            │
└─────────────────┼───────────────────────────────────────────┘
                  │ Server Actions
┌─────────────────┼───────────────────────────────────────────┐
│  Backend        ▼                                            │
│  ┌──────────────────────────┐                                │
│  │  startEditAction()       │──→ Upload to R2 (public URL)   │
│  │                          │──→ Kie createTask              │
│  │                          │──→ Write DB (RUNNING)          │
│  └──────────────────────────┘                                │
│  ┌──────────────────────────┐                                │
│  │  getEditAction()         │──→ Read DB                     │
│  │  (polled by frontend)    │──→ Kie recordInfo (throttled)  │
│  │                          │──→ On success: download → R2   │
│  └──────────────────────────┘                                │
└──────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────┐    ┌─────────────────────┐
│  Neon PostgreSQL (DB)  │    │  Cloudflare R2      │
│  edit_request table    │    │  inputs/ outputs/   │
└────────────────────────┘    └─────────────────────┘
                  │
                  ▼
┌────────────────────────┐
│  Kie.ai API            │
│  createTask / recordInfo│
└────────────────────────┘
```

### 2.2 部署环境

项目部署在 **Cloudflare Workers**（通过 `@opennextjs/cloudflare`），关键约束：

| 约束 | 值 | 影响 |
|------|------|------|
| CPU 时间限制 | 30s（Paid） | I/O 不计入，实际限制宽松 |
| 内存限制 | 128MB（Free）/ 256MB+（Paid） | 大图 base64 解码需注意 |
| 请求体限制 | 100MB | 足够覆盖 base64 图片 |
| 子请求限制 | 1000/次 | 无问题 |
| 后台执行 | 不支持 | 不能在响应后继续工作 |
| `nodejs_compat` | 已开启 | Buffer、crypto 等可用 |
| `maxDuration` | **不适用** | 这是 Vercel 概念，CF Workers 无此配置 |

> 注意：现有 mock API routes 的 `export const maxDuration = 30` 是 Vercel 特有的，在 CF Workers 上无效，新实现不使用此配置。

### 2.3 技术选型

| 层面 | 选择 | 理由 |
|------|------|------|
| 图片存储 | 已有 R2 + 公开 URL | R2 已配置 STORAGE_PUBLIC_URL，Kie 可直接访问 |
| 状态存储 | Neon PostgreSQL + Drizzle | 沿用现有数据库 |
| 服务端交互 | Server Actions (next-safe-action) | 沿用项目模式 |
| 前端轮询 | TanStack Query refetchInterval | 简洁高效 |
| 鉴权 | 可选（支持匿名） | MVP 简化，不强制登录 |
| 积分 | 暂不对接 | MVP 跳过 |

---

## 3. 数据模型

### 3.1 edit_request 表

在 `src/db/schema.ts` 新增表定义：

```typescript
// Status enum values
// PENDING → RUNNING → FINALIZING → SUCCEEDED / FAILED

export const editRequests = pgTable('edit_request', {
  id: text('id').primaryKey(),                    // requestId (nanoid)
  userId: text('user_id'),                        // nullable, logged-in user
  status: text('status').notNull(),               // PENDING | RUNNING | FINALIZING | SUCCEEDED | FAILED
  mode: text('mode').notNull(),                   // 'remove' | 'chat'
  prompt: text('prompt').notNull(),               // full prompt sent to Kie
  inputKey: text('input_key').notNull(),           // R2 key for input image
  providerTaskId: text('provider_task_id'),        // Kie taskId
  providerResultJson: text('provider_result_json'), // Kie raw resultJson (safety net)
  outputKeys: text('output_keys'),                // JSON array string of R2 keys
  errorMessage: text('error_message'),            // failure reason
  lastProviderPollAt: timestamp('last_provider_poll_at'), // throttle polling
  pollErrorCount: integer('poll_error_count').default(0), // consecutive poll errors
  finalizeErrorCount: integer('finalize_error_count').default(0), // consecutive transfer errors
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('edit_request_user_id_idx').on(table.userId),
  index('edit_request_status_idx').on(table.status),
  index('edit_request_provider_task_id_idx').on(table.providerTaskId),
]);
```

### 3.2 状态机

```
PENDING ──→ RUNNING ──→ FINALIZING ──→ SUCCEEDED
                   │           └──→ RUNNING（搬运失败/超时 → 回退重试）
                   └──→ FAILED
```

| 状态 | 含义 | 触发条件 |
|------|------|---------|
| PENDING | 创建中，尚未调用 Kie | startEdit 写入 DB |
| RUNNING | Kie 任务已创建，等待结果 | createTask 成功后 |
| FINALIZING | 结果搬运中（并发锁） | CAS 抢占成功，正在下载/上传结果 |
| SUCCEEDED | 结果已下载并存入 R2 | 搬运完成 |
| FAILED | 任务失败 | Kie 返回 fail / createTask 失败 / 连续 poll 错误超限 / 连续搬运失败超限 |

> **FINALIZING 的作用**：防止并发重复搬运。多标签页/并发轮询时，只有第一个通过 CAS 原子更新 `UPDATE ... SET status='FINALIZING', updated_at=now() WHERE status='RUNNING' AND id=?` 的请求能进入搬运流程，其他请求读到 FINALIZING 直接返回 RUNNING 给前端等待。

### 3.3 设计说明

- **不存 anonId**：MVP 阶段匿名用户通过 requestId 追踪任务，userId 为 null
- **不存 inputSignedUrls**：R2 公开访问，无需签名 URL
- **outputKeys 用 JSON 字符串**：Kie 可能返回多张结果图，用 JSON 数组存储
- **pollErrorCount**：用于退避策略，连续错误超限则判死
- **finalizeErrorCount**：搬运（下载结果 + 上传 R2）连续失败计数，超限则判死，防止 resultUrl 永久不可达时无限循环
- **providerResultJson**（关键安全网）：Kie 的 `resultUrls` 是临时 URL，且 Kie 不会永久保留 task 记录。当 `recordInfo` 返回 `success` 时，**先把 `resultJson` 原文存入 DB**，再去下载图片。这样即使下载失败，下次 poll 时仍可从 DB 取到 resultUrls 重试，不依赖 Kie 继续保留数据
- **updatedAt 强制更新规则**：**每次对 `edit_request` 表执行 UPDATE 操作时，必须同时设置 `updatedAt = now()`**。这是 FINALIZING 超时回收（60s）的关键依据，遗漏更新会导致超时判断不准。实现时建议封装为统一的 DB 更新函数以确保不遗漏

---

## 4. Kie.ai 客户端封装

### 4.1 新建 `src/lib/kie-client.ts`

封装 Kie API 的调用逻辑，隔离第三方依赖：

```typescript
// Environment variable
// KIE_API_KEY - Kie.ai API Key

const KIE_BASE_URL = 'https://api.kie.ai/api/v1/jobs';
const KIE_MODEL = 'google/nano-banana-edit';

// ---- Internal interface (camelCase, used by our code) ----

type KieImageSize = '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '5:4' | '4:5' | '21:9' | 'auto';

interface CreateTaskParams {
  prompt: string;          // max 20000 chars
  imageUrls: string[];     // max 10 images, each ≤ 10MB
  outputFormat?: 'png' | 'jpeg';
  imageSize?: KieImageSize;  // business default: 'auto'（Kie 默认 '1:1'，业务侧覆盖为 'auto' 保持原图比例）
}

// ---- Kie HTTP request body (snake_case, sent to API) ----
// createTask() must convert CreateTaskParams to this structure:
// {
//   model: 'google/nano-banana-edit',
//   input: {
//     prompt: string,
//     image_urls: string[],
//     output_format?: 'png' | 'jpeg',
//     image_size?: KieImageSize,
//   }
// }
// IMPORTANT: do NOT send CreateTaskParams directly as request body

// ---- Kie HTTP response envelope ----
// All Kie responses follow: { code: number, msg: string, data: T }
// MUST check code === 200 even when HTTP status is 200

interface KieResponse<T> {
  code: number;
  msg: string;
  data: T;
}

interface CreateTaskResult {
  taskId: string;
}

interface RecordInfoResult {
  taskId: string;
  state: 'waiting' | 'success' | 'fail';
  resultJson: string | null;  // JSON string: { resultUrls: string[] }
  failCode: string | null;
  failMsg: string | null;
  costTime: number | null;
}
```

**鉴权（必须实现）：**

所有 Kie API 请求必须携带 `Authorization: Bearer {KIE_API_KEY}` 请求头，否则返回 401。

**核心方法：**

| 方法 | 说明 |
|------|------|
| `createTask(params)` | 调用 POST createTask，返回 taskId |
| `getRecordInfo(taskId)` | 调用 GET recordInfo，返回任务状态 |
| `parseResultUrls(resultJson)` | 解析 resultJson 中的 resultUrls |

**错误处理：**

两层校验策略：先检查 HTTP 状态码，再检查响应体 `code` 字段。

| 检查层 | 条件 | 处理方式 |
|--------|------|---------|
| HTTP 状态码 | 401 | 抛出 KieAuthError（API Key 错误） |
| HTTP 状态码 | 402 | 抛出 KieBalanceError（余额不足） |
| HTTP 状态码 | 400/422 | 抛出 KieValidationError（参数错误） |
| HTTP 状态码 | 404 | 抛出 KieNotFoundError（资源不存在，如 taskId 无效） |
| HTTP 状态码 | 429 | 抛出 KieRateLimitError（限流） |
| HTTP 状态码 | 500 | 抛出 KieServerError（服务端错误） |
| 响应体 | HTTP 200 但 `code !== 200` | 抛出 KieApiError（msg 作为错误信息） |

> **关键**：Kie 所有响应遵循 `{ code, msg, data }` 结构。即使 HTTP 状态码为 200，也**必须校验 `code === 200`**，否则可能把错误响应当作成功处理。

---

## 5. Server Actions

### 5.1 `startEditAction`

**文件**: `src/actions/image-edit.ts`

**输入参数（Zod schema）：**

```typescript
{
  image: z.string(),         // base64 图片数据（remove: composite 图；chat: 当前工作图 currentImage）
  prompt: z.string().max(20000),  // Kie 限制 20000 字符。校验规则见下方 refine
  mode: z.enum(['remove', 'chat']),
  outputFormat: z.enum(['png', 'jpeg']).optional(),
  imageSize: z.enum(['1:1', '9:16', '16:9', '3:4', '4:3', '3:2', '2:3', '5:4', '4:5', '21:9', 'auto']).default('auto'),  // 业务侧默认 'auto'（Kie 默认 '1:1'）
}
// Zod refine: mode='chat' 时 prompt.trim() 不能为空（Kie 要求 prompt 必填）
// mode='remove' 时 prompt 会被内置 prompt 覆盖，前端传空字符串即可
.refine(data => data.mode !== 'chat' || data.prompt.trim().length > 0, {
  message: 'Prompt is required in chat mode',
  path: ['prompt'],
})
```

> 无需 `hasMask` 参数：`mode='remove'` 隐含一定有遮罩（图片是 composite），`mode='chat'` 隐含一定没有遮罩（图片是当前工作图）。

**流程：**

1. 可选鉴权：尝试获取 session，有则取 userId，无则为 null
2. 生成 requestId（nanoid）
3. 将 base64 图片转 Buffer，上传到 R2（folder: `inputs`）
4. 构建 R2 公开 URL
5. 构建完整 prompt（`mode='remove'` → 内置 prompt；`mode='chat'` → 用户原文）
6. 写 DB：status=PENDING
7. 调用 Kie `createTask`
8. 写 DB：status=RUNNING + providerTaskId
9. 返回 `{ requestId }`

**异常处理：**
- Kie createTask 失败 → 写 DB: FAILED + errorMessage → 返回错误
- R2 上传失败 → 不写 DB → 直接返回错误

**使用 `actionClient`**（不用 `userActionClient`），以支持匿名用户。

### 5.2 `getEditAction`

**输入参数：**

```typescript
{
  requestId: z.string(),
}
```

**流程：**

1. 读 DB
2. 如果 status 是 SUCCEEDED → 生成 outputUrls（R2 公开 URL），返回
3. 如果 status 是 FAILED → 返回错误信息
4. 如果 status 是 **PENDING** → 返回 RUNNING 给前端（任务刚创建，createTask 尚未完成，等待下一次轮询）
5. 如果 status 是 **FINALIZING**：
   - 检查 `updatedAt`：如果 `now - updatedAt > 60s`，说明搬运进程已异常退出（CF Worker 超时/崩溃）。`finalizeErrorCount++`，然后判断：
     - `finalizeErrorCount >= 3` → 写 DB: FAILED + errorMessage（连续 3 次搬运异常，判定不可恢复）
     - 否则 → 回退为 RUNNING（`UPDATE ... SET status='RUNNING', finalize_error_count=finalize_error_count+1, updated_at=now() WHERE id=? AND status='FINALIZING'`），继续走步骤 6 的逻辑
   - 否则：返回 RUNNING（搬运正在进行，等待下一次轮询）
6. 如果 status 是 RUNNING：
   a. **检查是否有待重试的结果搬运**：DB 中 `providerResultJson` 有值但 `outputKeys` 为空 → 跳过 Kie 调用，直接进入搬运流程（见 5.3）
   b. **节流检查**：`now - lastProviderPollAt < 3000ms` → 直接返回 RUNNING（不调 Kie）
   c. 调用 Kie `recordInfo(providerTaskId)`
   d. 更新 `lastProviderPollAt`
   e. 根据返回的 state（成功响应均先 `pollErrorCount = 0` 清零）：
      - `waiting` → 返回 RUNNING
      - `fail` → 写 DB: FAILED + failMsg → 返回 FAILED
      - `success` → 先存 `providerResultJson` 到 DB，再进入搬运流程（见 5.3）

**pollErrorCount 规则：**
- **累加**：429/500/网络错误 → `pollErrorCount++`，保持 RUNNING
- **清零**：任何一次成功的 Kie 响应（state 为 `waiting`/`success`/`fail`）→ `pollErrorCount = 0`。确保只有**连续**错误才计数，间歇性抖动不会误判
- **判死**：`pollErrorCount >= 10` → 写 DB: FAILED（连续 10 次 poll 失败，判定任务死亡）

**同样使用 `actionClient`**，无需鉴权。

### 5.3 结果搬运（在 getEditAction 内部）

进入搬运流程时（Kie 返回 `state=success` 或 DB 中已有 `providerResultJson`）：

1. **CAS 抢占**：原子更新 `UPDATE edit_request SET status='FINALIZING', updated_at=now() WHERE id=? AND status='RUNNING'`
   - 返回 0 行 → 其他请求已在搬运，当前请求返回 RUNNING 给前端等待
   - 返回 1 行 → 抢占成功，继续搬运
2. **存 providerResultJson**（如果是首次从 Kie 获取）
3. 解析 `providerResultJson` → `resultUrls[]`
4. 逐个下载图片（fetch resultUrl）
5. 上传到 R2（folder: `outputs/{requestId}`）
6. 写 DB：outputKeys = JSON 数组，status = SUCCEEDED，updated_at = now()
7. 返回 SUCCEEDED + outputUrls

**并发保护（FINALIZING）：** 多标签页/并发轮询场景下，CAS 更新确保只有一个请求执行搬运，杜绝重复下载上传。

**搬运失败回退：** 如果步骤 4-5 失败，`finalizeErrorCount++`，然后判断：
- `finalizeErrorCount >= 3` → 写 DB: FAILED + errorMessage（连续 3 次搬运失败，判定为不可恢复，如 resultUrl 永久不可达）
- 否则 → 将 status 回退为 RUNNING（`UPDATE ... SET status='RUNNING', finalize_error_count=finalize_error_count+1, updated_at=now() WHERE id=? AND status='FINALIZING'`），下次轮询可重试

因 `providerResultJson` 已落库，重试时跳过 Kie API 直接从 DB 取 resultUrls。搬运成功后 `finalizeErrorCount` 无需清零（状态已转 SUCCEEDED，不再使用）。

**幂等保护：** 如果 status 已是 SUCCEEDED（outputKeys 有值），跳过搬运直接返回。

```
getEditAction(requestId)
  → status=SUCCEEDED → 返回结果
  → status=FAILED → 返回错误
  → status=PENDING → 返回 RUNNING（等待 createTask 完成）
  → status=FINALIZING → 超时检查（>60s）
    → 超时：finalizeErrorCount++ → ≥3 则 FAILED，否则回退 RUNNING
    → 未超时：返回 RUNNING
  → status=RUNNING
    → DB 有 providerResultJson？
      → 是：跳过 Kie recordInfo，直接 CAS 抢占 → 搬运
      → 否：调用 Kie recordInfo（pollErrorCount 成功清零/失败累加）
            → 存 providerResultJson → CAS 抢占 → 搬运
    → CAS 失败？返回 RUNNING（其他请求正在搬运）
    → 搬运失败？finalizeErrorCount++ → ≥3 则 FAILED，否则回退 RUNNING 重试
```

---

## 6. 前端改造

### 6.1 新增 `useEditTask` Hook

**文件**: `src/components/image-editor/hooks/use-edit-task.ts`

封装编辑任务的发起和轮询逻辑：

```typescript
interface UseEditTaskReturn {
  startTask: (params: StartEditParams) => Promise<void>;
  status: 'idle' | 'uploading' | 'running' | 'succeeded' | 'failed';
  resultImage: string | null;   // 结果图的 URL
  error: string | null;
  reset: () => void;
}
```

**内部逻辑：**

1. `startTask()`:
   - 设置 status = 'uploading'
   - 调用 `startEditAction`
   - 拿到 requestId，存入 state
   - 设置 status = 'running'
   - 启动 TanStack Query 轮询

2. 轮询（useQuery）:
   - `queryKey: ['edit-task', requestId]`
   - `queryFn: () => getEditAction({ requestId })`
   - `refetchInterval: 2000`（2 秒）
   - 当 status 不是 RUNNING 时停止轮询（`enabled: false`）

3. 状态同步:
   - SUCCEEDED → 下载结果图 → 转 base64 → 推入编辑器 history
   - FAILED → 显示错误 toast

### 6.2 改造 `remove-button.tsx`

**变更点：**

- 不再直接 `fetch('/api/image-edit/inpaint')`
- 改用 `useEditTask` hook
- 生成 composite image 后，调用 `startTask({ image: compositeImage, mode: 'remove' })`
- 处理中展示轮询状态（而非简单 loading）

### 6.3 改造 `chat-panel.tsx`

**变更点：**

- 不再直接 `fetch('/api/image-edit/chat')`
- 改用 `useEditTask` hook
- 直接使用 `currentImage` 作为输入图（Chat 模式无遮罩，不需要 composite）
- 调用 `startTask({ image: currentImage, prompt, mode: 'chat' })`

> 注意：`editor-toolbar.tsx` **不需要修改**。切换到 Chat 模式时 `clearLines()` 的行为是正确的，确保 Chat 模式下永远无遮罩。

### 6.4 编辑器状态扩展

在 `useEditorStore` 中新增：

```typescript
// Edit task state
editTaskStatus: 'idle' | 'uploading' | 'running' | 'succeeded' | 'failed';
editTaskError: string | null;
editRequestId: string | null;
```

或者：不修改 editor store，直接在 `useEditTask` hook 内部管理任务状态，通过 `isProcessing` 和现有 store 方法（`setProcessing`、`pushImageHistory`）与编辑器交互。

**推荐方案**：不修改 editor store，保持职责单一。`useEditTask` 自行管理任务状态，成功后调用 `pushImageHistory` 将结果推入编辑器。

---

## 7. 文件变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/lib/kie-client.ts` | Kie.ai API 客户端封装 |
| `src/actions/image-edit.ts` | startEditAction / getEditAction |
| `src/components/image-editor/hooks/use-edit-task.ts` | 前端编辑任务 hook |

### 修改文件

| 文件 | 说明 |
|------|------|
| `src/db/schema.ts` | 新增 editRequests 表定义 |
| `src/components/image-editor/remove-button.tsx` | 改用 useEditTask |
| `src/components/image-editor/chat-panel.tsx` | 改用 useEditTask |
| `env.example` | 新增 KIE_API_KEY 环境变量 |

### 不修改的文件

| 文件 | 原因 |
|------|------|
| `src/components/image-editor/editor-toolbar.tsx` | 切换 Chat 时 `clearLines()` 行为正确，无需改动 |
| `src/components/image-editor/hooks/use-editor-state.ts` | 保持纯 UI 状态，任务状态由 useEditTask 管理 |

### 删除文件（可选，建议保留但标记 deprecated）

| 文件 | 说明 |
|------|------|
| `src/app/api/image-edit/inpaint/route.ts` | 原 mock API，不再使用 |
| `src/app/api/image-edit/chat/route.ts` | 原 mock API，不再使用 |

---

## 8. 环境变量

在 `env.example` 的 AI 部分新增：

```
# Kie.ai API Key
# Get API Key from https://kie.ai/api-key
KIE_API_KEY=""
```

---

## 9. 关键设计决策

### 9.1 为什么不用签名代理 URL？

R2 已配置 `STORAGE_PUBLIC_URL`，上传的文件通过公开 CDN 直接可访问。Kie 的 `image_urls` 直接使用该公开 URL 即可，无需实现需求文档中提到的 HMAC 签名代理方案。

**简化效果**：省掉 Route Handler `/api/r2/signed`、HMAC 签名逻辑、签名验证逻辑。

### 9.2 为什么不修改 editor store？

`useEditorStore` 是纯 UI 状态（画布、画笔、缩放、历史记录等）。异步任务状态（requestId、轮询、错误）是业务逻辑，放在独立的 `useEditTask` hook 中，保持关注点分离。

### 9.3 为什么用 Server Actions 而非 API Routes？

- 项目已有成熟的 `next-safe-action` 模式
- Server Actions 天然支持 Zod 校验
- 轮询场景下 Server Actions 和 Route Handler 性能无差异
- 保持代码风格统一

### 9.4 匿名用户方案

MVP 阶段最简方案：
- 使用 `actionClient`（不要求登录）
- 如果有 session 则存 userId，否则 userId 为 null
- 前端通过 requestId 追踪自己的任务
- requestId 存在组件 state 中，页面刷新即丢失（MVP 可接受）
- 后续可增强：requestId 存 localStorage / URL params，支持刷新后恢复

### 9.5 Base64 vs URL 的图片流转

```
编辑器（base64）
  → startEditAction：base64 转 Buffer → 上传 R2 → 公开 URL → 给 Kie
  → 结果返回：Kie resultUrl → fetch 下载 → 上传 R2 → 公开 URL → 返回前端
  → 前端：fetch URL → 转 base64 → pushImageHistory → 编辑器展示
```

虽然多了几次转换，但这是异步任务模型的必然代价，且每步都有缓存（R2 存储）。

---

## 10. 轮询与节流策略

### 前端轮询

| 参数 | 值 | 说明 |
|------|------|------|
| refetchInterval | 2000ms | 每 2 秒轮询一次 |
| 停止条件 | status !== RUNNING | SUCCEEDED/FAILED 后停止 |

### 服务端节流

| 参数 | 值 | 说明 |
|------|------|------|
| 最小 poll 间隔 | 3000ms | `now - lastProviderPollAt < 3s` 则跳过 |
| 最大连续错误 | 10 次 | `pollErrorCount >= 10` 判定失败 |
| 错误退避 | 无（MVP 简化） | 连续错误时仍按正常间隔轮询 |

**效果**：前端每 2s 轮询，服务端最多每 3s 请求 Kie 一次，避免过度打 Kie API。

---

## 11. 错误处理

### 11.1 startEdit 阶段

| 错误场景 | 处理 |
|---------|------|
| R2 上传失败 | 直接返回错误，不写 DB |
| Kie 401（Key 错误） | 写 DB: FAILED，返回 "Service configuration error" |
| Kie 402（余额不足） | 写 DB: FAILED，返回 "Service temporarily unavailable" |
| Kie 400/422（参数错误） | 写 DB: FAILED，返回具体错误 |
| Kie 404（资源不存在） | 写 DB: FAILED，返回 "Service error, please try again" |
| Kie 429（限流） | 写 DB: FAILED，返回 "Service busy, please try again later" |
| Kie 500 | 写 DB: FAILED，返回 "Service error, please try again" |
| Kie HTTP 200 但 code !== 200 | 写 DB: FAILED，返回 msg 内容 |

### 11.2 getEdit 轮询阶段

| 错误场景 | 处理 |
|---------|------|
| Kie recordInfo 网络错误 | pollErrorCount++，保持 RUNNING |
| Kie recordInfo 429/500 | pollErrorCount++，保持 RUNNING |
| Kie recordInfo 404 | 写 DB: FAILED（taskId 不存在，不可恢复） |
| Kie recordInfo HTTP 200 但 code !== 200 | pollErrorCount++，保持 RUNNING |
| 连续 10 次 poll 失败 | 写 DB: FAILED |
| Kie state=fail | 写 DB: FAILED + failMsg |
| 结果下载/上传 R2 失败 | finalizeErrorCount++；< 3 次 → FINALIZING 回退 RUNNING 重试；≥ 3 次 → FAILED（providerResultJson 已落库） |

### 11.3 前端错误展示

- FAILED → toast.error 展示 errorMessage
- 网络错误（调 server action 失败） → toast.error 通用提示

---

## 12. 实施任务拆解

### Phase 1：基础设施（预计 0.5 天）

**任务 1.1：数据模型**
- [ ] 在 `src/db/schema.ts` 新增 `editRequests` 表
- [ ] 运行 `pnpm db:generate` 生成迁移
- [ ] 运行 `pnpm db:migrate` 应用迁移
- 验收：Drizzle Studio 中能看到新表

**任务 1.2：Kie 客户端**
- [ ] 新建 `src/lib/kie-client.ts`
- [ ] 实现 `createTask` 和 `getRecordInfo`
- [ ] 定义错误类型
- [ ] 在 `env.example` 添加 `KIE_API_KEY`
- 验收：能通过 Kie 客户端手动发起一次任务

### Phase 2：Server Actions（预计 1 天）

**任务 2.1：startEditAction**
- [ ] 新建 `src/actions/image-edit.ts`
- [ ] 实现 base64 → R2 上传 → Kie createTask → 写 DB 完整流程
- [ ] 构建 prompt（remove → 内置 prompt；chat → 用户原文）
- 验收：调用 action 后 DB 中出现 RUNNING 记录

**任务 2.2：getEditAction**
- [ ] 实现轮询查询逻辑
- [ ] 实现节流策略
- [ ] 实现结果搬运（FINALIZING CAS 锁 + Kie resultUrl → R2）
- [ ] 实现搬运失败回退（FINALIZING → RUNNING）
- [ ] 实现错误累计与判死逻辑
- 验收：能从 RUNNING 轮询到 SUCCEEDED，R2 中有输出文件

### Phase 3：前端改造（预计 1 天）

**任务 3.1：useEditTask Hook**
- [ ] 新建 `src/components/image-editor/hooks/use-edit-task.ts`
- [ ] 实现 startTask / 轮询 / 状态管理
- [ ] 成功后自动将结果推入编辑器 history
- 验收：hook 功能可独立运行

**任务 3.2：改造 RemoveButton**
- [ ] 替换 fetch 为 useEditTask
- [ ] 处理异步状态展示
- 验收：brush 遮罩 → 点击 remove → 看到 AI 处理结果

**任务 3.3：改造 ChatPanel**
- [ ] 替换 fetch 为 useEditTask
- [ ] 直接使用 currentImage（无遮罩，无 composite）
- 验收：输入 prompt → 提交 → 看到 AI 处理结果

### Phase 4：收尾（预计 0.5 天）

**任务 4.1：错误处理完善**
- [ ] 完善各阶段错误提示
- [ ] 添加 i18n 翻译 key

**任务 4.2：清理**
- [ ] 删除或标记 deprecated 原 mock API routes
- [ ] 代码 lint & format

---

## 13. 已知限制（MVP 可接受）

1. **前端轮询驱动**：如果用户关闭页面，任务在 Kie 侧仍会完成，但结果不会自动搬运到 R2。不过因为 `providerResultJson` 已存入 DB，后续任何人触发 `getEdit(requestId)` 都能补完搬运。

2. **匿名任务不持久**：匿名用户的 requestId 存在组件 state 中，刷新页面后丢失，无法恢复正在进行的任务。

3. **无积分扣减**：MVP 不做积分消耗，后续需补充。

4. **单次编辑**：不支持批量编辑，每次提交一张图。

5. **CF Workers 执行限制**：部署在 Cloudflare Workers 上，CPU 时间限制 30s（Paid）。`startEditAction` 中的 base64 解码 + R2 上传 + Kie createTask 以 I/O 为主，CPU 消耗极低，不会触及限制。`getEditAction` 同理。

6. **图片大小**：Kie 要求单张 ≤10MB。base64 编码后约 13.3MB，通过 Server Action 传输。需在前端校验文件大小（≤10MB），避免超出 Kie 限制。注意：现有 `MAX_FILE_SIZE = 4MB` 是通用上传 API 的限制（Vercel 遗留），image-edit 的 Server Action 需使用独立的大小限制（10MB）。

7. **Kie 数据保留**：第三方 API 不会永久保留 task 记录和 resultUrls。通过 `providerResultJson` 字段在第一时间落库，确保即使 Kie 清理数据后仍能重试搬运。

---

## 14. 后续增强（不在 MVP 范围）

- [ ] 后台 reconcile：定时扫 RUNNING 状态记录，补全搬运
- [ ] 积分系统对接
- [ ] 匿名用户 → 登录后关联历史任务
- [ ] 任务列表页面（用户查看历史编辑记录）
- [ ] 支持 Kie 的 callbackURL 替代轮询
- [ ] 多供应商支持（Provider 模式，如 Replicate、Stability 等）
