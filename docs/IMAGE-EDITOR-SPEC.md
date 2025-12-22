# Image Editor 技术规格文档

---

## 概述

本文档描述了图片编辑器功能的技术规格，该编辑器允许用户上传图片后在全屏浮窗中进行涂抹标记，并调用 AI 接口移除标记区域的内容。

---

## 功能需求

### 核心功能

| 功能 | 描述 |
|------|------|
| 全屏编辑器 | 用户上传图片后，以全屏浮窗形式进入编辑状态，不跳转页面 |
| 画布 | 使用 react-konva 实现，展示用户图片，支持缩放 |
| 画笔工具 | 默认选中，颜色 #FF007A，透明度 50%（固定），画笔大小可调 |
| 橡皮擦工具 | 擦除涂抹区域 |
| 移除功能 | 将融合图（原图 + 涂抹区域合成）发送后端，生成结果覆盖当前图片 |
| Chat 工具 | 输入 prompt 进行 AI 图片编辑 |
| Undo/Redo | 针对图片生成历史的版本切换 |
| 下载 | 下载当前图片 |
| 对比功能 | 分屏滑动对比原始图片与当前图片 |
| 缩放控件 | 右下角垂直缩放按钮，显示当前缩放比例，点击比例可重置为适应窗口 |
| Debug 模式 | 实时预览提交给后端的融合图 |
| 移动端适配 | 响应式布局，触摸手势支持 |

### 用户流程

```
用户上传图片
    ↓
打开 ImageEditorDialog（全屏浮窗）
    ↓
用户使用 Brush 涂抹要移除的区域
    ↓
点击"移除"按钮
    ↓
合成融合图（原图 + 涂抹区域叠加）
    ↓
调用后端 API（融合图）
    ↓
返回结果图片，覆盖画布上的图片
    ↓
用户可继续编辑或下载
```

---

## 设计决策

| 项目 | 决策 | 说明 |
|------|------|------|
| 全屏样式 | 真正全屏 (100vw × 100vh) | 无边距，沉浸式编辑体验 |
| 头部布局 | 左侧退出，右侧功能按钮 | 退出按钮左上角，其他功能按钮右上角 |
| 头部按钮顺序 | 从右到左：下载、对比、Redo、Undo、Debug | 常用操作集中在头部 |
| 工具栏位置 | 底部固定 | 仅保留绘制工具：Brush、Eraser、Chat |
| 移动端工具栏 | 底部水平排列 | 符合移动端操作习惯 |
| 橡皮擦实现 | compositeOperation 直接擦除 | 体验更流畅 |
| Undo/Redo 范围 | 仅针对图片版本 | 不包含涂抹操作历史，切换时清空当前 lines |
| 对比功能 | 分屏滑动对比 | 左侧原图，右侧当前图，拖动滑块调整 |
| 缩放控件位置 | 右下角垂直排列 | +/比例/-，点击比例重置为适应窗口 |
| Debug 预览位置 | 缩放控件上方 | 仅在 Debug 模式开启时显示 |
| Chat 输入框位置 | 工具栏上方 | 点击 Chat 工具时显示 |
| 后端服务 | Mock 接口 | 预留真实接口接入点 |

---

## 约束与限制

### 图片限制

| 限制项 | 值 | 说明 |
|--------|------|------|
| 最大文件大小 | 10MB | 超出时提示用户压缩后重试 |
| 最大分辨率 | 4096 × 4096px | 单边不超过 4096px |
| 支持格式 | JPEG, PNG, WebP | 不支持 GIF、SVG、HEIC |
| 最小分辨率 | 100 × 100px | 太小的图片无编辑意义 |

**处理策略**：
- 超出大小限制：拒绝上传，提示"图片大小不能超过 10MB"
- 超出分辨率：自动缩放到 4096px 内，保持宽高比
- 格式不支持：拒绝上传，提示支持的格式列表

### 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 最近 2 个主版本 |
| Edge | 最近 2 个主版本 |
| Safari | 最近 2 个主版本 |
| Firefox | 最近 2 个主版本 |

**不支持**：IE11、旧版移动浏览器

### 性能指标

| 指标 | 目标值 |
|------|--------|
| 编辑器打开时间 | < 500ms |
| 涂抹响应延迟 | < 16ms (60fps) |
| 融合图生成时间 | < 200ms |
| 历史记录上限 | 15 张图片 |

---

## 界面布局

### Desktop 布局 (≥768px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌───┐                               ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐      │
│ │ ✕ │                               │🔧 │ │ ↩️ │ │ ↪️ │ │ ⊞ │ │ ⬇️ │      │
│ └───┘                               └───┘ └───┘ └───┘ └───┘ └───┘      │
│ 退出                                Debug  Undo  Redo  对比   下载      │
│                                                                         │
│                                                                         │
│                     ┌───────────────────────────────┐                   │
│                     │                               │                   │
│                     │                               │                   │
│                     │                               │                   │
│                     │                               │                   │
│                     │       用户上传的图片           │                   │
│                     │       (可缩放/拖动)            │                   │
│                     │                               │                   │
│                     │                               │                   │
│                     │                               │       ┌─────────┐ │
│                     │                               │       │ Preview │ │
│                     │                               │       │ (Debug) │ │
│                     └───────────────────────────────┘       ├─────────┤ │
│                                                             │    +    │ │
│                                                             ├─────────┤ │
│                                                             │  100%   │ │
│                                                             ├─────────┤ │
│                                                             │    -    │ │
│                                                             └─────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │   ○──────────────────●─────────────────○   Brush Size             │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  🖌️  │  🧹  │  💬  │                                    │   移除   │  │
│  │Brush │Eraser│ Chat │                                    │  Button  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Desktop - Chat 激活状态

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌───┐                               ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐      │
│ │ ✕ │                               │🔧 │ │ ↩️ │ │ ↪️ │ │ ⊞ │ │ ⬇️ │      │
│ └───┘                               └───┘ └───┘ └───┘ └───┘ └───┘      │
│                                                                         │
│                     ┌───────────────────────────────┐                   │
│                     │                               │                   │
│                     │                               │                   │
│                     │       用户上传的图片           │                   │
│                     │       (可缩放/拖动)            │       ┌─────────┐ │
│                     │                               │       │ Preview │ │
│                     │                               │       │ (Debug) │ │
│                     └───────────────────────────────┘       ├─────────┤ │
│                                                             │    +    │ │
│                                                             ├─────────┤ │
│                                                             │  100%   │ │
│                                                             ├─────────┤ │
│                                                             │    -    │ │
│                                                             └─────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ 💬 描述你想要的修改...                                     [发送] │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                        ↑ Chat 输入框 (工具栏上方)                        │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  🖌️  │  🧹  │  💬  │                                    │   移除   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                  ↑ 💬 高亮状态                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Desktop - 对比模式

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌───┐                               ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐      │
│ │ ✕ │                               │🔧 │ │ ↩️ │ │ ↪️ │ │ ⊞ │ │ ⬇️ │      │
│ └───┘                               └───┘ └───┘ └───┘ └───┘ └───┘      │
│                                                       ↑高亮             │
│                                                                         │
│           ┌─────────────────────────────────────────────────┐           │
│           │                       │                         │           │
│           │                       │                         │           │
│           │      原始图片          │←──滑块──→  当前图片      │           │
│           │                       │                         │           │
│           │                       │                         │           │
│           └─────────────────────────────────────────────────┘           │
│                                                                         │
│                    ← 拖动滑块左右调整分屏位置 →                           │
│                                                                         │
│  对比模式下隐藏：                                                        │
│  - 底部工具栏                                                           │
│  - 缩放控件                                                             │
│  - Debug 预览                                                           │
│                                                                         │
│  再次点击对比按钮退出对比模式                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile 布局 (<768px)

```
┌────────────────────────────────┐
│ ┌───┐      ┌───┐┌───┐┌───┐┌───┐┌───┐│
│ │ ✕ │      │🔧 ││ ↩️ ││ ↪️ ││ ⊞ ││ ⬇️ ││
│ └───┘      └───┘└───┘└───┘└───┘└───┘│
│ 退出      Debug Undo Redo 对比 下载 │
│                                │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │                            │ │
│ │      用户上传的图片         │ │
│ │      (可缩放/拖动)          │ │
│ │                            │ │
│ │                   ┌──────┐ │ │
│ │                   │Preview│ │ │
│ │                   ├──────┤ │ │
│ │                   │  +   │ │ │
│ │                   ├──────┤ │ │
│ │                   │ 100% │ │ │
│ │                   ├──────┤ │ │
│ │                   │  -   │ │ │
│ └───────────────────┴──────┘ │ │
│                                │
│ ┌────────────────────────────┐ │
│ │  ○───────────●──────○      │ │
│ │       Brush Size           │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │  🖌️   │   🧹   │   💬      │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │          移除              │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

### Mobile - Chat 激活状态

```
┌────────────────────────────────┐
│ ┌───┐      ┌───┐┌───┐┌───┐┌───┐┌───┐│
│ │ ✕ │      │🔧 ││ ↩️ ││ ↪️ ││ ⊞ ││ ⬇️ ││
│ └───┘      └───┘└───┘└───┘└───┘└───┘│
│                                │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │      用户上传的图片         │ │
│ │      (可缩放/拖动)          │ │
│ │                   ┌──────┐ │ │
│ │                   │  +   │ │ │
│ │                   ├──────┤ │ │
│ │                   │ 100% │ │ │
│ │                   ├──────┤ │ │
│ │                   │  -   │ │ │
│ └───────────────────┴──────┘ │ │
│                                │
│ ┌────────────────────────────┐ │
│ │ 💬 描述你想要的修改...      │ │
│ │                    [发送]  │ │
│ └────────────────────────────┘ │
│       ↑ Chat 输入框            │
│                                │
│ ┌────────────────────────────┐ │
│ │  🖌️   │   🧹   │   💬      │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │          移除              │ │
└────────────────────────────────┘
```

---

## 底部区域层级结构

从下往上的堆叠顺序：

```
┌─────────────────────────────────────────┐
│              移除按钮                    │  ← 最底层，始终可见
├─────────────────────────────────────────┤
│  🖌️ │ 🧹 │ 💬                            │  ← 工具栏，始终可见
├─────────────────────────────────────────┤
│  Chat 输入框 (点击💬时显示/隐藏)         │  ← 条件显示
├─────────────────────────────────────────┤
│  Brush Size 滑块                        │  ← 选中 Brush/Eraser 时显示
└─────────────────────────────────────────┘
```

**交互逻辑**：
- 选中 Brush/Eraser → 显示 Brush Size 滑块
- 点击 Chat → 显示 Chat 输入框，隐藏 Brush Size 滑块
- 再次点击 Chat 或点击其他工具 → 隐藏 Chat 输入框
- 进入对比模式 → 隐藏底部所有工具栏和控件

---

## Chat 与涂抹/移除的交互关系

### 设计决策：Chat 和 Inpaint 是**互斥模式**

| 模式 | 说明 |
|------|------|
| Inpaint 模式 | 使用 Brush 涂抹 → 点击移除 → 发送融合图 |
| Chat 模式 | 输入 prompt → 发送 currentImage + prompt |

**不支持组合**：不支持"涂抹 + prompt"的组合编辑（如"移除涂抹区域并把背景变成海滩"）。

### Chat 激活时的状态处理

| 状态项 | Chat 激活时的行为 |
|--------|------------------|
| 已有涂抹 (lines) | **保留显示**，但不参与 Chat 请求 |
| 移除按钮 | **保持可用**（如果 hasMask=true） |
| Brush/Eraser | 可切换回去继续涂抹 |

### 状态转换矩阵

```
┌─────────────────────────────────────────────────────────────────┐
│                        activeTool                               │
│         ┌─────────┬─────────┬─────────┐                        │
│         │  brush  │ eraser  │  chat   │                        │
├─────────┼─────────┼─────────┼─────────┤                        │
│ 可涂抹   │   ✅    │   ✅    │   ❌    │                        │
│ 显示滑块 │   ✅    │   ✅    │   ❌    │                        │
│ 显示输入框│   ❌    │   ❌    │   ✅    │                        │
│ 移除可用 │ hasMask │ hasMask │ hasMask │ ← 始终取决于 hasMask   │
└─────────┴─────────┴─────────┴─────────┘
```

### Chat 发送后的处理

```typescript
async function handleChatSubmit(prompt: string) {
  setProcessing(true)

  try {
    // Chat 只发送 currentImage，不包含涂抹
    const result = await chatEditAPI({
      image: currentImage,  // 不是融合图
      prompt
    })

    // 成功后：
    pushImageHistory(result.image)  // 自动清空 lines
    setActiveTool('brush')          // 可选：切回 Brush 工具

  } catch (error) {
    // 失败：保留 lines 和输入框
    showToast(error.message)
  } finally {
    setProcessing(false)
  }
}
```

### 用户场景示例

| 场景 | 用户操作 | 系统行为 |
|------|----------|----------|
| 先涂抹后 Chat | 画了涂抹 → 切到 Chat → 输入 prompt → 发送 | Chat 只发送 currentImage（无涂抹），成功后 lines 清空 |
| 先 Chat 后涂抹 | Chat 成功 → 切到 Brush → 涂抹 → 移除 | 正常 Inpaint 流程 |
| Chat 激活时点移除 | 有涂抹 → 切到 Chat → 点移除按钮 | 执行移除（发送融合图），Chat 输入框关闭 |

### 为什么不支持组合模式

| 考量 | 说明 |
|------|------|
| 用户心智模型 | "涂抹移除"和"文字编辑"是两种不同的编辑意图 |
| 后端接口 | 需要不同的 API（inpaint vs chat），组合需要新接口 |
| MVP 复杂度 | 组合模式增加交互复杂度，后续迭代可考虑 |

---

## 工具栏设计

### 头部工具栏布局

```
┌───────┐                                    ┌───────────────────────────────┐
│  ✕    │                                    │ 🔧 │ ↩️ │ ↪️ │ ⊞ │ ⬇️          │
│ 退出   │                                    │Debug│Undo│Redo│对比│下载        │
└───────┘                                    └───────────────────────────────┘
    ↑                                                      ↑
  左侧固定                                              右侧工具组
                                                    (从右到左排列)
```

### 底部工具栏布局

```
┌──────┬──────┬──────┬──────────────┬─────────────┐
│  🖌️  │  🧹  │  💬  │              │    移除     │
│Brush │Eraser│ Chat │   (空白)     │   Button    │
└──────┴──────┴──────┴──────────────┴─────────────┘
   ↑                        ↑              ↑
 左侧绘制工具组          flex-grow       右侧固定
 (均分或固定宽度)        撑开间距         突出显示
```

**移动端**：移除按钮独立一行，工具图标均分宽度

### 工具状态

**头部工具栏**（从左到右）：

| 图标 | 工具 | 默认状态 | 激活状态 | 禁用状态 |
|------|------|----------|----------|----------|
| ✕ | 退出 | 灰色 | hover 高亮 | - |

**头部工具栏**（右侧，从左到右）：

| 图标 | 工具 | 默认状态 | 激活状态 | 禁用状态 |
|------|------|----------|----------|----------|
| 🔧 | Debug | 灰色 | 开启时高亮 | - |
| ↩️ | Undo | 灰色 | 可点击 | historyIndex <= 0 或 isProcessing |
| ↪️ | Redo | 灰色 | 可点击 | historyIndex >= history.length-1 或 isProcessing |
| ⊞ | 对比 | 灰色 | 对比模式时高亮 | history.length <= 1 或 isProcessing |
| ⬇️ | Download | 灰色 | hover 高亮 | - |

**底部工具栏**：

| 图标 | 工具 | 默认状态 | 激活状态 | 禁用状态 |
|------|------|----------|----------|----------|
| 🖌️ | Brush | 灰色 | 主色高亮+背景 | isProcessing 时禁用 |
| 🧹 | Eraser | 灰色 | 主色高亮+背景 | !hasMask 或 isProcessing 时禁用 |
| 💬 | Chat | 灰色 | 主色高亮+背景 | isProcessing 时禁用 |
| 🗑️ | 清除涂抹 | 灰色 | hover 高亮 | !hasMask 或 isProcessing 时禁用 |

### 移除按钮状态

```
无涂抹时 (!hasMask):
┌─────────────────────────────┐
│         移除               │  ← 灰色背景，disabled
└─────────────────────────────┘

有涂抹时 (hasMask && !isProcessing):
┌─────────────────────────────┐
│         移除               │  ← 主色背景 (#FF007A)，可点击
└─────────────────────────────┘

处理中 (isProcessing):
┌─────────────────────────────┐
│     ○ 处理中...            │  ← 主色背景，loading spinner，禁用点击
└─────────────────────────────┘
```

**禁用条件**：`!hasMask || isProcessing`

---

## 缩放控件

### 布局

```
┌─────────┐
│    +    │  ← 放大按钮
├─────────┤
│  100%   │  ← 当前缩放比例，点击重置为适应窗口
├─────────┤
│    -    │  ← 缩小按钮
└─────────┘
```

### 交互逻辑

| 操作 | 行为 |
|------|------|
| 点击 + | 放大 10% |
| 点击 - | 缩小 10% |
| 点击比例数字 | 在 "1:1 原始比例" 和 "适应窗口" 之间切换 |
| 鼠标滚轮 | 缩放画布 |
| 双指捏合 (移动端) | 缩放画布 |

**比例数字点击逻辑**：
- 当前接近 Fit → 切换到 100% (1:1 原始比例，查看像素细节)
- 当前接近 100% 或其他值 → 切换到 Fit (适应窗口)

### 缩放范围

- 最小：10% (0.1x)
- 最大：500% (5x)
- 适应窗口 (Fit)：根据图片和窗口大小自动计算
- 原始比例 (1:1)：100%，1 像素对应 1 屏幕像素

### 显示规则

- 正常模式：显示在右下角
- 对比模式：隐藏
- Debug 模式：显示在 Debug 预览下方

---

## 下载功能

### 下载内容

下载的是 **currentImage**（当前编辑结果），**不包含涂抹遮罩**。

| 项目 | 说明 |
|------|------|
| 图片内容 | `imageHistory[historyIndex]`，即当前显示的底图 |
| 涂抹遮罩 | ❌ 不包含（红色涂抹区域不会出现在下载图片中） |

### 导出格式

| 场景 | 格式 | 说明 |
|------|------|------|
| 原图为 JPEG | JPEG (quality: 0.92) | 保持原格式，避免体积膨胀 |
| 原图为 PNG | PNG | 保持透明度支持 |
| 原图为 WebP | WebP (quality: 0.92) | 保持原格式 |
| 无法判断 | PNG | 默认使用无损格式 |

**格式检测**：通过原图 base64 的 MIME type 或文件扩展名判断。

### 导出尺寸

| 场景 | 尺寸 |
|------|------|
| 默认 | 原始尺寸（`naturalWidth × naturalHeight`） |
| 上传时被压缩 | 压缩后的尺寸（即 currentImage 的实际尺寸） |

**注意**：如果上传时图片超过 4096px 被自动压缩，下载的也是压缩后的尺寸。

### 文件命名

```
edited_{timestamp}.{ext}
```

| 组成部分 | 说明 | 示例 |
|----------|------|------|
| 前缀 | 固定为 `edited_` | - |
| timestamp | 13 位时间戳 | `1703234567890` |
| ext | 根据格式决定 | `.jpg` / `.png` / `.webp` |

**完整示例**：`edited_1703234567890.jpg`

### 下载实现

```typescript
function downloadCurrentImage() {
  const link = document.createElement('a')
  const format = detectImageFormat(originalImage)  // 检测原图格式
  const ext = format === 'jpeg' ? 'jpg' : format
  const filename = `edited_${Date.now()}.${ext}`

  link.download = filename
  link.href = currentImage  // base64 或 blob URL
  link.click()
}
```

### 下载按钮状态

| 状态 | 是否可用 |
|------|----------|
| 正常编辑 | ✅ 可用 |
| isProcessing | ✅ 可用（可下载当前图） |
| 对比模式 | ✅ 可用（下载 currentImage） |

---

## 对比功能

### 交互方式

分屏滑动对比，用户可拖动中间分隔线查看原图与当前图的差异。

```
┌─────────────────────────────────────────────────┐
│                       │                         │
│                       │                         │
│      原始图片          │←───滑块───→ 当前图片     │
│   (首次上传的图片)      │        (最新编辑结果)    │
│                       │                         │
│                       │                         │
└─────────────────────────────────────────────────┘
```

### 状态管理

| 状态 | 值 |
|------|------|
| isCompareMode | boolean - 是否处于对比模式 |
| comparePosition | number - 分隔线位置 (0-100%) |

### 进入/退出对比模式

- **进入**：点击对比按钮 (⊞)
- **退出**：再次点击对比按钮

### 对比模式下的 UI 变化

| 元素 | 状态 |
|------|------|
| 对比按钮 | 高亮显示 |
| DrawingLayer (涂抹层) | **隐藏** (不显示红色遮罩) |
| 底部工具栏 | 隐藏 |
| Brush Size 滑块 | 隐藏 |
| Chat 输入框 | 隐藏 |
| 移除按钮 | 隐藏 |
| 缩放控件 | 隐藏 |
| Debug 预览 | 隐藏 |
| 头部其他按钮 | 保持可见 |

**DrawingLayer 隐藏说明**：
- 对比的核心目的是查看"修复效果 vs 原图"
- 红色涂抹遮罩会遮挡图片细节，干扰对比观察
- 退出对比模式后，恢复显示 DrawingLayer
- 如需确认标记区域，可使用 Debug 预览

### 禁用条件

- 当 `imageHistory.length <= 1` 时，对比按钮禁用（没有可对比的历史）

### 对比模式下的缩放/拖拽

| 操作 | 是否允许 | 说明 |
|------|----------|------|
| 缩放 | ✅ 允许 | 放大查看修复细节 |
| 拖拽平移 | ✅ 允许 | 移动到关注区域 |
| 滑块拖动 | ✅ 允许 | 调整分屏位置 |

**实现要点**：
- 进入对比模式时，重置为 Fit（适应窗口）
- 两张图（原图/当前图）共享同一个 `{ scale, x, y }` transform 状态
- 缩放/平移操作同步作用于两张图
- 这样用户放大某个区域时，两张图显示相同位置，便于对比

**MVP 备选方案**：如果时间紧张，可先禁用缩放/拖拽（强制 Fit），后续迭代加入。

---

## Debug 预览窗口

```
┌─────────────────┐
│                 │
│   原图 + 涂抹    │  ← 融合图预览
│   区域叠加       │    (将发送给后端的图片)
│                 │
│                 │
└─────────────────┘
  约 120×120px
  位于缩放控件上方
  仅在 Debug 模式开启时显示
```

**说明**：Debug 预览显示的是原图与涂抹区域（#FF007A 50%透明度）叠加后的融合图，即实际发送给后端的图片。

### 性能优化

涂抹过程中频繁生成预览图会导致卡顿，需要做性能优化：

| 平台 | 策略 | 说明 |
|------|------|------|
| Desktop | Throttle 100ms | 每 100ms 最多更新一次，保持实时感 |
| Mobile | Throttle 200ms | 移动端性能较弱，降低更新频率 |
| 备选方案 | 仅笔画结束时更新 | 最省性能，但失去实时预览 |

**推荐实现**：使用 Throttle 而非 Debounce
- Debounce：停止操作后才更新 → 涂抹过程中预览完全不动
- Throttle：固定频率更新 → 既有实时感，又不卡顿

---

## 融合图合成算法

融合图是发送给后端的图片，包含原图和涂抹遮罩。**必须正确处理 isEraser 语义**。

### 合成流程

```
currentImage (底图)
        ↓
创建临时 maskCanvas (透明背景)
        ↓
按顺序重放所有 lines:
  - isEraser=false → 正常绘制 (#FF007A, 50% 透明度)
  - isEraser=true  → 使用 destination-out 擦除
        ↓
将 maskCanvas 叠加到底图上
        ↓
导出为 base64 融合图
```

### 关键：必须使用独立的 maskCanvas

```typescript
function generateCompositeImage(
  currentImage: HTMLImageElement,
  lines: Line[]
): string {
  const width = currentImage.naturalWidth
  const height = currentImage.naturalHeight

  // 1. 创建遮罩层 canvas（透明背景）
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = width
  maskCanvas.height = height
  const maskCtx = maskCanvas.getContext('2d')!

  // 2. 按顺序重放所有 lines（关键：保持绘制顺序）
  for (const line of lines) {
    maskCtx.beginPath()
    maskCtx.lineCap = 'round'
    maskCtx.lineJoin = 'round'
    maskCtx.lineWidth = line.strokeWidth

    if (line.isEraser) {
      // 橡皮擦：使用 destination-out 擦除已绘制的内容
      maskCtx.globalCompositeOperation = 'destination-out'
      maskCtx.strokeStyle = 'rgba(0,0,0,1)'  // 颜色不重要，只要不透明
    } else {
      // 画笔：正常绘制
      maskCtx.globalCompositeOperation = 'source-over'
      maskCtx.strokeStyle = 'rgba(255, 0, 122, 0.5)'  // #FF007A, 50%
    }

    // 绘制路径
    const points = line.points
    if (points.length >= 2) {
      maskCtx.moveTo(points[0], points[1])
      for (let i = 2; i < points.length; i += 2) {
        maskCtx.lineTo(points[i], points[i + 1])
      }
      maskCtx.stroke()
    }
  }

  // 3. 创建最终 canvas，合成底图 + 遮罩
  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = width
  finalCanvas.height = height
  const finalCtx = finalCanvas.getContext('2d')!

  finalCtx.drawImage(currentImage, 0, 0)
  finalCtx.drawImage(maskCanvas, 0, 0)  // 叠加遮罩层

  return finalCanvas.toDataURL('image/png')
}
```

### 为什么需要独立的 maskCanvas

| 方案 | 问题 |
|------|------|
| 直接在底图上绘制 | `destination-out` 会擦除底图本身 |
| 不处理 isEraser | 被擦除的区域在融合图中仍有遮罩 |

**正确方案**：先在独立的透明 canvas 上重放所有 lines（含擦除），再叠加到底图。

### Debug 预览与融合图的一致性

Debug 预览必须使用**相同的合成算法**，确保"所见即所得"：

```typescript
// DebugPreview 组件
function updatePreview() {
  const compositeImage = generateCompositeImage(currentImage, lines)
  setPreviewSrc(compositeImage)
}
```

---

## 画布设计 (react-konva)

### 图层结构

```
Stage (可缩放)
  ├── Layer (ImageLayer)
  │     └── Image (用户图片)
  └── Layer (DrawingLayer)
        └── Group
              └── Line[] (涂抹笔画，#FF007A 50% 透明度)
```

**重要**：必须将绘图层与底图层分离。原因：
- 橡皮擦使用 `compositeOperation: 'destination-out'`
- 如果 Image 和 Line 在同一 Layer，橡皮擦会擦除底图，导致图片变透明
- 分层后，橡皮擦只作用于 DrawingLayer，露出下方的 ImageLayer

### 缩放方案

- 使用 Konva 的 `stage.scale()` 配合鼠标滚轮/双指缩放
- 移动端：双指捏合缩放
- 保持图片居中，限制最小/最大缩放比例 (0.1x - 5x)

### 坐标系与坐标映射

**核心原则**：`Line.points` 始终使用**原图坐标系**（Image Coordinates），与缩放/平移无关。

#### 坐标系定义

| 坐标系 | 说明 | 范围 |
|--------|------|------|
| 屏幕坐标 (Screen) | 鼠标/触摸事件的原始坐标 | 相对于 viewport |
| 画布坐标 (Stage) | Konva Stage 内的坐标 | 受 stage position 影响 |
| 原图坐标 (Image) | 相对于原始图片左上角的坐标 | (0,0) 到 (imageWidth, imageHeight) |

#### 涂抹时的坐标转换

```
用户触摸/点击 (屏幕坐标)
        ↓
Stage.getPointerPosition() → 画布坐标
        ↓
减去图片偏移，除以缩放比例 → 原图坐标
        ↓
存入 Line.points[]
```

**转换公式**：

```typescript
// 屏幕坐标 → 原图坐标
function screenToImageCoords(screenX: number, screenY: number): { x: number, y: number } {
  const stagePos = stage.getPointerPosition()  // 画布坐标
  const scale = stage.scaleX()                 // 当前缩放比例
  const imageOffset = { x: image.x(), y: image.y() }  // 图片在画布中的偏移

  return {
    x: (stagePos.x - imageOffset.x) / scale,
    y: (stagePos.y - imageOffset.y) / scale
  }
}
```

#### 渲染时的坐标转换

DrawingLayer 渲染 Line 时，需要应用与 ImageLayer 相同的 transform：

```typescript
// DrawingLayer 与 ImageLayer 共享同一个 transform
<Layer>
  <Group x={imageOffset.x} y={imageOffset.y} scaleX={scale} scaleY={scale}>
    {lines.map(line => (
      <Line points={line.points} ... />  // points 是原图坐标，Group 会自动应用 transform
    ))}
  </Group>
</Layer>
```

#### 融合图生成时的坐标处理

生成融合图时，直接使用原图坐标绘制到临时 canvas：

```typescript
function generateCompositeImage(currentImage: HTMLImageElement, lines: Line[]): string {
  // 1. 创建与原图相同尺寸的 canvas
  const canvas = document.createElement('canvas')
  canvas.width = currentImage.naturalWidth
  canvas.height = currentImage.naturalHeight
  const ctx = canvas.getContext('2d')!

  // 2. 绘制底图
  ctx.drawImage(currentImage, 0, 0)

  // 3. 绘制涂抹层（原图坐标，无需转换）
  // 详见下方"融合图合成算法"

  return canvas.toDataURL('image/png')
}
```

**关键点**：由于 `Line.points` 始终是原图坐标，融合图合成时无需任何坐标转换，直接绘制即可。

---

### 画笔参数

| 参数 | 值 |
|------|------|
| 颜色 | #FF007A |
| 透明度 | 50% (0.5) |
| 默认大小 | 20px |
| 大小范围 | 5px - 100px |
| lineCap | round |
| lineJoin | round |

### 触摸支持

**手势区分策略**：

| 手势 | 行为 | 实现要点 |
|------|------|----------|
| 单指触摸 | 绘制 | `touches.length === 1` 时启用绘制 |
| 双指触摸 | 缩放/平移 | `touches.length === 2` 时切换为缩放模式，中断绘制 |

**实现逻辑**：

```
onTouchStart:
  if (touches.length === 1) → 开始绘制
  if (touches.length === 2) → 进入缩放模式，取消当前笔画

onTouchMove:
  if (缩放模式 && touches.length === 2) → 计算缩放/平移
  if (绘制模式 && touches.length === 1) → 继续绘制

onTouchEnd:
  if (touches.length === 0) → 重置模式
```

**注意事项**：
- 双指触摸时必须立即中断绘制，避免留下意外笔画
- 从双指切换回单指时，不应自动开始绘制（需要重新 touchstart）
- 使用 `evt.evt.touches.length` 获取触摸点数量

---

## 组件架构

### 文件结构

```
src/components/image-editor/
├── ImageEditorDialog.tsx      # 全屏 Dialog 容器
├── EditorCanvas.tsx           # Konva 画布
├── EditorHeader.tsx           # 头部工具栏 (退出、Debug、Undo、Redo、对比、下载)
├── EditorToolbar.tsx          # 底部工具栏 (Brush、Eraser、Chat、清除涂抹)
├── BrushSizeSlider.tsx        # 画笔大小滑块
├── ChatPanel.tsx              # Chat 输入面板
├── DebugPreview.tsx           # Debug mask 预览
├── ZoomControls.tsx           # 缩放控件 (+/-/比例)
├── CompareView.tsx            # 分屏对比视图
├── RemoveButton.tsx           # 移除按钮
├── hooks/
│   ├── use-editor-state.ts    # 编辑器状态
│   ├── use-drawing.ts         # 涂抹逻辑
│   ├── use-image-history.ts   # 图片版本历史
│   └── use-zoom.ts            # 缩放逻辑
├── lib/
│   └── image-compositor.ts    # 将原图与涂抹区域合成融合图
└── types.ts
```

### 组件职责

| 组件 | 职责 |
|------|------|
| `ImageEditorDialog` | 全屏容器，管理打开/关闭状态，布局协调 |
| `EditorCanvas` | Konva Stage/Layer，图片渲染，涂抹绑定，缩放控制 |
| `EditorHeader` | 头部工具栏：退出、Debug、Undo、Redo、对比、下载 |
| `EditorToolbar` | 底部工具栏：Brush、Eraser、Chat |
| `BrushSizeSlider` | 滑块控件，调整画笔大小 |
| `ChatPanel` | 输入框 + 发送按钮 |
| `DebugPreview` | 实时渲染融合图缩略图 |
| `ZoomControls` | 缩放控件，+/-按钮和比例显示 |
| `CompareView` | 分屏对比视图，原图 vs 当前图 |
| `RemoveButton` | 移除按钮，状态管理 |

---

## 状态管理

### EditorState (use-editor-state hook)

```typescript
interface EditorState {
  // 编辑器状态
  isOpen: boolean
  originalImage: string | null      // 原始上传图片
  currentImage: string | null       // 当前显示图片

  // 工具状态
  activeTool: 'brush' | 'eraser' | 'chat'
  brushSize: number                 // 默认 20，范围 5-100

  // 涂抹状态
  lines: Line[]                     // 每条 line 包含 points 数组
  hasMask: boolean                  // 是否有涂抹（计算属性，见下方规则）

  // 历史状态（图片版本）
  imageHistory: string[]            // 图片版本数组
  historyIndex: number              // 当前版本索引

  // 缩放状态
  zoomLevel: number                 // 当前缩放比例 (0.1 - 5)
  fitZoomLevel: number              // 适应窗口的缩放比例
  lastZoomMode: 'fit' | '1:1'       // 上次重置时的模式，用于切换

  // 对比状态
  isCompareMode: boolean            // 是否处于对比模式
  comparePosition: number           // 分隔线位置 (0-100)

  // Debug
  debugMode: boolean

  // 加载状态
  isProcessing: boolean
}

interface Line {
  points: number[]                  // [x1, y1, x2, y2, ...]
  strokeWidth: number
  isEraser: boolean                 // true 时使用 destination-out
}
```

### Actions

```typescript
interface EditorActions {
  // 编辑器控制
  openEditor: (image: string) => void
  closeEditor: () => void

  // 工具切换
  setActiveTool: (tool: 'brush' | 'eraser' | 'chat') => void
  setBrushSize: (size: number) => void

  // 涂抹操作
  addLine: (line: Line) => void
  clearLines: () => void           // 清除所有涂抹，hasMask = false

  // 图片历史
  pushImageHistory: (image: string) => void
  undo: () => void                  // 同时清空 lines
  redo: () => void                  // 同时清空 lines

  // 缩放操作
  zoomIn: () => void                // 放大 10%
  zoomOut: () => void               // 缩小 10%
  toggleZoomReset: () => void       // 在 1:1 和 Fit 之间切换
  setZoomLevel: (level: number) => void

  // 对比操作
  toggleCompareMode: () => void
  setComparePosition: (position: number) => void

  // Debug
  toggleDebugMode: () => void

  // 处理状态
  setProcessing: (isProcessing: boolean) => void
}
```

### hasMask 计算规则

`hasMask` 是一个计算属性，用于控制移除按钮和橡皮擦的状态：

```typescript
// 计算规则：只要有非橡皮擦的线条，就认为有涂抹
hasMask = lines.some(line => !line.isEraser)
```

**边缘情况处理**：
| 场景 | hasMask | 说明 |
|------|---------|------|
| 画了一笔 | true | 正常情况 |
| 画一笔后用橡皮擦擦掉 | true | 技术上仍有画笔线条记录 |
| 用户点击"清除涂抹" | false | `lines = []` |
| Undo/Redo 后 | false | lines 被清空 |
| Inpaint/Chat 成功后 | false | lines 被清空 |

**注意**：如果用户画一笔后完全擦掉，`hasMask` 仍为 `true`。提交移除请求后，后端可能返回"无变化"的图片，这是可接受的行为。如需精确判断，可在提交前检查 DrawingLayer 是否有非透明像素（性能开销较大）。

### 清除涂抹功能

建议在工具栏或 Brush Size 滑块旁添加"清除涂抹"按钮：
- 功能：`lines = []`，`hasMask = false`
- 显示条件：`hasMask === true`
- 禁用条件：`isProcessing === true`

---

## API 设计

### 编辑模型：累积编辑

所有编辑操作（Inpaint、Chat）都基于 `currentImage`（即 `imageHistory[historyIndex]`），而非 `originalImage`。

```
originalImage → [Inpaint] → result1 → [Chat] → result2 → [Inpaint] → result3
                              ↑                   ↑                    ↑
                          currentImage         currentImage        currentImage
```

**为什么不能基于 originalImage**：
- 用户先用 Inpaint 移除了路人甲
- 再用 Chat 说"把天空变成日落色"
- 如果 Chat 基于 originalImage → 路人甲又回来了！

### Inpaint API (Mock)

```typescript
// POST /api/image-edit/inpaint
// 移除涂抹区域

interface InpaintRequest {
  image: string       // base64 融合图（currentImage + 涂抹区域叠加）
}

interface InpaintResponse {
  image: string       // base64 结果图
}

// Mock 实现：直接返回原图
```

### Chat Edit API (Mock)

```typescript
// POST /api/image-edit/chat
// 根据 prompt 编辑图片

interface ChatEditRequest {
  image: string       // base64 当前图片 (currentImage)
  prompt: string      // 用户输入的编辑指令
}

interface ChatEditResponse {
  image: string       // base64 结果图
}

// Mock 实现：直接返回原图
```

**重要**：Chat 必须基于 `currentImage` 而非 `originalImage`，与 Inpaint 保持一致的"累积编辑"模型。

---

## 异步处理与历史管理

### 请求状态处理

| 场景 | 处理 |
|------|------|
| 请求中 | `isProcessing = true`，禁用所有编辑操作 |
| 请求成功 | `pushImageHistory(result)`，清空 lines |
| 请求失败 | 不修改历史，保留 lines，显示错误提示 |
| 用户取消 | abort 请求，保持当前状态 |

### 处理中的禁用状态

当 `isProcessing === true` 时，禁用以下操作：

| 元素 | 状态 |
|------|------|
| Brush 工具 | 禁用 |
| Eraser 工具 | 禁用 |
| Chat 工具 | 禁用 |
| 移除按钮 | 显示 loading 状态 |
| Undo/Redo | 禁用 |
| 下载按钮 | 可用（下载当前图） |

**原因**：处理中如果允许继续涂抹，返回后涂抹状态难以处理（是保留还是清空？）。禁用更安全。

### 清空 lines 的时机

| 时机 | 是否清空 | 说明 |
|------|----------|------|
| Undo/Redo | ✅ 清空 | 底图变了，涂抹会错位 |
| Inpaint 成功 | ✅ 清空 | 涂抹已生效 |
| Chat 成功 | ✅ 清空 | 编辑已生效 |
| 请求失败 | ❌ 保留 | 用户可重试 |
| 用户取消 | ❌ 保留 | 用户可重试 |
| 用户点击"清除涂抹" | ✅ 清空 | 主动清除 |

### Redo 失效条件

采用标准的 Undo/Redo 模型：

```typescript
function pushImageHistory(newImage: string) {
  // 如果当前不在历史末尾，截断后续历史（redo 失效）
  if (historyIndex < imageHistory.length - 1) {
    imageHistory = imageHistory.slice(0, historyIndex + 1)
  }
  imageHistory.push(newImage)
  historyIndex = imageHistory.length - 1
  lines = []  // 清空涂抹
}
```

### 历史上限与内存管理

| 配置项 | 建议值 | 说明 |
|--------|--------|------|
| 最大历史数 | 10-20 | 每张图几 MB，20 张约几十 MB |
| 超限处理 | 丢弃最早版本 | FIFO 策略 |
| 可选优化 | IndexedDB 存储 | 减少内存占用 |

```typescript
const MAX_HISTORY = 15

function pushImageHistory(newImage: string) {
  // ... 截断逻辑 ...
  imageHistory.push(newImage)

  // 超限时丢弃最早版本
  if (imageHistory.length > MAX_HISTORY) {
    imageHistory.shift()
    historyIndex = Math.max(0, historyIndex - 1)
  }
}
```

**注意**：`originalImage` 始终保留，不受历史上限影响，用于对比功能。

---

## 错误处理

### 错误类型与提示

| 错误场景 | 错误码 | 用户提示 (中文) | 用户提示 (英文) |
|----------|--------|-----------------|-----------------|
| 图片过大 | FILE_TOO_LARGE | 图片大小不能超过 10MB | Image size cannot exceed 10MB |
| 分辨率过高 | RESOLUTION_TOO_HIGH | 图片分辨率过高，已自动压缩 | Image resolution too high, auto-compressed |
| 格式不支持 | UNSUPPORTED_FORMAT | 仅支持 JPEG、PNG、WebP 格式 | Only JPEG, PNG, WebP formats are supported |
| 网络错误 | NETWORK_ERROR | 网络连接失败，请检查网络后重试 | Network error, please check your connection |
| 服务器错误 | SERVER_ERROR | 服务器繁忙，请稍后重试 | Server is busy, please try again later |
| 处理超时 | TIMEOUT | 处理超时，请重试 | Processing timeout, please retry |
| 处理失败 | PROCESSING_FAILED | 图片处理失败，请重试 | Image processing failed, please retry |

### 错误展示方式

| 错误类型 | 展示方式 | 说明 |
|----------|----------|------|
| 上传错误 | Toast 提示 | 3 秒后自动消失 |
| 处理错误 | Toast 提示 + 保留涂抹 | 用户可直接重试 |
| 网络错误 | Toast 提示 + 重试按钮 | 移除按钮显示"重试" |

### 重试机制

```typescript
interface RetryConfig {
  maxRetries: 2           // 最大重试次数
  retryDelay: 1000        // 重试间隔 (ms)
  timeout: 30000          // 单次请求超时 (ms)
}
```

**重试策略**：
- 网络错误：自动重试，最多 2 次
- 服务器 5xx 错误：自动重试
- 客户端 4xx 错误：不重试，直接提示用户
- 超时：不自动重试，提示用户手动重试

---

## 依赖

### 新增依赖

```bash
pnpm add react-konva konva
```

### 现有可复用依赖

| 包名 | 用途 |
|------|------|
| `@radix-ui/react-dialog` | 全屏弹窗基础 |
| `@radix-ui/react-slider` | 画笔大小滑块 |
| `lucide-react` | 工具栏图标 |
| `react-dropzone` | 图片上传（已有） |
| `zustand` | 编辑器状态管理 |
| `sonner` | Toast 错误提示 |

---

## 国际化

需要在 `messages/en.json` 和 `messages/zh.json` 中添加以下翻译：

```json
{
  "ImageEditor": {
    "title": "Edit Image",
    "tools": {
      "brush": "Brush",
      "eraser": "Eraser",
      "chat": "Chat",
      "undo": "Undo",
      "redo": "Redo",
      "download": "Download",
      "compare": "Compare",
      "debug": "Debug",
      "clearMask": "Clear"
    },
    "brushSize": "Brush Size",
    "remove": "Remove",
    "removing": "Removing...",
    "retry": "Retry",
    "close": "Close",
    "chatPlaceholder": "Describe the changes you want...",
    "chatSend": "Send",
    "zoom": {
      "zoomIn": "Zoom In",
      "zoomOut": "Zoom Out",
      "resetZoom": "Fit to Window"
    },
    "compare": {
      "original": "Original",
      "current": "Current"
    },
    "errors": {
      "fileTooLarge": "Image size cannot exceed 10MB",
      "resolutionTooHigh": "Image resolution too high, auto-compressed",
      "unsupportedFormat": "Only JPEG, PNG, WebP formats are supported",
      "networkError": "Network error, please check your connection",
      "serverError": "Server is busy, please try again later",
      "timeout": "Processing timeout, please retry",
      "processingFailed": "Image processing failed, please retry"
    }
  }
}
```

---

## 实现注意事项

1. **🛑 图层分离（关键）**：
   - 必须将 ImageLayer 和 DrawingLayer 分离为两个独立的 Layer
   - 橡皮擦使用 `compositeOperation: 'destination-out'`
   - 如果在同一 Layer，橡皮擦会擦除底图导致透明
   - 分层后橡皮擦只擦除 DrawingLayer，露出下方 ImageLayer

2. **Konva 与 Next.js SSR**：react-konva 不支持 SSR，需要动态导入或确保只在客户端渲染

3. **图片跨域**：如果图片来自外部源，需要处理 CORS 以便 canvas 导出

4. **性能优化**：
   - 大图片需要在上传时压缩
   - 涂抹 lines 过多时考虑合并到单个 canvas

5. **触摸手势区分**：
   - 单指 touchstart → 绘制模式
   - 双指 touchstart → 缩放模式，立即中断当前笔画
   - 双指切换回单指时不自动开始绘制
   - 使用 `evt.evt.touches.length` 判断触摸点数量

6. **融合图生成**：将原图与涂抹区域合成时，需要创建临时 canvas，保持涂抹的颜色和透明度

7. **分屏对比实现**：
   - 使用 CSS clip-path 或 canvas 裁剪实现分屏效果
   - 分隔线需要支持拖拽，监听 mouse/touch 事件
   - 对比模式下需要同步两张图片的缩放和位置

8. **缩放控件**：
   - 缩放时以画布中心为缩放原点
   - 点击比例数字在 1:1 和 Fit 之间切换
   - 适应窗口需要计算图片与可视区域的比例
   - 缩放比例显示需要实时更新

9. **Undo/Redo 与涂抹状态**：
   - Undo/Redo 切换图片版本时，必须清空当前 lines
   - 原因：涂抹是基于当前图片的标记，底图变了涂抹区域会错位或无意义
   - 用户心智模型：回退版本 = 重新开始标记

10. **对比模式与涂抹层**：
    - 进入对比模式时隐藏 DrawingLayer（红色涂抹）
    - 原因：对比目的是看修复效果，涂抹遮罩干扰观察
    - 退出对比模式后恢复显示

11. **Debug 预览性能**：
    - 使用 Throttle (非 Debounce) 控制更新频率
    - Desktop: 100ms，Mobile: 200ms
    - 避免每次 mousemove/touchmove 都生成 base64

---

## 验收标准

### 功能验收

#### 基础功能
- [ ] 上传图片后打开全屏编辑器
- [ ] Brush 工具可正常涂抹，颜色为 #FF007A，透明度 50%
- [ ] Eraser 工具可擦除涂抹区域
- [ ] 画笔大小滑块可调整 Brush/Eraser 大小 (5-100px)
- [ ] 点击移除按钮后发送融合图到后端
- [ ] 移除成功后结果图覆盖当前图片
- [ ] 点击下载按钮可下载当前图片

#### 历史功能
- [ ] Undo 可回退到上一个图片版本
- [ ] Redo 可恢复到下一个图片版本
- [ ] Undo/Redo 切换时清空当前涂抹
- [ ] 历史记录不超过 15 张

#### Chat 功能
- [ ] 点击 Chat 工具显示输入框
- [ ] 输入 prompt 后发送可编辑图片
- [ ] Chat 成功后结果图覆盖当前图片

#### 对比功能
- [ ] 点击对比按钮进入分屏对比模式
- [ ] 可拖动滑块调整分屏位置
- [ ] 对比模式下隐藏涂抹层和工具栏
- [ ] 再次点击对比按钮退出

#### 缩放功能
- [ ] 点击 + 放大 10%
- [ ] 点击 - 缩小 10%
- [ ] 点击比例数字在 Fit 和 1:1 之间切换
- [ ] 鼠标滚轮可缩放
- [ ] 移动端双指可缩放

#### Debug 功能
- [ ] 开启 Debug 模式显示融合图预览
- [ ] 预览随涂抹实时更新（throttle）

### 响应式验收
- [ ] Desktop (≥768px) 布局正确
- [ ] Mobile (<768px) 布局正确
- [ ] 移动端触摸手势正常（单指绘制、双指缩放）

### 性能验收
- [ ] 编辑器打开时间 < 500ms
- [ ] 涂抹流畅无卡顿 (60fps)
- [ ] 大图 (4096px) 可正常编辑

### 错误处理验收
- [ ] 超大图片显示错误提示
- [ ] 网络错误显示提示并保留涂抹
- [ ] 处理超时显示提示
