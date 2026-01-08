import { api } from "@ai-studio-gallery/backend/convex/_generated/api";
import { convexQuery, useConvexAction } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Globe,
  Image as ImageIcon,
  Lock,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MODELS = [
  {
    value: "nano-banana",
    label: "Nano Banana",
    description: "Fast & efficient for most use cases",
    icon: "🍌",
    isPro: false,
  },
  {
    value: "nano-banana-pro",
    label: "Nano Banana Pro",
    description: "High-resolution up to 4K with Google Search",
    icon: "🍌",
    isPro: true,
  },
];

const ASPECT_RATIOS = [
  { value: "1:1", label: "Square", icon: "⬜" },
  { value: "16:9", label: "Wide", icon: "🖼️" },
  { value: "9:16", label: "Tall", icon: "📱" },
  { value: "4:3", label: "Classic", icon: "📺" },
  { value: "3:4", label: "Portrait", icon: "🖼️" },
  { value: "21:9", label: "Ultra", icon: "🎬" },
];

const RESOLUTIONS = [
  { value: "1K", label: "1K", description: "1024px" },
  { value: "2K", label: "2K", description: "2048px" },
  { value: "4K", label: "4K", description: "4096px" },
];

const STYLES = [
  { value: "none", label: "None" },
  { value: "photorealistic", label: "Photorealistic" },
  { value: "digital-art", label: "Digital Art" },
  { value: "anime", label: "Anime" },
  { value: "watercolor", label: "Watercolor" },
  { value: "oil-painting", label: "Oil Painting" },
  { value: "3d-render", label: "3D Render" },
  { value: "pixel-art", label: "Pixel Art" },
  { value: "cinematic", label: "Cinematic" },
];

export function GenerateDialog() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [modelKey, setModelKey] = useState("nano-banana");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("2K");
  const [style, setStyle] = useState("none");
  const [visibility, setVisibility] = useState<"public" | "private">("private");

  // Get rate limit status
  const rateLimitQuery = useQuery(
    convexQuery(api.users.getRateLimitStatus, {})
  );
  const rateLimit = rateLimitQuery.data ?? {
    remaining: 20,
    limit: 20,
    isLimited: false,
    resetsAt: undefined,
  };

  const generateActionFn = useConvexAction(api.generate.generateImage);
  const generateMutation = useMutation({
    mutationFn: generateActionFn,
    onSuccess: () => {
      setOpen(false);
      setPrompt("");
      toast.success("Image generated successfully!", {
        description: "Your creation is now in the gallery.",
      });
    },
    onError: (error) => {
      toast.error("Generation failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      return;
    }
    if (rateLimit.isLimited) {
      return;
    }

    const styleValue = style === "none" ? undefined : style;
    generateMutation.mutate({
      prompt: styleValue ? `${prompt}, ${styleValue} style` : prompt,
      aspectRatio,
      modelKey,
      resolution: modelKey === "nano-banana-pro" ? resolution : undefined,
      style: styleValue,
      visibility,
    });
  };

  const isGenerating = generateMutation.isPending;
  const isPro = modelKey === "nano-banana-pro";

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger>
        <Button className="aurora-gradient gap-2 font-semibold text-white shadow-lg transition-shadow hover:shadow-xl">
          <Sparkles className="size-4" />
          Generate
        </Button>
      </DialogTrigger>

      <DialogContent className="glass-card overflow-hidden border-aurora-2/30 sm:max-w-xl">
        {/* Aurora glow effect */}
        <div className="aurora-mesh absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-30 blur-3xl" />
        <div className="aurora-mesh absolute -bottom-20 -left-20 h-40 w-40 rounded-full opacity-20 blur-3xl" />

        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <Wand2 className="size-5 text-aurora-2" />
            </motion.div>
            Create with Nano Banana
          </DialogTitle>
        </DialogHeader>

        {/* Rate limit indicator */}
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/50 px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">Daily generations</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  animate={{ scaleY: 1 }}
                  className={cn(
                    "h-4 w-2 rounded-sm",
                    i < Math.ceil((rateLimit.remaining / 20) * 5)
                      ? "aurora-gradient"
                      : "bg-muted"
                  )}
                  initial={{ scaleY: 0.5 }}
                  key={`bar-${i}`}
                  transition={{ delay: i * 0.05 }}
                />
              ))}
            </div>
            <span
              className={cn(
                "font-medium font-mono",
                rateLimit.remaining <= 5 && "text-orange-500",
                rateLimit.remaining === 0 && "text-red-500"
              )}
            >
              {rateLimit.remaining}/{rateLimit.limit}
            </span>
          </div>
        </div>

        <div className="relative grid gap-5 py-2">
          {/* Model selection */}
          <div className="grid gap-3">
            <Label className="font-medium text-sm">Model</Label>
            <div className="grid grid-cols-2 gap-3">
              {MODELS.map((model) => (
                <motion.button
                  className={cn(
                    "relative flex flex-col items-start gap-1.5 rounded-xl border-2 p-4 text-left transition-all",
                    modelKey === model.value
                      ? "border-aurora-2 bg-aurora-2/10 shadow-aurora-2/20 shadow-lg"
                      : "border-border hover:border-aurora-2/50 hover:bg-muted/50"
                  )}
                  key={model.value}
                  onClick={() => setModelKey(model.value)}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{model.icon}</span>
                    <span className="font-semibold">{model.label}</span>
                    {model.isPro && (
                      <span className="pro-badge flex items-center gap-0.5">
                        <Zap className="size-2.5" />
                        PRO
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs leading-relaxed">
                    {model.description}
                  </span>
                  {modelKey === model.value && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-aurora-2"
                      layoutId="model-indicator"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div className="grid gap-3">
            <Label className="font-medium text-sm" htmlFor="prompt">
              Describe your image
            </Label>
            <Textarea
              className="min-h-25 resize-none border-border/50 bg-muted/30 transition-colors focus:border-aurora-2"
              id="prompt"
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A cosmic banana floating in a nebula, surrounded by swirling aurora lights and distant stars..."
              value={prompt}
            />
            <p className="text-muted-foreground text-xs">
              Be specific and descriptive for best results
            </p>
          </div>

          {/* Aspect ratio selection */}
          <div className="grid gap-3">
            <Label className="font-medium text-sm">Aspect Ratio</Label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <Button
                  className={cn(
                    "gap-1.5 transition-all",
                    aspectRatio === ratio.value &&
                      "aurora-gradient border-transparent shadow-md"
                  )}
                  key={ratio.value}
                  onClick={() => setAspectRatio(ratio.value)}
                  size="sm"
                  type="button"
                  variant={aspectRatio === ratio.value ? "default" : "outline"}
                >
                  <span>{ratio.icon}</span>
                  <span>{ratio.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Resolution selection (Pro only) */}
          <AnimatePresence mode="wait">
            {isPro && (
              <motion.div
                animate={{ height: "auto", opacity: 1 }}
                className="overflow-hidden"
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid gap-3">
                  <Label className="flex items-center gap-2 font-medium text-sm">
                    Resolution
                    <span className="pro-badge text-[10px]">PRO</span>
                  </Label>
                  <div className="flex gap-2">
                    {RESOLUTIONS.map((res) => (
                      <Button
                        className={cn(
                          "h-auto flex-1 flex-col py-2 transition-all",
                          resolution === res.value &&
                            "border-transparent bg-linear-to-r from-aurora-4 to-aurora-accent text-black"
                        )}
                        key={res.value}
                        onClick={() => setResolution(res.value)}
                        size="sm"
                        type="button"
                        variant={
                          resolution === res.value ? "default" : "outline"
                        }
                      >
                        <span className="font-bold">{res.label}</span>
                        <span className="text-[10px] opacity-70">
                          {res.description}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Style selection */}
          <div className="grid gap-3">
            <Label className="font-medium text-sm">Style (optional)</Label>
            <Select
              onValueChange={(value) => {
                if (value) {
                  setStyle(value);
                }
              }}
              value={style}
            >
              <SelectTrigger className="border-border/50 bg-muted/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility toggle */}
          <div className="grid gap-3">
            <Label className="font-medium text-sm">Visibility</Label>
            <div className="flex gap-2">
              <Button
                className={cn(
                  "flex-1 gap-2 transition-all",
                  visibility === "private" && "bg-slate-600 hover:bg-slate-700"
                )}
                onClick={() => setVisibility("private")}
                size="sm"
                type="button"
                variant={visibility === "private" ? "default" : "outline"}
              >
                <Lock className="size-4" />
                Private
              </Button>
              <Button
                className={cn(
                  "flex-1 gap-2 transition-all",
                  visibility === "public" &&
                    "bg-emerald-600 hover:bg-emerald-700"
                )}
                onClick={() => setVisibility("public")}
                size="sm"
                type="button"
                variant={visibility === "public" ? "default" : "outline"}
              >
                <Globe className="size-4" />
                Public
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              {visibility === "private"
                ? "Only you can see this image"
                : "Image will be visible in the community gallery"}
            </p>
          </div>
        </div>

        {/* Generate button */}
        <Button
          className={cn(
            "relative h-12 w-full overflow-hidden font-semibold text-base text-white transition-all",
            isPro
              ? "bg-linear-to-r from-aurora-4 to-aurora-accent hover:opacity-90"
              : "aurora-gradient hover:opacity-90"
          )}
          disabled={!prompt.trim() || isGenerating || rateLimit.isLimited}
          onClick={handleGenerate}
          type="button"
        >
          <AnimatePresence mode="wait">
            {rateLimit.isLimited ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                key="limited"
              >
                Rate limit reached • Resets{" "}
                {rateLimit.resetsAt
                  ? new Date(rateLimit.resetsAt).toLocaleTimeString()
                  : "later"}
              </motion.div>
            ) : isGenerating ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                key="loading"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                >
                  <Sparkles className="size-5" />
                </motion.div>
                Generating {isPro ? "high-res " : ""}magic...
              </motion.div>
            ) : (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
                exit={{ opacity: 0, y: -10 }}
                initial={{ opacity: 0, y: 10 }}
                key="idle"
              >
                {isPro ? (
                  <Zap className="size-5" />
                ) : (
                  <ImageIcon className="size-5" />
                )}
                Generate {isPro && "Pro "}Image
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
