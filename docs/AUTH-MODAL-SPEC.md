# Auth Modal 技术规格文档

---

## 修订记录

| 日期 | 修订内容 |
|------|----------|
| v1.2 | 根据 Review 反馈更新：1) 移除 `errorCallbackURL`，使用默认 `Routes.AuthError`；2) 修正 `disableRedirect` 返回值为 `result.data.url`；3) RegisterForm 添加 `onSuccess` 回调，注册成功后关闭 Modal；4) 补充 `credentialLoginEnabled` 来源说明；5) 补充 Navbar 修改示例；6) 新增 race condition 处理说明；7) 复用现有翻译 key；8) 简化 oauth-callback 页面 |
| v1.1 | 根据 Review 反馈更新：1) 添加 `errorCallbackURL` 处理 OAuth 失败；2) Modal 内邮箱登录不传 callbackUrl，使用 `onSuccess` + `refetch()` 实现无刷新；3) 使用 `getLocalePathname` 兼容 `localePrefix: 'as-needed'`；4) 采用"先开窗后设 URL"策略避免 Popup 被拦截；5) 统一使用 `window.location.href` 保留完整 URL；6) 按钮添加 `type="button"` |

---

## 概述

本文档描述了统一登录注册弹窗功能的技术规格。该功能允许用户在 Modal 弹窗内完成登录和注册，无需页面跳转，同时支持通过 Popup 弹窗方式进行 Google/GitHub OAuth 授权。

---

## 功能需求

### 核心功能

| 功能 | 描述 |
|------|------|
| Auth Modal | 统一的登录注册弹窗，可在弹窗内切换视图，无需页面跳转 |
| 视图切换 | 用户可在登录和注册视图之间切换，不触发路由变化 |
| OAuth Popup | Google/GitHub 登录打开独立弹窗窗口，而非整页跳转（仅限 Modal 内桌面端），采用"先开窗后设 URL"策略避免被浏览器拦截 |
| Popup 降级 | 当 Popup 被浏览器拦截时，自动降级为 redirect 模式 |
| 向后兼容 | 现有独立认证页面和移动端导航栏行为保持不变（仍使用 redirect 模式） |

### 使用场景与 Social Login 方式

| 使用场景 | Social Login 方式 | 说明 |
|----------|------------------|------|
| AuthModal（桌面端） | Popup 模式 | 本次新增功能 |
| 独立页面 `/auth/login` | Redirect 模式 | 保持现有行为不变 |
| 独立页面 `/auth/register` | Redirect 模式 | 保持现有行为不变 |
| 移动端 Navbar | Redirect 模式 | 保持现有行为不变 |

### 用户流程

```
用户点击导航栏"登录"按钮（桌面端）
        |
        v
AuthModal 打开（显示登录视图）
        |
        +-- 用户点击"没有账号？注册"
        |           |
        |           v
        |   切换到注册视图（无页面跳转）
        |
        +-- 用户点击"Google 登录"
                    |
                    v
            打开 OAuth Popup 弹窗
                    |
                    +-- Popup 打开成功
                    |       |
                    |       v
                    |   用户在 Popup 中完成授权
                    |       |
                    |       v
                    |   Popup 关闭，Modal 关闭，会话刷新
                    |
                    +-- Popup 被拦截
                            |
                            v
                    降级为 redirect 模式（整页跳转，回调到当前页）
```

---

## 设计原则

| 原则 | 描述 |
|------|------|
| 组合优先 | 通过组合现有组件创建新功能，避免修改内部逻辑 |
| 向后兼容 | 仅添加可选 props，默认行为保持不变 |
| 扩展点注入 | 在必要处添加"插槽"，允许注入自定义组件 |
| 最小改动 | 现有代码路径不受影响 |

---

## 设计决策

| 项目 | 决策 | 理由 |
|------|------|------|
| 视图切换 | AuthCard 添加 `onBottomButtonClick` 可选回调 | 显式回调比隐式事件委托更稳健 |
| Social Login 注入 | 为表单添加 `renderSocialLogin` prop | 允许注入自定义组件，不修改现有逻辑 |
| 状态管理 | 使用 Zustand store 管理 Modal 状态 | 与项目架构一致 |
| callbackUrl | Store 不设默认值，由调用方决定 | 职责分离，不同场景需要不同行为 |
| OAuth URL 获取 | 使用 `signIn.social({ disableRedirect: true })` | 避免硬编码路径，确保与 better-auth 兼容 |
| Popup 降级 | 降级时 callbackUrl 使用当前页 URL | 保持"登录后留在当前页"的一致体验 |
| 移动端检测 | 复用现有 `useIsMobile` hook | 避免重复实现，保持一致性 |
| 移动端导航栏 | 保持现有 redirect 行为 | Modal 在移动端体验欠佳 |
| 独立页面 | 保持现有 redirect 行为 | 向后兼容，不影响现有功能 |

---

## 架构设计

### 整体架构图

```
+-------------------------------------------------------------+
|                     Navbar（桌面端）                          |
|  +----------+  +----------+                                  |
|  |   登录    |  |   注册   |  --> authModalStore.open()       |
|  +----------+  +----------+                                  |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                        AuthModal                             |
|  +-------------------------------------------------------+  |
|  |  +--------------------------------------------------+ |  |
|  |  |  LoginForm / RegisterForm                        | |  |
|  |  |  - onSwitchView 回调处理视图切换                  | |  |
|  |  |  - renderSocialLogin --> SocialLoginPopupButton  | |  |
|  |  +--------------------------------------------------+ |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
                              |
                              v（点击 Google 登录）
+-------------------------------------------------------------+
|               SocialLoginPopupButton                         |
|  +----------------------+                                    |
|  |  use-oauth-popup     |                                    |
|  |  - useIsMobile()     | --> 移动端直接 fallback            |
|  |  - signIn.social()   | --> 获取 OAuth URL                 |
|  |  - window.open()     | --> Popup 弹窗                     |
|  |  - postMessage       | <-- oauth-callback 页面            |
|  +----------------------+                                    |
+-------------------------------------------------------------+
```

### 层级结构图

```
+--------------------------------------------------+
|                  App Root Layout                  |
|  +--------------------------------------------+  |
|  |           AuthModalProvider                |  |
|  |  +--------------------------------------+  |  |
|  |  |            AuthModal                 |  |  |
|  |  |  （全局单例，通过 portal 挂载到 body）  |  |  |
|  |  +--------------------------------------+  |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
          |
          | 使用
          v
+--------------------------------------------------+
|              auth-modal-store (Zustand)           |
|  - isOpen: boolean                                |
|  - view: 'login' | 'register'                     |
|  - callbackUrl?: string                           |
|  - openLogin() / openRegister() / close()         |
+--------------------------------------------------+
```

---

## 组件设计

### 新建组件

| 文件 | 描述 |
|------|------|
| `src/stores/auth-modal-store.ts` | Zustand store，管理 Modal 状态 |
| `src/components/auth/auth-modal.tsx` | 统一认证弹窗组件 |
| `src/components/providers/auth-modal-provider.tsx` | Provider，在应用根组件挂载 Modal |
| `src/app/[locale]/auth/oauth-callback/page.tsx` | OAuth Popup 回调页面 |
| `src/components/auth/social-login-popup-button.tsx` | Popup 模式的 Social Login 按钮 |
| `src/hooks/use-oauth-popup.ts` | 封装 Popup 逻辑的 Hook |

### 修改组件（仅添加可选 Props）

| 文件 | 改动 |
|------|------|
| `src/components/auth/auth-card.tsx` | 添加 `onBottomButtonClick?: () => void` 可选 prop |
| `src/components/auth/login-form.tsx` | 添加 `renderSocialLogin`、`onSwitchToRegister`、`onSuccess` 可选 props |
| `src/components/auth/register-form.tsx` | 添加 `renderSocialLogin`、`onSwitchToLogin`、`onSuccess` 可选 props |
| `src/components/layout/navbar.tsx` | 登录/注册按钮改为调用 store 方法 |
| `src/app/[locale]/layout.tsx` | 添加 `<AuthModalProvider />` |

**Navbar 修改示例：**

```tsx
// src/components/layout/navbar.tsx

// 导入 store
import { useAuthModalStore } from '@/stores/auth-modal-store'

// 在组件内
const { openLogin, openRegister } = useAuthModalStore()

// 登录/注册按钮（替换原有 LoginWrapper）
{!currentUser && (
  <div className="flex items-center gap-x-3">
    <Button
      variant="outline"
      size="sm"
      onClick={() => openLogin()}
    >
      {t('Common.login')}
    </Button>
    <Button
      size="sm"
      onClick={() => openRegister()}
    >
      {t('Common.tryForFree')}
    </Button>
  </div>
)}
```

### 不变组件

| 文件 | 原因 |
|------|------|
| `src/components/auth/social-login-button.tsx` | 原组件保留供独立页面使用（redirect 模式） |
| `src/components/layout/navbar-mobile.tsx` | 移动端保持 redirect 行为 |
| `src/app/[locale]/auth/login/page.tsx` | 独立页面保留，使用原有 redirect 模式 |
| `src/app/[locale]/auth/register/page.tsx` | 独立页面保留，使用原有 redirect 模式 |

---

## 详细组件规格

### 1. auth-modal-store.ts

```typescript
interface AuthModalState {
  // 状态
  isOpen: boolean
  view: 'login' | 'register'
  callbackUrl?: string

  // 方法
  openLogin: (callbackUrl?: string) => void
  openRegister: (callbackUrl?: string) => void
  setView: (view: 'login' | 'register') => void
  close: () => void
}
```

**实现要点：**
- 使用 Zustand，如需要可添加 persist 中间件
- `callbackUrl` 不设默认值，直接存储调用方传入的值
- 如果调用方不传 `callbackUrl`，表单内部会使用自己的默认值（`DEFAULT_LOGIN_REDIRECT`）

**callbackUrl 设计说明：**

Modal 内登录与独立页面登录的 callbackUrl 处理策略不同：

| 场景 | callbackUrl 处理 | 说明 |
|------|-----------------|------|
| Modal 内邮箱登录 | **不传 callbackUrl** | 登录成功后手动刷新 session，无页面跳转 |
| Modal 内 OAuth 登录 | Popup 模式无需 callbackUrl | Popup 关闭后刷新 session，无页面跳转 |
| Modal OAuth 降级 | 使用 `window.location.href` | 降级为 redirect 模式，回到当前页 |
| 独立页面登录 | 使用默认 `DEFAULT_LOGIN_REDIRECT` | 保持现有行为 |

```
┌─────────────────────────────────────────────────────────────────┐
│                      Modal 内登录流程                            │
│                                                                 │
│  邮箱密码登录：                                                  │
│  1. signIn.email({ email, password })  // 不传 callbackUrl      │
│  2. 成功后 → session.refetch() 刷新会话                          │
│  3. 关闭 Modal（无页面跳转/刷新）                                 │
│                                                                 │
│  OAuth Popup 登录：                                              │
│  1. Popup 中完成授权                                             │
│  2. postMessage 通知父窗口                                       │
│  3. session.refetch() 刷新会话                                   │
│  4. 关闭 Modal（无页面跳转/刷新）                                 │
│                                                                 │
│  OAuth 降级（redirect）：                                        │
│  → callbackUrl = window.location.href（回到当前完整 URL）         │
└─────────────────────────────────────────────────────────────────┘
```

### 2. auth-modal.tsx

**结构：**
```tsx
<Dialog open={isOpen} onOpenChange={handleOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle />
    </DialogHeader>
    {view === 'login' ? (
      <LoginForm
        // 不传 callbackUrl，避免登录成功后触发 redirect
        renderSocialLogin={renderPopupSocialLogin}
        onSwitchToRegister={() => setView('register')}
        onSuccess={handleLoginSuccess}  // 新增：登录成功回调
      />
    ) : (
      <RegisterForm
        // 不传 callbackUrl，避免注册成功后触发 redirect
        renderSocialLogin={renderPopupSocialLogin}
        onSwitchToLogin={() => setView('login')}
      />
    )}
  </DialogContent>
</Dialog>
```

**关键点：**
- **不传 callbackUrl**：Modal 内的表单不传 callbackUrl，避免触发 redirect
- 邮箱登录成功后通过 `onSuccess` 回调通知 Modal，Modal 调用 `refetch()` 刷新会话后关闭
- 通过 `onSwitchToRegister` / `onSwitchToLogin` 回调实现视图切换
- 回调方式比事件委托更稳健，不依赖 URL 字符串匹配

**Modal 关闭时机：**

| 场景 | 行为 |
|------|------|
| 邮箱密码登录成功 | `onSuccess` → `refetch()` → 关闭 Modal（无页面刷新） |
| OAuth 登录/注册成功 | postMessage → `refetch()` → 关闭 Modal（无页面刷新） |
| 邮箱密码注册成功 | `onSuccess` → `refetch()` → 关闭 Modal（无页面刷新） |
| 用户点击外部/ESC | 关闭 Modal |

### 3. auth-card.tsx 修改

**新增可选 prop：**
```typescript
interface AuthCardProps {
  // ... existing props
  onBottomButtonClick?: () => void  // 新增
}
```

**渲染逻辑：**
```typescript
{onBottomButtonClick ? (
  <button
    type="button"  // 防止被表单捕获触发提交
    onClick={onBottomButtonClick}
    className="..."
  >
    {bottomButtonLabel}
  </button>
) : (
  <BottomLink label={bottomButtonLabel} href={bottomButtonHref} />
)}
```

**向后兼容性：**
- 不传 `onBottomButtonClick` 时，行为与之前完全一致（使用 Link 跳转）
- Modal 内使用时传入回调，实现视图切换

### 4. oauth-callback/page.tsx

**作用：**
- 作为 OAuth Popup 的成功回调目标页面
- 通过 `postMessage` 通知父窗口认证结果
- 自动关闭 Popup 窗口

**URL 说明：**

| URL 类型 | 路径 | 说明 |
|----------|------|------|
| OAuth Provider Callback | `/api/auth/callback/google` | 配置在 Google Console，固定路径，无 locale |
| Popup 成功回调 | `/[locale]/auth/oauth-callback` | 传给 better-auth 的 callbackURL |
| OAuth 错误 | 使用默认 `Routes.AuthError` | better-auth 默认配置处理 |

**OAuth 流程：**
```
1. Popup 打开 OAuth URL，带 callbackURL
2. 用户在 Google 授权
3. Google 重定向到 /api/auth/callback/google（固定，无 locale）
4. Better Auth 处理：
   - 成功 → 重定向到 /[locale]/auth/oauth-callback
   - 失败 → 重定向到默认错误页面 Routes.AuthError
5. oauth-callback 页面发送 postMessage 并关闭
```

**实现：**
```typescript
'use client'

import { useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { useTranslations } from 'next-intl'

export default function OAuthCallbackPage() {
  const t = useTranslations('AuthModal')

  useEffect(() => {
    const notifyParentAndClose = async () => {
      // OAuth succeeded - verify session
      try {
        const session = await authClient.getSession()

        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'oauth-callback',
              success: !!session.data,
              error: session.data ? null : 'No session found'
            },
            window.location.origin
          )
        }
      } catch (error) {
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'oauth-callback',
              success: false,
              error: 'Authentication failed'
            },
            window.location.origin
          )
        }
      } finally {
        window.close()
      }
    }

    notifyParentAndClose()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>{t('completingAuth')}</p>
    </div>
  )
}
```

### 5. use-oauth-popup.ts

**接口：**
```typescript
interface UseOAuthPopupOptions {
  onSuccess?: () => void
  onError?: (error: string) => void
  onFallback?: () => void
}

interface UseOAuthPopupReturn {
  openPopup: (provider: 'google' | 'github', callbackUrl?: string) => void
  isLoading: boolean
  error: string | null
}
```

**实现流程（先开窗后设 URL 策略）：**

> ⚠️ **重要**：浏览器会阻止非用户手势触发的 popup。如果先异步获取 OAuth URL 再 `window.open()`，大概率被拦截。
> 因此采用"先开窗后设 URL"策略：同步打开空白窗口，异步获取 URL 后设置 `location.href`。

```
openPopup(provider)
        |
        v
useIsMobile() 检查是否移动端
        |
        +-- 是移动端 --> 直接 fallback 到 redirect 模式
        |                 （callbackUrl = window.location.href）
        |
        +-- 是桌面端
                |
                v
        【同步】window.open('about:blank') 打开空白 Popup
                |
                +-- 返回 null（被拦截）
                |       |
                |       v
                |   fallback 到 redirect 模式
                |   （callbackUrl = window.location.href）
                |
                +-- Popup 打开成功
                        |
                        v
                【异步】调用 signIn.social({ disableRedirect: true }) 获取 OAuth URL
                        |
                        v
                设置 popup.location.href = oauthUrl
                        |
                        v
                监听 postMessage + 轮询 popup.closed
                        |
                        +-- 用户关闭 Popup
                        |       → 显示"认证已取消"
                        |
                        +-- 收到 postMessage
                                |
                                +-- success: true → session.refetch() → 关闭 Modal
                                +-- success: false → 显示错误
```

**获取 OAuth URL（关键）：**
```typescript
import { useRef, useCallback } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { authClient } from '@/lib/auth-client'
import { getLocalePathname } from '@/i18n/navigation'
import { useLocale } from 'next-intl'

export function useOAuthPopup(options: UseOAuthPopupOptions) {
  const isMobile = useIsMobile()
  const locale = useLocale()
  const popupRef = useRef<Window | null>(null)

  const openPopup = useCallback(async (provider: 'google' | 'github') => {
    // 使用 getLocalePathname 生成正确的 locale 路径（兼容 localePrefix: 'as-needed'）
    const popupCallbackUrl = `${window.location.origin}${getLocalePathname({ href: '/auth/oauth-callback', locale })}`
    // 降级时使用完整 URL（包含 query/hash）
    const fallbackCallbackUrl = window.location.href

    // Mobile: always fallback to redirect
    if (isMobile) {
      options.onFallback?.()
      await authClient.signIn.social({
        provider,
        callbackURL: fallbackCallbackUrl
      })
      return
    }

    // Desktop: 先同步打开空白窗口（确保在用户手势有效期内）
    const popup = openCenteredPopup('about:blank')

    if (!popup || popup.closed) {
      // Popup blocked, fallback to redirect
      options.onFallback?.()
      await authClient.signIn.social({
        provider,
        callbackURL: fallbackCallbackUrl
      })
      return
    }

    popupRef.current = popup

    // 显示 loading 状态
    popup.document.write(`
      <html>
        <head><title>OAuth</title></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui">
          <p>Loading...</p>
        </body>
      </html>
    `)

    // 异步获取 OAuth URL
    const result = await authClient.signIn.social({
      provider,
      callbackURL: popupCallbackUrl,
      // errorCallbackURL 使用默认配置（Routes.AuthError）
      disableRedirect: true  // 关键：不自动跳转，返回 URL
    })

    if (!result?.data?.url) {
      popup.close()
      options.onError?.('Failed to get OAuth URL')
      return
    }

    // 跳转到 OAuth URL
    popup.location.href = result.data.url

    // Set up message listener and popup.closed polling...
  }, [isMobile, locale, options])

  return { openPopup, isLoading, error }
}
```

**Popup 窗口规格：**
```typescript
const POPUP_WIDTH = 500
const POPUP_HEIGHT = 600

function openCenteredPopup(url: string): Window | null {
  const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2
  const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2

  return window.open(
    url,
    'oauth-popup',
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},` +
    `menubar=no,toolbar=no,location=no,status=no`
  )
}
```

**postMessage 监听（增强安全校验）：**
```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    // 校验 origin
    if (event.origin !== window.location.origin) return

    // 校验 source（确保来自我们打开的 popup）
    if (event.source !== popupRef.current) return

    // 校验消息类型
    if (event.data?.type !== 'oauth-callback') return

    // 处理结果
    if (event.data.success) {
      refreshSession()  // 刷新会话
      options.onSuccess?.()
    } else {
      options.onError?.(event.data.error || 'Authentication failed')
    }

    // 清理
    cleanup()
  }

  window.addEventListener('message', handleMessage)
  return () => window.removeEventListener('message', handleMessage)
}, [])
```

**会话刷新：**
```typescript
// 使用 better-auth 的 useSession hook 的 refetch 方法
const { data: session, refetch } = authClient.useSession()

async function refreshSession() {
  // 调用 refetch 刷新会话状态，触发 React 组件重新渲染
  await refetch()
}
```

**防止 race condition（用户关闭 Popup 误判）：**

> 问题：如果用户完成授权后，Popup 正在 redirect 但尚未发送 postMessage，此时轮询可能误判为"用户关闭"。

```typescript
// 添加标志位避免误判
let messageReceived = false

// postMessage handler 中
const handleMessage = (event: MessageEvent) => {
  // ... 校验逻辑
  messageReceived = true
  // ... 处理结果
}

// 轮询检测用户关闭
const pollInterval = setInterval(() => {
  if (popupRef.current?.closed) {
    clearInterval(pollInterval)
    if (!messageReceived) {
      // 确实是用户主动关闭，而非授权完成后自动关闭
      options.onError?.('Authentication was cancelled')
    }
  }
}, 500)
```

**在 use-oauth-popup 中的使用：**
```typescript
export function useOAuthPopup(options: UseOAuthPopupOptions) {
  const { refetch: refreshSession } = authClient.useSession()

  // ... 在 postMessage 处理中
  if (event.data.success) {
    await refreshSession()  // 刷新会话
    options.onSuccess?.()   // 触发 Modal 关闭
  }
}
```

### 6. social-login-popup-button.tsx

**Props：**
```typescript
interface SocialLoginPopupButtonProps {
  callbackUrl?: string
  showDivider?: boolean
  onSuccess?: () => void
  onFallback?: () => void
}
```

**与 SocialLoginButton 的区别：**
- 使用 `use-oauth-popup` hook 而非直接调用 `authClient.signIn.social`
- 使用 `disableRedirect: true` 获取 OAuth URL
- 移动端自动降级为 redirect 模式（通过 `useIsMobile` 检测）
- 降级时 callbackUrl 保持一致（当前页 URL）
- 处理 Popup 被拦截的场景并自动降级
- 认证完成时调用 `onSuccess` 回调

### 7. LoginForm / RegisterForm 修改

**新增可选 props：**
```typescript
interface LoginFormProps {
  // ... existing props
  renderSocialLogin?: (props: {
    callbackUrl: string
    showDivider: boolean
  }) => React.ReactNode
  onSwitchToRegister?: () => void  // 新增：视图切换回调
  onSuccess?: () => void           // 新增：登录成功回调（Modal 内使用，不触发 redirect）
}

interface RegisterFormProps {
  // ... existing props
  renderSocialLogin?: (props: {
    callbackUrl: string
    showDivider: boolean
  }) => React.ReactNode
  onSwitchToLogin?: () => void   // 新增：视图切换回调
  onSuccess?: () => void         // 新增：注册成功回调（Modal 内使用）
}
```

**邮箱登录成功处理（LoginForm 内部）：**
```typescript
const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
  const result = await authClient.signIn.email({
    email: values.email,
    password: values.password,
    // Modal 内不传 callbackUrl，避免 redirect
    // 独立页面会传 callbackUrl，走 redirect 流程
    ...(callbackUrl && !onSuccess ? { callbackURL: callbackUrl } : {})
  })

  if (result.error) {
    setError(result.error.message)
    return
  }

  // 如果有 onSuccess 回调（Modal 内使用），调用回调而不是等待 redirect
  if (onSuccess) {
    onSuccess()
  }
}
```

**Social Login 渲染逻辑：**
```tsx
{renderSocialLogin ? (
  renderSocialLogin({ callbackUrl, showDivider: credentialLoginEnabled })
) : (
  <SocialLoginButton callbackUrl={callbackUrl} showDivider={credentialLoginEnabled} />
)}
```

**`credentialLoginEnabled` 变量来源：**
```typescript
// 从 websiteConfig 获取配置（src/config/website.tsx）
const credentialLoginEnabled = websiteConfig.auth.enableCredentialLogin
// 当前项目配置：enableCredentialLogin: false（仅启用 OAuth 登录）
```

**传递给 AuthCard：**
```tsx
<AuthCard
  headerLabel={...}
  bottomButtonLabel={...}
  bottomButtonHref={Routes.Register}
  onBottomButtonClick={onSwitchToRegister}  // 如果传入，优先使用回调
>
```

**向后兼容性：**
- 如果不传 `renderSocialLogin`，使用默认的 `SocialLoginButton`（redirect 模式）
- 如果不传 `onSwitchToRegister/onSwitchToLogin`，AuthCard 使用默认的 Link 跳转
- 如果不传 `onSuccess`，登录成功后走原有的 callbackUrl redirect 流程
- 独立页面 `/auth/login` 和 `/auth/register` 不传这些 props，行为保持不变

---

## OAuth Popup 降级策略

```
用户点击 Google/GitHub 登录
        |
        v
useIsMobile() 检查设备类型
        |
        +-- 移动端 --> 直接 redirect 模式
        |               callbackUrl = window.location.href
        |
        +-- 桌面端
                |
                v
        【同步】window.open('about:blank') 打开空白 Popup
                |
                +-- 失败（被拦截）--> redirect 模式
                |                     callbackUrl = window.location.href
                |
                +-- 成功
                        |
                        v
                【异步】signIn.social({ disableRedirect: true }) 获取 OAuth URL
                        |
                        v
                设置 popup.location.href = oauthUrl
                        |
                        v
                用户在 Popup 中授权
                        |
                        +-- 授权成功 --> postMessage --> session.refetch() --> 关闭 Modal
                        |
                        +-- 授权失败 --> postMessage(error) --> 显示错误
                        |
                        +-- 用户关闭 Popup --> 显示"认证已取消"
```

**降级场景：**

| 场景 | 检测方式 | 处理方式 |
|------|----------|----------|
| 移动端设备 | `useIsMobile()` hook | 直接 redirect，callbackUrl = `window.location.href` |
| Popup 被拦截 | `window.open()` 返回 null | redirect，callbackUrl = `window.location.href` |
| OAuth 授权失败 | `errorCallbackURL` 参数 | Popup 发送 error postMessage，显示错误提示 |
| 用户关闭 Popup | 轮询 `popup.closed` | 显示"认证已取消"提示 |
| postMessage 失败 | try-catch | 显示错误，允许重试 |

**callbackUrl 统一处理：**
- Popup 成功：`session.refetch()` 刷新会话，Modal 关闭（无页面跳转）
- Redirect 降级：callbackUrl 使用 `window.location.href`（完整 URL，包含 query/hash），登录后回到当前页

---

## 文件改动汇总

### 新建文件

| 文件 | 描述 |
|------|------|
| `src/stores/auth-modal-store.ts` | Modal 状态管理 |
| `src/components/auth/auth-modal.tsx` | 统一认证弹窗 |
| `src/components/providers/auth-modal-provider.tsx` | Provider 组件 |
| `src/app/[locale]/auth/oauth-callback/page.tsx` | OAuth Popup 回调（需带 locale） |
| `src/components/auth/social-login-popup-button.tsx` | Popup Social Login 按钮 |
| `src/hooks/use-oauth-popup.ts` | OAuth Popup Hook |

### 修改文件（最小改动）

| 文件 | 改动 |
|------|------|
| `src/components/auth/auth-card.tsx` | 添加可选 `onBottomButtonClick` prop |
| `src/components/auth/login-form.tsx` | 添加可选 `renderSocialLogin`、`onSwitchToRegister`、`onSuccess` props |
| `src/components/auth/register-form.tsx` | 添加可选 `renderSocialLogin`、`onSwitchToLogin`、`onSuccess` props |
| `src/components/layout/navbar.tsx` | 按钮 onClick 调用 store 方法 |
| `src/app/[locale]/layout.tsx` | 添加 `<AuthModalProvider />` |

### 不变文件

| 文件 | 原因 |
|------|------|
| `src/components/auth/social-login-button.tsx` | 原组件保留供独立页面使用（redirect 模式） |
| `src/components/layout/navbar-mobile.tsx` | 移动端保持 redirect 行为 |
| `src/app/[locale]/auth/login/page.tsx` | 独立页面保留，使用原有 redirect 模式 |
| `src/app/[locale]/auth/register/page.tsx` | 独立页面保留，使用原有 redirect 模式 |
| `src/components/auth/login-wrapper.tsx` | 保留不变，供简单场景快捷使用 |

---

## 国际化

在 `messages/en.json` 和 `messages/zh.json` 中添加：

**en.json:**
```json
{
  "AuthModal": {
    "completingAuth": "Completing authentication...",
    "authCancelled": "Authentication was cancelled",
    "authFailed": "Authentication failed, please try again",
    "popupBlocked": "Popup was blocked, redirecting..."
  }
}
```

**zh.json:**
```json
{
  "AuthModal": {
    "completingAuth": "正在完成认证...",
    "authCancelled": "认证已取消",
    "authFailed": "认证失败，请重试",
    "popupBlocked": "弹窗被拦截，正在跳转..."
  }
}
```

**复用现有翻译 key：**

Social Login 按钮文案复用 `AuthPage.login` 命名空间中的现有 key：
- `signInWithGoogle` - "Sign In with Google" / "使用 Google 登录"
- `signInWithGitHub` - "Sign In with GitHub" / "使用 GitHub 登录"
- `or` - "Or continue with" / "或继续使用"（分割线文案）

---

## 错误处理

### 错误类型和提示

| 错误场景 | 用户提示（中文） | 用户提示（英文） |
|----------|-----------------|-----------------|
| Popup 被拦截 | 弹窗被拦截，正在跳转... | Popup was blocked, redirecting... |
| 认证取消 | 认证已取消 | Authentication was cancelled |
| 认证失败 | 认证失败，请重试 | Authentication failed, please try again |

### 错误展示方式

| 错误类型 | 展示方式 |
|----------|----------|
| Popup 被拦截 | Toast 提示 + 自动降级到 redirect |
| 用户关闭 Popup | Toast 提示"认证已取消" |
| OAuth 授权失败 | 重定向到默认错误页面 `Routes.AuthError` |
| postMessage 失败 | Toast 提示错误信息 |

---

## 安全考虑

| 关注点 | 处理方式 |
|--------|----------|
| postMessage origin | 验证 `event.origin === window.location.origin` |
| postMessage source | 验证 `event.source === popupWindowRef`（新增） |
| OAuth state | Better Auth 通过 state 参数处理 CSRF 防护 |
| Popup 窗口引用 | 使用后清理引用，避免内存泄漏 |

**postMessage 验证（增强版）：**
```typescript
window.addEventListener('message', (event) => {
  // 校验 origin
  if (event.origin !== window.location.origin) {
    return
  }

  // 校验 source（确保来自我们打开的 popup）
  if (event.source !== popupRef.current) {
    return
  }

  // 校验消息类型
  if (event.data?.type !== 'oauth-callback') {
    return
  }

  // Process message...
})
```

---

## 实现注意事项

1. **OAuth URL 获取**
   - 必须使用 `signIn.social({ disableRedirect: true })` 获取 URL
   - 不要硬编码 `/api/auth/signin/${provider}` 路径
   - 这确保与 better-auth 的路由配置兼容

2. **视图切换使用回调方式**
   - 通过 `onSwitchToRegister` / `onSwitchToLogin` 回调实现
   - 比事件委托更稳健，不依赖 URL 字符串匹配
   - AuthCard 添加可选 `onBottomButtonClick` prop 支持回调

3. **callbackUrl 统一处理**
   - Modal 内邮箱登录：**不传 callbackUrl**，成功后调用 `refetch()` 刷新会话
   - OAuth Popup 成功：通过 postMessage 通知，调用 `refetch()` 刷新会话，关闭 Modal
   - Redirect 降级：callbackUrl 使用 `window.location.href`（完整 URL）
   - 保持"登录后留在当前页、无刷新"的一致体验

4. **locale 处理**
   - OAuth provider callback：`/api/auth/callback/google`（固定，无 locale）
   - Popup 回调页：使用 `getLocalePathname` 生成正确路径（兼容 `localePrefix: 'as-needed'`）
   - 示例：`getLocalePathname({ href: '/auth/oauth-callback', locale })`
   - 默认语言（如 en）可能不带前缀，非默认语言会带前缀

5. **会话刷新**
   - Popup/邮箱登录成功后需要刷新会话状态
   - 使用 `authClient.useSession()` 返回的 `refetch` 方法
   - 调用 `await refetch()` 刷新会话，触发 React 组件重新渲染

6. **Modal 关闭时机**
   - 邮箱密码登录成功：关闭 Modal
   - OAuth 成功：关闭 Modal
   - 邮箱密码注册成功：关闭 Modal

7. **移动端检测**
   - 复用现有 `useIsMobile` hook
   - 移动端直接使用 redirect 模式，不尝试 popup
   - 保持全项目检测逻辑一致

8. **独立页面行为**
   - `/auth/login` 和 `/auth/register` 保持原有 redirect 模式
   - 不传 `renderSocialLogin` prop，使用默认的 `SocialLoginButton`

---

## 验收标准

### 功能测试

#### Auth Modal
- [ ] 点击导航栏"登录"按钮打开 Modal，显示登录表单
- [ ] 点击导航栏"注册"按钮打开 Modal，显示注册表单
- [ ] 点击底部链接在登录/注册视图之间切换
- [ ] 邮箱密码登录成功后 Modal 关闭
- [ ] OAuth 登录成功后 Modal 关闭
- [ ] 邮箱密码注册成功后 Modal 关闭，会话刷新
- [ ] 点击外部区域或按 ESC 可关闭 Modal

#### OAuth Popup
- [ ] 点击 Google/GitHub 登录打开 Popup 弹窗（桌面端）
- [ ] Popup 弹窗在屏幕居中显示
- [ ] Popup 中授权成功后，Popup 关闭，会话刷新，Modal 关闭
- [ ] 用户手动关闭 Popup 时显示"认证已取消"
- [ ] Popup 被拦截时自动降级到 redirect（callbackUrl 为当前页）
- [ ] 移动端直接使用 redirect 模式

#### 向后兼容
- [ ] 独立 `/auth/login` 页面正常工作（使用 redirect 模式）
- [ ] 独立 `/auth/register` 页面正常工作（使用 redirect 模式）
- [ ] 移动端导航栏仍使用 redirect 模式
- [ ] Modal 内邮箱密码登录正常工作

### 边界情况
- [ ] 快速多次点击不会打开多个 Modal
- [ ] Popup 认证过程中网络错误被优雅处理
- [ ] 浏览器后退按钮不会破坏 Modal 状态

### 性能
- [ ] Modal 打开时间 < 100ms
- [ ] Modal 打开时无布局偏移
- [ ] Popup 弹窗在点击后立即打开

---

## 依赖

### 现有依赖（无需更改）
- `@radix-ui/react-dialog` - Modal 基础
- `zustand` - 状态管理
- `better-auth` - 认证（需使用 `disableRedirect` 选项）
- `sonner` - Toast 提示
- `useIsMobile` hook - 移动端检测
- `useLocale` - 获取当前 locale

### 无需新增依赖

所有功能可使用项目现有依赖实现。

---

## 待确认事项

1. ~~**会话刷新 API**~~：✅ 已确认使用 `authClient.useSession()` 的 `refetch` 方法
2. ~~**disableRedirect 返回值**~~：✅ 已确认返回 `{ data: { url: string }, error?: Error }`，通过 `result.data.url` 访问
3. ~~**errorCallbackURL 支持**~~：✅ 已确认支持，但使用默认配置 `Routes.AuthError` 即可，无需额外传参
