import type { Id } from "@ai-studio-gallery/backend/convex/_generated/dataModel";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Globe,
  Heart,
  Lock,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LightboxImage {
  id: Id<"images">;
  url: string;
  prompt: string;
  aspectRatio: string;
  model: string;
  visibility: "public" | "private";
  isFavorite: boolean;
  createdAt?: number;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onFavorite?: (id: Id<"images">) => void;
  onDownload?: (url: string, prompt: string) => void;
  isOwner?: boolean;
}

export function ImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
  onFavorite,
  onDownload,
  isOwner = false,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentImage = images[currentIndex];

  // Reset index when opening
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "ArrowLeft") {
        goToPrevious();
      }
      if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, goToPrevious, goToNext]);

  if (!currentImage) {
    return null;
  }

  const isPro = currentImage.model === "gemini-3-pro-image-preview";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Content */}
          <div className="relative z-10 flex h-full w-full max-w-7xl flex-col p-4 md:p-8">
            {/* Header */}
            <motion.div
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center justify-between pb-4"
              initial={{ y: -20, opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                {isPro && (
                  <span className="pro-badge flex items-center gap-1">
                    <Zap className="size-3" />
                    PRO
                  </span>
                )}
                {isOwner && (
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs backdrop-blur-sm",
                      currentImage.visibility === "public"
                        ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                        : "border border-slate-500/30 bg-slate-500/20 text-slate-400"
                    )}
                  >
                    {currentImage.visibility === "public" ? (
                      <Globe className="size-3" />
                    ) : (
                      <Lock className="size-3" />
                    )}
                    {currentImage.visibility}
                  </span>
                )}
                <span className="font-mono text-muted-foreground text-sm">
                  {currentIndex + 1} / {images.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && onFavorite && (
                  <Button
                    className="text-white hover:bg-white/10"
                    onClick={() => onFavorite(currentImage.id)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Heart
                      className={cn(
                        "size-5 transition-all",
                        currentImage.isFavorite &&
                          "scale-110 fill-red-500 text-red-500"
                      )}
                    />
                  </Button>
                )}
                {onDownload && (
                  <Button
                    className="text-white hover:bg-white/10"
                    onClick={() =>
                      onDownload(currentImage.url, currentImage.prompt)
                    }
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Download className="size-5" />
                  </Button>
                )}
                <Button
                  className="text-white hover:bg-white/10"
                  onClick={onClose}
                  size="icon-sm"
                  variant="ghost"
                >
                  <X className="size-5" />
                </Button>
              </div>
            </motion.div>

            {/* Image container */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden">
              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    className="absolute left-2 z-20 text-white hover:bg-white/10 md:left-4"
                    onClick={goToPrevious}
                    size="icon"
                    variant="ghost"
                  >
                    <ChevronLeft className="size-6" />
                  </Button>
                  <Button
                    className="absolute right-2 z-20 text-white hover:bg-white/10 md:right-4"
                    onClick={goToNext}
                    size="icon"
                    variant="ghost"
                  >
                    <ChevronRight className="size-6" />
                  </Button>
                </>
              )}

              {/* Image with animation */}
              <AnimatePresence mode="wait">
                <motion.div
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  className="relative flex max-h-full max-w-full items-center justify-center"
                  exit={{ opacity: 0, scale: 0.95, x: -50 }}
                  initial={{ opacity: 0, scale: 0.95, x: 50 }}
                  key={currentImage.id}
                  transition={{ duration: 0.2 }}
                >
                  <img
                    alt={currentImage.prompt}
                    className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl md:max-h-[75vh]"
                    height={1024}
                    src={currentImage.url}
                    width={1024}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer with prompt */}
            <motion.div
              animate={{ y: 0, opacity: 1 }}
              className="pt-4"
              initial={{ y: 20, opacity: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="glass-card mx-auto max-w-3xl rounded-xl p-4">
                <p className="text-center text-sm text-white/90 leading-relaxed">
                  {currentImage.prompt}
                </p>
                {currentImage.createdAt && (
                  <p className="mt-2 text-center text-muted-foreground text-xs">
                    Created{" "}
                    {new Date(currentImage.createdAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Thumbnail strip for navigation */}
            {images.length > 1 && (
              <motion.div
                animate={{ y: 0, opacity: 1 }}
                className="mt-4 flex justify-center gap-2 overflow-x-auto pb-2"
                initial={{ y: 20, opacity: 0 }}
                transition={{ delay: 0.2 }}
              >
                {images.slice(0, 10).map((img, idx) => (
                  <button
                    className={cn(
                      "h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                      idx === currentIndex
                        ? "border-aurora-2 ring-2 ring-aurora-2/50"
                        : "border-transparent opacity-50 hover:opacity-100"
                    )}
                    key={img.id}
                    onClick={() => setCurrentIndex(idx)}
                    type="button"
                  >
                    <img
                      alt=""
                      className="h-full w-full object-cover"
                      height={48}
                      src={img.url}
                      width={48}
                    />
                  </button>
                ))}
                {images.length > 10 && (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/50 text-muted-foreground text-xs">
                    +{images.length - 10}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
