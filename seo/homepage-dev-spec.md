# 首页开发规格文档

> 基于 `seo/seo-copy-final.md` 文案，创建 Remove People from Photos 首页

---

## 目录

1. [页面结构概览](#1-页面结构概览)
2. [组件清单](#2-组件清单)
3. [详细组件规格](#3-详细组件规格)
4. [翻译文件结构](#4-翻译文件结构)
5. [图片素材需求](#5-图片素材需求)
6. [开发顺序建议](#6-开发顺序建议)
7. [技术备注](#7-技术备注)

---

## 1. 页面结构概览

```
首页 (src/app/[locale]/(marketing)/(home)/page.tsx)
│
├── 1. Header (导航栏) ────────────── [已有] Navbar
│
├── 2. HeroSection ───────────────── [需改造] src/components/blocks/hero/hero1.tsx
│   ├── H1 标题 + 描述
│   ├── 上传组件 (Dropzone)
│   ├── "Try a sample" 链接
│   └── Trust badges (5个信任点)
│
├── 3. HowItWorksSection ─────────── [新建] src/components/blocks/how-it-works/
│   ├── Step 1: Upload
│   ├── Step 2: Brush
│   ├── Step 3: Download
│   └── Optional: Continue Editing 提示
│
├── 4. ResultsSection ────────────── [新建] src/components/blocks/results/
│   ├── 6个场景卡片 (各带 Before/After slider)
│   │   ├── 1) Travel landmarks / crowds
│   │   ├── 2) Photobombers
│   │   ├── 3) Remove your ex
│   │   ├── 4) Keep X, remove Y
│   │   ├── 5) Solo portrait
│   │   └── 6) Weddings & events
│   ├── Overlap callout (亮点收尾)
│   └── Under-gallery CTA
│
├── 5. TechSection ───────────────── [新建] src/components/blocks/tech/
│   ├── "Powered by Google Nano Banana" 说明
│   └── Social proof quotes (3-5条)
│
├── 6. BeyondRemovalSection ──────── [新建] src/components/blocks/beyond-removal/
│   ├── Lead 说明
│   ├── 5个功能卡片 (各带 Before/After slider)
│   │   ├── 1) Extend frame & re-compose
│   │   ├── 2) Move people closer
│   │   ├── 3) Change background
│   │   ├── 4) Polish the look
│   │   └── 5) Enhance resolution
│   └── Pro feature note
│
├── 7. PrivacySection ────────────── [新建] src/components/blocks/privacy/
│   ├── Title + Body
│   ├── 4个隐私要点
│   └── Privacy Policy 链接
│
├── 8. PricingSection ────────────── [需改造] src/components/blocks/pricing/
│   ├── Free Trial 卡片
│   └── Pro 卡片
│
├── 9. FaqSection ────────────────── [需改造] src/components/blocks/faqs/
│   ├── Quality (7个问题)
│   ├── Capability (7个问题)
│   ├── Technical (4个问题)
│   └── Privacy (1个问题)
│
├── 10. FinalCtaSection ──────────── [需改造] src/components/blocks/calltoaction/
│   ├── Title + Body
│   └── Upload Photo CTA
│
└── Footer (页脚) ─────────────────── [已有] Footer
```

---

## 2. 组件清单

### 可复用的现有组件

| 组件 | 路径 | 状态 | 改动说明 |
|------|------|------|----------|
| Navbar | `src/components/layout/navbar.tsx` | ✅ 可用 | 更新导航链接 |
| Footer | `src/components/layout/footer.tsx` | ✅ 可用 | 无需改动 |
| Container | `src/components/layout/container.tsx` | ✅ 可用 | 无需改动 |
| HeaderSection | `src/components/layout/header-section.tsx` | ✅ 可用 | 无需改动 |
| Button | `src/components/ui/button.tsx` | ✅ 可用 | 无需改动 |
| Accordion | `src/components/ui/accordion.tsx` | ✅ 可用 | 无需改动 |
| ImageUploader | `src/components/blocks/hero/image-uploader.tsx` | 🔧 需改造 | 添加 Trust badges |
| ImageEditorDialog | `src/components/image-editor/image-editor-dialog.tsx` | ✅ 可用 | 无需改动 |
| PricingTable | `src/components/pricing/pricing-table.tsx` | 🔧 需改造 | 调整展示内容 |

### 需新建的组件

| 组件 | 路径 | 优先级 |
|------|------|--------|
| BeforeAfterSlider | `src/components/ui/before-after-slider.tsx` | P0 |
| HowItWorksSection | `src/components/blocks/how-it-works/how-it-works.tsx` | P0 |
| ResultsSection | `src/components/blocks/results/results.tsx` | P0 |
| ScenarioCard | `src/components/blocks/results/scenario-card.tsx` | P0 |
| OverlapCallout | `src/components/blocks/results/overlap-callout.tsx` | P1 |
| TechSection | `src/components/blocks/tech/tech.tsx` | P1 |
| BeyondRemovalSection | `src/components/blocks/beyond-removal/beyond-removal.tsx` | P1 |
| CapabilityCard | `src/components/blocks/beyond-removal/capability-card.tsx` | P1 |
| PrivacySection | `src/components/blocks/privacy/privacy.tsx` | P1 |
| FinalCtaSection | `src/components/blocks/final-cta/final-cta.tsx` | P2 |

---

## 3. 详细组件规格

### 3.1 BeforeAfterSlider (P0 - 基础组件)

**路径:** `src/components/ui/before-after-slider.tsx`

**功能:** 图片前后对比滑动组件，从零实现

**Props:**
```typescript
interface BeforeAfterSliderProps {
  beforeImage: string;           // Before 图片 URL
  afterImage: string;            // After 图片 URL
  beforeAlt: string;             // Before 图片 alt
  afterAlt: string;              // After 图片 alt
  beforeLabel?: string;          // Before 标签文字 (默认 "Original")
  afterLabel?: string;           // After 标签文字 (默认 "Cleaned")
  initialPosition?: number;      // 初始滑块位置 (0-100, 默认 50)
  className?: string;
}
```

**实现要点:**
- 使用 `useRef` + `useState` 管理滑块位置
- 支持鼠标拖拽 + 触摸滑动
- CSS clip-path 实现图片裁剪效果
- 可选键盘操作支持 (左右箭头)
- 响应式适配

**UI 参考:**
```
┌─────────────────────────────────────┐
│  [Original]      │      [Cleaned]  │
│                  │                 │
│   Before Image   │   After Image   │
│                  │                 │
│                 ◄►                 │
│              (滑块)                │
└─────────────────────────────────────┘
```

---

### 3.2 HeroSection (改造)

**路径:** `src/components/blocks/hero/hero1.tsx`

**文案内容:**
```
H1: Remove people from photos online

描述: Brush over anyone you want gone—results appear in seconds.
     Clean edges, natural backgrounds, no Photoshop needed.

Dropzone: Drag and drop an image here, or click to upload.
         Supports JPG, PNG, HEIC, WEBP.

Try a sample: Or try a sample image (加载随机示例图片)

Trust badges (5个):
- Clean, natural-looking results (even at 100% zoom)
- Results in seconds—no waiting, no queue
- Keep X, remove Y: you choose who stays
- Ready to download or print
- Privacy-first: never shared or used for training
```

**改动点:**
1. 更新 H1 标题和描述文案
2. 添加 "Try a sample" 链接 (已有 handleExampleClick 逻辑)
3. 新增 Trust badges 组件 (小图标 + 文字chips)
4. 支持 HEIC 格式 (更新 ACCEPTED_TYPES)

**Trust badges UI:**
```
┌──────────────────────────────────────────────────────────┐
│ ✓ Clean results   ✓ Fast   ✓ You choose   ✓ Print-ready │
│                     ✓ Privacy-first                      │
└──────────────────────────────────────────────────────────┘
```

---

### 3.3 HowItWorksSection (新建)

**路径:** `src/components/blocks/how-it-works/how-it-works.tsx`

**布局:** 3列水平排列 (移动端垂直堆叠)

**文案内容:**
```
H2: How it works

Step 1 — Upload your photo
Pick the photo you want to clean up.

Step 2 — Brush to remove people
Brush only the person or people you want gone—results appear as you brush.
Everything else stays untouched.

Step 3 — Download your finished photo
Your photo is ready. Export and use it anywhere—social media, print, or archive.
Zoom in to double-check edges before you save.

Optional (visually smaller):
Already happy with the result? You're done. Want to do more?
You can also move people closer, swap backgrounds, upscale for print,
or adjust the composition—click "Continue Editing" inside the editor.
```

**UI 参考:**
```
┌─────────────────────────────────────────────────────────┐
│                     How it works                         │
├─────────────────┬─────────────────┬─────────────────────┤
│   ① Upload      │   ② Brush       │   ③ Download        │
│   [Icon/Image]  │   [Icon/Image]  │   [Icon/Image]      │
│   Description   │   Description   │   Description       │
├─────────────────┴─────────────────┴─────────────────────┤
│ (Optional smaller text about Continue Editing)          │
└─────────────────────────────────────────────────────────┘
```

---

### 3.4 ResultsSection (新建)

**路径:** `src/components/blocks/results/results.tsx`

**布局:**
- 6个场景卡片，2列网格 (移动端1列)
- 每个卡片包含: H3标题 + 文案 + Before/After slider

**子组件:**
- `ScenarioCard` - 单个场景卡片
- `OverlapCallout` - 底部亮点 callout

**文案内容:**

```
H2: Real-world results
Subtitle: Common scenarios people search for—solved with a simple brush workflow.
Verification cue: Every example below holds up at 100% zoom. Click to inspect edges, textures, and shadows yourself.

Slider labels: Original / Cleaned

--- Scenario 1: Travel landmarks / crowds ---
H3: Travel landmarks / crowds
Copy: Turn busy travel shots into cleaner memories. Use the brush to remove strangers and tourists from photos while keeping the landmark and your main subject intact.
Straight lines stay straight, brick and stone textures flow naturally, and ground shadows disappear with the people who cast them—even at 100% zoom.

--- Scenario 2: Photobombers ---
H3: Photobombers
Copy: Remove photobombers from photos when someone jumps into the frame at the worst moment. Brush the photobomber only—your subject stays untouched.
Hair and shoulder edges stay crisp, clothing seams remain intact, and contact points on the ground blend seamlessly.

--- Scenario 3: Remove your ex ---
H3: Remove your ex
Copy: Relationship over but the photos aren't? Remove your ex from photos and keep the memories that matter—without the person who doesn't. No need to send private photos to strangers online or pay someone you don't know.
Brush over your ex, download a clean result, and move on. Edges stay clean, backgrounds fill naturally, and no one will know they were ever there.

--- Scenario 4: Keep only certain people ---
H3: Keep only certain people (keep X, remove Y)
Copy: Keep the people you care about and remove unwanted people from pictures—whether that's background strangers, distant relatives, or anyone you'd rather not keep in the frame. This is the fastest way to clean up group photos without redoing the whole shot.
Edges where removed people stood close to the group stay clean, and shared shadows are handled naturally.

--- Scenario 5: Solo portrait from a group shot ---
H3: Solo portrait from a group shot
Copy: Need a clean "just me" photo? Remove others from a group shot to create a solo portrait—for a memorial slideshow, presentation, profile photo, or resume.
Skin texture stays natural, the background fills in seamlessly, and even tricky areas near shoulders and hair come out clean.

--- Scenario 6: Print-worthy moments (weddings & events) ---
H3: Print-worthy moments (weddings & events)
Copy: For wedding photos, formal events, invitations, and framed prints, small mistakes become obvious. Brush removal helps you get a cleaner photo that still looks authentic—ready when you need it, even on the same day.
Fine details like lace, veils, hair, and fabric edges stay sharp. Lighting stays consistent. Patterns don't repeat unnaturally. The result holds up at full resolution—ready for print.

--- Overlap callout ---
Title: What about overlap?
Copy: When people are pressed together—hair crossing, arms touching, shoulders overlapping—most removal tools smear edges or leave obvious artifacts. Ours doesn't.
Brush carefully in tight areas and get clean, natural results where others fail. This is the hardest test for any removal tool. Zoom in and see for yourself.

--- Under-gallery CTA ---
Try it free—upload your photo now.
```

**ScenarioCard Props:**
```typescript
interface ScenarioCardProps {
  title: string;
  copy: string;
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
}
```

---

### 3.5 TechSection (新建)

**路径:** `src/components/blocks/tech/tech.tsx`

**文案内容:**
```
H2: Powered by Google Nano Banana

Lead:
Our removal engine is built on Google Nano Banana—the same AI behind Gemini 2.5 Flash Image.
It understands scene structure, preserves lighting and shadows, and fills removed areas with context-aware detail.
That's why edges stay clean, textures don't repeat unnaturally, and results hold up at 100% zoom.

--- Social proof quotes ---
H3: What people are saying about Nano Banana

> "Had to do a double take."
> — Reddit user, r/GeminiAI

> "And just like that, the age of photographic evidence is over."
> — @AlexanderPayton (2.4M views on X)

[Add more quotes as collected]
```

**UI 参考:**
```
┌─────────────────────────────────────────────────────────┐
│           Powered by Google Nano Banana                 │
│                                                         │
│  [Google/AI Logo]    Lead description text...           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│       What people are saying about Nano Banana          │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  "Quote 1"  │  │  "Quote 2"  │  │  "Quote 3"  │     │
│  │  — Author   │  │  — Author   │  │  — Author   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

### 3.6 BeyondRemovalSection (新建)

**路径:** `src/components/blocks/beyond-removal/beyond-removal.tsx`

**文案内容:**
```
H2: Go beyond removal

Lead:
Your removal is complete—ready to download and use. But sometimes you want to take it further:
recompose the frame, bring people together, or try a different background.
Most tools stop at removal. For anything else, you'd open Photoshop.
We let you keep creating—all inside the same editor, right after removal. This is what sets us apart.

How to access:
After brush removal, click "Continue Editing" inside the editor.

Slider labels: After removal / After AI Edit

--- Capability 1: Extend the frame and re-compose ---
H3: Extend the frame and re-compose
Copy: Want a wider shot or a different crop? Expand the canvas and reposition your subject—no need to settle for what the original frame gave you.
Other tools stop at removal. Ours lets you reshape the entire composition.

--- Capability 2: Move people closer ---
H3: Move people closer
Copy: Want a tighter group shot? Bring everyone together naturally—no cutting and pasting, no obvious seams.
Other tools stop at removal. Ours lets you reposition who's left.

--- Capability 3: Change background ---
H3: Change background
Copy: The removal is done, but the background doesn't match the moment. Swap to a cleaner backdrop—studio, scenic, or simply less distracting.

--- Capability 4: Polish the look ---
H3: Polish the look
Copy: Unify lighting and color so the final result feels intentional—natural tones, cinematic contrast, or a warmer mood for events and portraits.

--- Capability 5: Enhance resolution ---
H3: Enhance resolution
Copy: Working with a video screenshot or an old low-res photo? Upscale it to print-ready quality. Details get sharper, textures stay natural, and the result holds up at larger sizes.

--- Pro feature note ---
AI Edit features require Pro. Start with free trial credits to test removal quality.
```

**CapabilityCard Props:**
```typescript
interface CapabilityCardProps {
  title: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel?: string;  // "After removal"
  afterLabel?: string;   // "After AI Edit"
}
```

---

### 3.7 PrivacySection (新建)

**路径:** `src/components/blocks/privacy/privacy.tsx`

**文案内容:**
```
H2: Privacy first

Body:
Your photos are uploaded, processed, and made available for download—never shared publicly.
You stay in control from upload to download.

Bullets (4个):
- Secure, encrypted processing
- Photos are not used to train AI models
- All uploads are automatically deleted within 24 hours
- No human reviews your photos

Link: Read our Privacy Policy → /privacy-policy
```

**UI 参考:**
```
┌─────────────────────────────────────────────────────────┐
│                    Privacy first                         │
│                                                         │
│  Your photos are uploaded, processed...                  │
│                                                         │
│  🔒 Secure, encrypted processing                        │
│  🚫 Photos are not used to train AI models              │
│  🕐 All uploads automatically deleted within 24 hours   │
│  👤 No human reviews your photos                        │
│                                                         │
│  [Read our Privacy Policy →]                            │
└─────────────────────────────────────────────────────────┘
```

---

### 3.8 PricingSection (改造)

**路径:** `src/components/blocks/pricing/pricing.tsx`

**文案内容:**
```
H2: Pricing

Subtitle:
Try free with limited credits. Upgrade for unlimited removals, 4K exports, and AI Edit.

--- Free Trial card ---
Title: Free Trial — test removal quality

Features:
- Limited free credits to try
- Standard export (good for social media)
- Brush removal with real-time preview
- See results before you pay

Button: Start Free Trial

--- Pro card ---
Title: Pro — for serious results

Features:
- Unlimited removals
- 4K export (full resolution for printing and close-up viewing)
- Priority processing
- Full AI Edit access (extend frame, move people, change background, polish, upscale)
- Commercial-friendly usage

Button: Upgrade to Pro

Footnote: Free trial lets you test quality before committing. See Pricing for full plan details.
```

**改动点:**
1. 更新 PricingTable 或 PricingCard 展示内容
2. 调整翻译文件中的 features 列表
3. 添加 Footnote 说明

---

### 3.9 FaqSection (改造)

**路径:** `src/components/blocks/faqs/faqs.tsx`

**改动点:**
- 从 5 个问题扩展到 19 个问题
- 按分类组织: Quality (7) / Capability (7) / Technical (4) / Privacy (1)
- 可考虑使用分组 Accordion 或 Tab 切换

**19个 FAQ 问题 (按分类):**

```
=== Quality (7个) ===
1. Will removal change the faces I want to keep?
2. How do I avoid an "AI look" after removal?
3. Will it work on complex backgrounds (trees, fences, crowds, patterns)?
4. What if people overlap or block each other (hair/hands/clothing)?
5. Does it handle veils, lace, or semi-transparent materials?
6. Does it remove shadows automatically?
7. What if the person I'm removing is hugging or touching someone I want to keep?

=== Capability (7个) ===
8. How do I remove people from photos online?
9. Can I keep some people and remove others (keep X, remove Y)?
10. Can I remove multiple people at once?
11. Can I make a solo portrait from a group photo?
12. Can I remove crowds or background people from travel photos?
13. Can I move people closer together after removal?
14. Can I remove my ex from photos?

=== Technical (4个) ===
15. Does it work on my phone?
16. Can I use a video screenshot or low-resolution image?
17. Can I remove people from multiple photos at once (batch)?
18. How long does processing take?

=== Privacy (1个) ===
19. Do you store my photos?
```

**UI 建议:**
- 方案A: 单个长 Accordion，问题前加分类标签
- 方案B: 4个 Tab，每个 Tab 一个分类的 Accordion
- 方案C: 4个独立 Accordion 区块，各带分类标题

---

### 3.10 FinalCtaSection (改造)

**路径:** `src/components/blocks/final-cta/final-cta.tsx` (或复用 calltoaction)

**文案内容:**
```
H2: Ready to remove people from photos?

Body:
Upload a photo, brush to remove, and download a clean result.
Start with free credits—no signup required.

CTA Button: Upload Photo (点击滚动到 Hero 上传区域)
```

**改动点:**
1. 更新标题和描述
2. CTA 按钮点击后滚动到页面顶部上传区域
3. 可移除 secondary button

---

## 4. 翻译文件结构

### 4.1 翻译键命名规范

所有首页翻译放在 `HomePage` 命名空间下:

```json
{
  "HomePage": {
    "hero": { ... },
    "howItWorks": { ... },
    "results": { ... },
    "tech": { ... },
    "beyondRemoval": { ... },
    "privacy": { ... },
    "pricing": { ... },
    "faqs": { ... },
    "finalCta": { ... }
  }
}
```

### 4.2 完整翻译结构 (en.json)

```json
{
  "HomePage": {
    "hero": {
      "title": "Remove people from photos online",
      "description": "Brush over anyone you want gone—results appear in seconds. Clean edges, natural backgrounds, no Photoshop needed.",
      "dropzone": {
        "title": "Drag and drop an image here, or click to upload",
        "hint": "Supports JPG, PNG, HEIC, WEBP",
        "dragActive": "Drop the image here"
      },
      "trySample": "Or try a sample image",
      "trustBadges": {
        "quality": "Clean, natural-looking results (even at 100% zoom)",
        "speed": "Results in seconds—no waiting, no queue",
        "control": "Keep X, remove Y: you choose who stays",
        "ready": "Ready to download or print",
        "privacy": "Privacy-first: never shared or used for training"
      }
    },
    "howItWorks": {
      "title": "How it works",
      "steps": {
        "step1": {
          "title": "Upload your photo",
          "description": "Pick the photo you want to clean up."
        },
        "step2": {
          "title": "Brush to remove people",
          "description": "Brush only the person or people you want gone—results appear as you brush. Everything else stays untouched."
        },
        "step3": {
          "title": "Download your finished photo",
          "description": "Your photo is ready. Export and use it anywhere—social media, print, or archive. Zoom in to double-check edges before you save."
        }
      },
      "optional": "Already happy with the result? You're done. Want to do more? You can also move people closer, swap backgrounds, upscale for print, or adjust the composition—click \"Continue Editing\" inside the editor."
    },
    "results": {
      "title": "Real-world results",
      "subtitle": "Common scenarios people search for—solved with a simple brush workflow.",
      "verificationCue": "Every example below holds up at 100% zoom. Click to inspect edges, textures, and shadows yourself.",
      "sliderLabels": {
        "before": "Original",
        "after": "Cleaned"
      },
      "scenarios": {
        "travel": {
          "title": "Travel landmarks / crowds",
          "copy": "Turn busy travel shots into cleaner memories. Use the brush to remove strangers and tourists from photos while keeping the landmark and your main subject intact.",
          "details": "Straight lines stay straight, brick and stone textures flow naturally, and ground shadows disappear with the people who cast them—even at 100% zoom.",
          "beforeAlt": "Crowded landmark photo with tourists and strangers in the background.",
          "afterAlt": "Same landmark photo after removing strangers from the background."
        },
        "photobombers": {
          "title": "Photobombers",
          "copy": "Remove photobombers from photos when someone jumps into the frame at the worst moment. Brush the photobomber only—your subject stays untouched.",
          "details": "Hair and shoulder edges stay crisp, clothing seams remain intact, and contact points on the ground blend seamlessly.",
          "beforeAlt": "Street photo with a photobomber behind the subject.",
          "afterAlt": "Street photo after removing the photobomber cleanly."
        },
        "ex": {
          "title": "Remove your ex",
          "copy": "Relationship over but the photos aren't? Remove your ex from photos and keep the memories that matter—without the person who doesn't. No need to send private photos to strangers online or pay someone you don't know.",
          "details": "Brush over your ex, download a clean result, and move on. Edges stay clean, backgrounds fill naturally, and no one will know they were ever there.",
          "beforeAlt": "Photo with ex-partner that needs to be removed.",
          "afterAlt": "Photo after removing ex-partner, with clean natural background."
        },
        "keepSome": {
          "title": "Keep only certain people (keep X, remove Y)",
          "copy": "Keep the people you care about and remove unwanted people from pictures—whether that's background strangers, distant relatives, or anyone you'd rather not keep in the frame. This is the fastest way to clean up group photos without redoing the whole shot.",
          "details": "Edges where removed people stood close to the group stay clean, and shared shadows are handled naturally.",
          "beforeAlt": "Group photo with several extra people in the frame.",
          "afterAlt": "Group photo with only selected people kept after removal."
        },
        "solo": {
          "title": "Solo portrait from a group shot",
          "copy": "Need a clean \"just me\" photo? Remove others from a group shot to create a solo portrait—for a memorial slideshow, presentation, profile photo, or resume.",
          "details": "Skin texture stays natural, the background fills in seamlessly, and even tricky areas near shoulders and hair come out clean.",
          "beforeAlt": "Group photo intended to be turned into a solo portrait.",
          "afterAlt": "Solo portrait created by removing other people from the group photo."
        },
        "weddings": {
          "title": "Print-worthy moments (weddings & events)",
          "copy": "For wedding photos, formal events, invitations, and framed prints, small mistakes become obvious. Brush removal helps you get a cleaner photo that still looks authentic—ready when you need it, even on the same day.",
          "details": "Fine details like lace, veils, hair, and fabric edges stay sharp. Lighting stays consistent. Patterns don't repeat unnaturally. The result holds up at full resolution—ready for print.",
          "beforeAlt": "Wedding photo with distracting background guests.",
          "afterAlt": "Wedding photo cleaned for print after removing background people."
        }
      },
      "overlap": {
        "title": "What about overlap?",
        "copy": "When people are pressed together—hair crossing, arms touching, shoulders overlapping—most removal tools smear edges or leave obvious artifacts. Ours doesn't.",
        "details": "Brush carefully in tight areas and get clean, natural results where others fail. This is the hardest test for any removal tool. Zoom in and see for yourself."
      },
      "cta": "Try it free—upload your photo now."
    },
    "tech": {
      "title": "Powered by Google Nano Banana",
      "lead": "Our removal engine is built on Google Nano Banana—the same AI behind Gemini 2.5 Flash Image. It understands scene structure, preserves lighting and shadows, and fills removed areas with context-aware detail.",
      "detail": "That's why edges stay clean, textures don't repeat unnaturally, and results hold up at 100% zoom.",
      "socialProof": {
        "title": "What people are saying about Nano Banana",
        "quotes": {
          "quote1": {
            "text": "Had to do a double take.",
            "author": "Reddit user, r/GeminiAI"
          },
          "quote2": {
            "text": "And just like that, the age of photographic evidence is over.",
            "author": "@AlexanderPayton (2.4M views on X)"
          }
        }
      }
    },
    "beyondRemoval": {
      "title": "Go beyond removal",
      "lead": "Your removal is complete—ready to download and use. But sometimes you want to take it further: recompose the frame, bring people together, or try a different background.",
      "contrast": "Most tools stop at removal. For anything else, you'd open Photoshop. We let you keep creating—all inside the same editor, right after removal. This is what sets us apart.",
      "howToAccess": "After brush removal, click \"Continue Editing\" inside the editor.",
      "sliderLabels": {
        "before": "After removal",
        "after": "After AI Edit"
      },
      "capabilities": {
        "extend": {
          "title": "Extend the frame and re-compose",
          "description": "Want a wider shot or a different crop? Expand the canvas and reposition your subject—no need to settle for what the original frame gave you.",
          "contrast": "Other tools stop at removal. Ours lets you reshape the entire composition.",
          "beforeAlt": "Photo after removal, with subject off-center.",
          "afterAlt": "Same photo with extended frame and subject re-centered."
        },
        "move": {
          "title": "Move people closer",
          "description": "Want a tighter group shot? Bring everyone together naturally—no cutting and pasting, no obvious seams.",
          "contrast": "Other tools stop at removal. Ours lets you reposition who's left.",
          "beforeAlt": "Group photo after removal, with space between remaining people.",
          "afterAlt": "Same group photo with people moved closer together."
        },
        "background": {
          "title": "Change background",
          "description": "The removal is done, but the background doesn't match the moment. Swap to a cleaner backdrop—studio, scenic, or simply less distracting.",
          "beforeAlt": "Cleaned photo with original busy background.",
          "afterAlt": "Cleaned photo with a new, simpler background."
        },
        "polish": {
          "title": "Polish the look",
          "description": "Unify lighting and color so the final result feels intentional—natural tones, cinematic contrast, or a warmer mood for events and portraits.",
          "beforeAlt": "Cleaned photo with original lighting and color.",
          "afterAlt": "Cleaned photo with polished lighting and color."
        },
        "enhance": {
          "title": "Enhance resolution",
          "description": "Working with a video screenshot or an old low-res photo? Upscale it to print-ready quality. Details get sharper, textures stay natural, and the result holds up at larger sizes.",
          "beforeAlt": "Low-resolution photo with visible pixelation.",
          "afterAlt": "Same photo upscaled with enhanced clarity and detail."
        }
      },
      "proNote": "AI Edit features require Pro. Start with free trial credits to test removal quality."
    },
    "privacy": {
      "title": "Privacy first",
      "body": "Your photos are uploaded, processed, and made available for download—never shared publicly. You stay in control from upload to download.",
      "bullets": {
        "encrypted": "Secure, encrypted processing",
        "noTraining": "Photos are not used to train AI models",
        "deleted": "All uploads are automatically deleted within 24 hours",
        "noHuman": "No human reviews your photos"
      },
      "link": "Read our Privacy Policy"
    },
    "pricing": {
      "subtitle": "Pricing",
      "description": "Try free with limited credits. Upgrade for unlimited removals, 4K exports, and AI Edit.",
      "freeTrial": {
        "title": "Free Trial",
        "tagline": "test removal quality",
        "features": {
          "feature1": "Limited free credits to try",
          "feature2": "Standard export (good for social media)",
          "feature3": "Brush removal with real-time preview",
          "feature4": "See results before you pay"
        },
        "cta": "Start Free Trial"
      },
      "pro": {
        "title": "Pro",
        "tagline": "for serious results",
        "features": {
          "feature1": "Unlimited removals",
          "feature2": "4K export (full resolution for printing and close-up viewing)",
          "feature3": "Priority processing",
          "feature4": "Full AI Edit access (extend frame, move people, change background, polish, upscale)",
          "feature5": "Commercial-friendly usage"
        },
        "cta": "Upgrade to Pro"
      },
      "footnote": "Free trial lets you test quality before committing. See Pricing for full plan details."
    },
    "faqs": {
      "title": "FAQ",
      "categories": {
        "quality": "Quality",
        "capability": "Capability",
        "technical": "Technical",
        "privacy": "Privacy"
      },
      "items": {
        "q1": {
          "question": "Will removal change the faces I want to keep?",
          "answer": "No. Brush removal only affects the areas you brush. Faces and features you don't touch stay exactly as they are."
        },
        "q2": {
          "question": "How do I avoid an \"AI look\" after removal?",
          "answer": "Zoom to 100% and check edges, repeating patterns, and shadows. If it looks believable up close, it'll look great everywhere."
        },
        "q3": {
          "question": "Will it work on complex backgrounds (trees, fences, crowds, patterns)?",
          "answer": "Often yes—complex textures just require more careful brushing and a closer 100% check."
        },
        "q4": {
          "question": "What if people overlap or block each other (hair/hands/clothing)?",
          "answer": "We handle overlap well. Zoom in, work in small sections, and you'll get clean edges even where people are touching or crossing."
        },
        "q5": {
          "question": "Does it handle veils, lace, or semi-transparent materials?",
          "answer": "It can, but thin/semi-transparent edges need careful brushing. Zoom in and work slowly around the edge details."
        },
        "q6": {
          "question": "Does it remove shadows automatically?",
          "answer": "Brush over both the person and their shadow. The tool fills both areas naturally—shadows don't get left behind."
        },
        "q7": {
          "question": "What if the person I'm removing is hugging or touching someone I want to keep?",
          "answer": "Brush carefully around the contact area. We handle these tricky spots well—zoom in and work in small sections for the cleanest result."
        },
        "q8": {
          "question": "How do I remove people from photos online?",
          "answer": "Upload your photo, brush over the people you want to remove, then download the result. Results update in real time as you brush."
        },
        "q9": {
          "question": "Can I keep some people and remove others (keep X, remove Y)?",
          "answer": "Yes. Brush only who you want gone—everyone else stays untouched."
        },
        "q10": {
          "question": "Can I remove multiple people at once?",
          "answer": "Yes. Remove people in sections for better control, especially in crowds or busy backgrounds."
        },
        "q11": {
          "question": "Can I make a solo portrait from a group photo?",
          "answer": "Yes. Remove others from the group shot, then export or re-frame for a clean solo portrait."
        },
        "q12": {
          "question": "Can I remove crowds or background people from travel photos?",
          "answer": "Yes. For large crowds, removing in smaller sections helps keep textures and lines looking natural."
        },
        "q13": {
          "question": "Can I move people closer together after removal?",
          "answer": "Yes. After brush removal, click \"Continue Editing\" to bring people together naturally—no cutting and pasting required."
        },
        "q14": {
          "question": "Can I remove my ex from photos?",
          "answer": "Yes. Brush over them, download a clean result, and keep the photo without the person."
        },
        "q15": {
          "question": "Does it work on my phone?",
          "answer": "Yes—use it in a modern mobile browser (Safari or Chrome). No app download needed."
        },
        "q16": {
          "question": "Can I use a video screenshot or low-resolution image?",
          "answer": "Yes. For better results, use \"Continue Editing\" to upscale after removal—details get sharper and the photo becomes print-ready."
        },
        "q17": {
          "question": "Can I remove people from multiple photos at once (batch)?",
          "answer": "Not yet. Each photo is processed individually for now."
        },
        "q18": {
          "question": "How long does processing take?",
          "answer": "Results appear in real time as you brush—usually within seconds. Export is ready as soon as you're happy with the result."
        },
        "q19": {
          "question": "Do you store my photos?",
          "answer": "Photos are stored temporarily for processing and automatically deleted within 24 hours. We do not share your photos publicly or use them to train AI models."
        }
      }
    },
    "finalCta": {
      "title": "Ready to remove people from photos?",
      "body": "Upload a photo, brush to remove, and download a clean result. Start with free credits—no signup required.",
      "cta": "Upload Photo"
    }
  }
}
```

---

## 5. 图片素材需求

### 5.1 占位图规格

在开发阶段使用占位图，后续替换为真实素材。

**推荐占位图服务:**
- `https://placehold.co/800x600/f3f4f6/9ca3af?text=Before`
- `https://placehold.co/800x600/f3f4f6/9ca3af?text=After`

### 5.2 图片尺寸要求

| 用途 | 尺寸 | 格式 | 数量 |
|------|------|------|------|
| Hero 示例图 | 800×600 | JPG/WebP | 4张 (Before) + 4张 (After) |
| Results 场景图 | 800×600 | JPG/WebP | 6组 (各1张 Before + 1张 After) |
| Beyond Removal 功能图 | 800×600 | JPG/WebP | 5组 (各1张 Before + 1张 After) |
| How It Works 步骤图 | 400×300 | PNG/SVG | 3张 (可用图标替代) |

**总计:** 约 30+ 张图片素材

### 5.3 图片存放路径

```
public/
├── examples/           # Hero 示例图
│   ├── example-1.jpg
│   ├── example-1-after.jpg
│   ├── example-2.jpg
│   └── ...
├── results/            # Results 场景图
│   ├── travel-before.jpg
│   ├── travel-after.jpg
│   ├── photobomber-before.jpg
│   └── ...
├── beyond/             # Beyond Removal 功能图
│   ├── extend-before.jpg
│   ├── extend-after.jpg
│   └── ...
└── icons/              # How It Works 图标 (可选)
    ├── upload.svg
    ├── brush.svg
    └── download.svg
```

---

## 6. 开发顺序建议

### Phase 1: 基础组件 (P0)

1. **BeforeAfterSlider** - 从零实现图片对比滑动组件
2. **HeroSection 改造** - 添加 Trust badges，更新文案
3. **HowItWorksSection** - 新建3步骤组件

### Phase 2: 核心内容 (P0)

4. **ResultsSection** - 6个场景卡片 + Overlap callout
5. **ScenarioCard** - 带 Before/After slider 的场景卡片

### Phase 3: 差异化功能 (P1)

6. **TechSection** - Powered by Nano Banana + 社交证明
7. **BeyondRemovalSection** - 5个 AI Edit 功能展示
8. **CapabilityCard** - 功能卡片组件
9. **PrivacySection** - 隐私保障模块

### Phase 4: 收尾 (P2)

10. **PricingSection 改造** - 更新定价文案和功能列表
11. **FaqSection 改造** - 扩展到 19 个问题，分类组织
12. **FinalCtaSection** - 底部 CTA，滚动到上传区

### Phase 5: 翻译与优化

13. 完善 `messages/en.json` 翻译文件
14. 创建 `messages/zh.json` 中文翻译 (可选)
15. 导航栏链接更新 (Results / Pricing / FAQ / Privacy)
16. 响应式测试与优化

---

## 7. 技术备注

### 7.1 滚动锚点

导航栏链接需要滚动到对应 section:

```typescript
// Navbar 链接配置
const navLinks = [
  { href: '#results', label: 'Results' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faqs', label: 'FAQ' },
  { href: '#privacy', label: 'Privacy' },
];

// 平滑滚动
<a href="#results" className="scroll-smooth">Results</a>

// 或使用 scrollIntoView
document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
```

### 7.2 图片懒加载

使用 Next.js Image 组件实现懒加载:

```tsx
import Image from 'next/image';

<Image
  src="/results/travel-before.jpg"
  alt="Crowded landmark"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 7.3 BeforeAfterSlider 实现思路

```tsx
// 核心逻辑
const [position, setPosition] = useState(50);

const handleMove = (clientX: number, rect: DOMRect) => {
  const x = clientX - rect.left;
  const percent = (x / rect.width) * 100;
  setPosition(Math.max(0, Math.min(100, percent)));
};

// CSS clip-path
<div style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
  <Image src={beforeImage} ... />
</div>
<div style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
  <Image src={afterImage} ... />
</div>
```

### 7.4 编辑器 Dialog 使用

编辑器已通过 Dialog 实现，上传图片后自动打开:

```tsx
// 使用 useEditorStore 打开编辑器
import { useEditorStore } from '@/components/image-editor/hooks/use-editor-state';

const openEditor = useEditorStore((state) => state.openEditor);

// 打开编辑器
openEditor(base64Image);
```

### 7.5 HEIC 格式支持

需要添加 HEIC 格式到 ACCEPTED_TYPES:

```typescript
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic', '.heif'],  // 新增
};
```

注意: HEIC 需要服务端转换或使用 heic2any 库在客户端转换。

---

## 附录: 页面完整组件树

```
HomePage
├── Navbar (已有)
│   ├── Logo
│   ├── NavLinks [Results, Pricing, FAQ, Privacy]
│   └── UserButton / "Try It Free" CTA
│
├── HeroSection (改造)
│   ├── H1 Title
│   ├── Description
│   ├── ImageUploader
│   │   ├── Dropzone
│   │   ├── Example Images (4个)
│   │   └── ImageEditorDialog
│   ├── TrySampleLink
│   └── TrustBadges (5个)
│
├── HowItWorksSection (新建)
│   ├── HeaderSection (H2)
│   ├── StepCard × 3
│   └── OptionalNote
│
├── ResultsSection (新建)
│   ├── HeaderSection (H2 + subtitle + verification)
│   ├── ScenarioCard × 6
│   │   ├── H3 Title
│   │   ├── Copy + Details
│   │   └── BeforeAfterSlider
│   ├── OverlapCallout
│   └── UnderGalleryCTA
│
├── TechSection (新建)
│   ├── HeaderSection (H2)
│   ├── LeadCopy
│   └── SocialProofQuotes
│
├── BeyondRemovalSection (新建)
│   ├── HeaderSection (H2)
│   ├── LeadCopy + HowToAccess
│   ├── CapabilityCard × 5
│   │   ├── H3 Title
│   │   ├── Description
│   │   └── BeforeAfterSlider
│   └── ProFeatureNote
│
├── PrivacySection (新建)
│   ├── HeaderSection (H2)
│   ├── BodyCopy
│   ├── BulletPoints (4个)
│   └── PrivacyPolicyLink
│
├── PricingSection (改造)
│   ├── HeaderSection (H2 + subtitle)
│   ├── FreeTrialCard
│   ├── ProCard
│   └── Footnote
│
├── FaqSection (改造)
│   ├── HeaderSection (H2)
│   └── AccordionGroups (19个问题，4个分类)
│
├── FinalCtaSection (改造)
│   ├── H2 Title
│   ├── BodyCopy
│   └── UploadPhotoCTA
│
└── Footer (已有)
```

---

**文档版本:** v1.0
**创建日期:** 2026-01-26
**基于文案:** seo/seo-copy-final.md
