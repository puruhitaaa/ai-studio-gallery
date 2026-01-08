# 🍌 AI Studio Gallery: Nano Banana

[![Tech Stack](https://img.shields.io/badge/Stack-TanStack_Start_|_Convex_|_Clerik-blueviolet?style=for-the-badge)](https://tanstack.com/)
[![AI Powered](https://img.shields.io/badge/AI-Google_Gemini-FFBA08?style=for-the-badge&logo=google-gemini&logoColor=white)](https://aistudio.google.com/)
[![Design System](https://img.shields.io/badge/Design-Neo--Aurora-00D9FF?style=for-the-badge)](https://tailwindcss.com/)

An ethereal, high-performance image generation platform and gallery. **AI Studio Gallery** leverages the raw power of Google Gemini's imaging models through a reactive, real-time backend and a stunning Neo-Aurora interface.

---

## ✨ Insightful Features

### 🎨 The Nano Banana Engine
Powered by `gemini-2.5-flash-image` and `gemini-3-pro-image-preview`, our engine doesn't just generate images; it interprets your creative vision with high-fidelity texture and cosmic accuracy. 

- **Flash Efficiency**: Generate concepts instantly with our optimized Nano Banana model.
- **Pro 4K Rendering**: Unlock high-resolution, photorealistic masterpieces with **Pro** model access.
- **Aspect Ratio Mastery**: From Ultra-wide (21:9) to Portrait (9:16), tailor your canvas to your needs.

### 🌌 Neo-Aurora Design System
We believe the interface should be as inspiring as the output. 
- **Glassmorphism**: A translucent, layered UI that breathes with the background.
- **Fluid Animations**: Every interaction is powered by `framer-motion` for a premium, tactile feel.
- **Cosmic Themes**: Adaptive light/dark modes that transition via a seamless sun-to-moon morph.

### 🖼️ Living Gallery & Lightbox
- **Reactive Masonry**: Our gallery uses a smart masonry layout that adapts to varied aspect ratios in real-time.
- **Immersive Lightbox**: View your creations in full detail with an advanced viewing system featuring keyboard navigation, EXIF data display, and instant download capabilities.
- **Granular Privacy**: Toggle visibility between **Public** (Community) and **Private** (Personal) with a single click.

---

## 🛠️ The Powerhouses Behind the Magic

| Technology | Role | Rationale |
|---|---|---|
| **[TanStack Start](https://tanstack.com/router/v1)** | Full-stack Framework | Zero-config SSR with robust type-safe routing. It ensures our SEO is as sharp as our pixels. |
| **[Convex](https://convex.dev)** | Reactive Backend | Traditional APIs are slow. Convex provides a real-time sync engine, ensuring the gallery updates instantly without refresh. |
| **[Google Gemini](https://ai.google.dev/)** | Intelligence | Utilizing the cutting-edge imaging capabilities for high-res prompt interpretation. |
| **[Clerk](https://clerk.com)** | Authentication | Seamless user onboarding with support for social logins and secure identity management. |

---

## 🚀 Getting Started

### 1. Requirements
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v8+)

### 2. Installation
```bash
# Clone the repository
git clone git@github.com:puruhitaaa/ai-studio-gallery.git
cd ai-studio-gallery

# Install dependencies
pnpm install
```

### 3. Environment Setup
Create a `.env.local` in `apps/web` and configure your Clerk keys. 
In `packages/backend`, initialize your Convex project:
```bash
pnpm run dev:setup
```

**Crucial Step**: You must set your Google AI API key in the Convex environment to enable image generation:
```bash
npx convex env set GEMINI_API_KEY your_actual_api_key_here
```

### 4. Run Development
```bash
pnpm run dev
```

---

## 📦 Project Structure

```bash
ai-studio-gallery/
├── apps/
│   └── web/           # React + TanStack Start (The Aurora Interface)
├── packages/
│   ├── backend/       # Convex Functions, Schema, & AI Actions
│   ├── config/        # Shared configuration (Tailwind, TypeScript)
│   └── env/           # Centrally managed environment variables
└── .husky/            # Quality control hooks
```

---

## 📜 License & Acknowledgments
Distributed under the MIT License. Special thanks to the **TanStack** and **Convex** teams for building the foundations of modern reactive web architecture.
