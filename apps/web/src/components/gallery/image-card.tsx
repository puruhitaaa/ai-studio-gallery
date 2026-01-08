import type { Id } from "@ai-studio-gallery/backend/convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  Download,
  Expand,
  Globe,
  Heart,
  Lock,
  MoreHorizontal,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ImageCardProps {
  id: Id<"images">;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  aspectRatio: string;
  model: string;
  visibility: "public" | "private";
  isFavorite: boolean;
  isOwner: boolean;
  onFavorite?: () => void;
  onExpand: () => void;
  onDownload: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
}

export function ImageCard({
  url,
  thumbnailUrl,
  prompt,
  model,
  visibility,
  isFavorite,
  isOwner,
  onFavorite,
  onExpand,
  onDownload,
  onDelete,
  onToggleVisibility,
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isPro = model === "gemini-3-pro-image-preview";

  return (
    <motion.div
      className="group glass-card relative overflow-hidden rounded-xl"
      onHoverEnd={() => setIsHovered(false)}
      onHoverStart={() => setIsHovered(true)}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      {/* Image */}
      <img
        alt={prompt}
        className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-110"
        height={512}
        loading="lazy"
        src={thumbnailUrl ?? url}
        width={512}
      />

      {/* Top badges */}
      <div className="absolute top-3 left-3 flex gap-2">
        {isPro && (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="pro-badge flex items-center gap-1"
            initial={{ opacity: 0, scale: 0.8 }}
          >
            <Zap className="size-3" />
            PRO
          </motion.div>
        )}
        {isOwner && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs backdrop-blur-sm",
              visibility === "public"
                ? "border border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                : "border border-slate-500/30 bg-slate-500/20 text-slate-400"
            )}
          >
            {visibility === "public" ? (
              <Globe className="size-3" />
            ) : (
              <Lock className="size-3" />
            )}
            <span className="capitalize">{visibility}</span>
          </div>
        )}
      </div>

      {/* Gradient overlay */}
      <motion.div
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent"
        initial={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Actions */}
      <motion.div
        animate={{ y: isHovered ? 0 : 30, opacity: isHovered ? 1 : 0 }}
        className="absolute inset-x-0 bottom-0 p-4"
        initial={{ y: 30, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <p className="mb-3 line-clamp-2 font-medium text-sm text-white leading-relaxed">
          {prompt}
        </p>

        <div className="flex items-center gap-2">
          {isOwner && onFavorite && (
            <Button
              className="border border-white/10 bg-white/10 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                onFavorite();
              }}
              size="icon-sm"
              variant="ghost"
            >
              <Heart
                className={cn(
                  "size-4 transition-all duration-300",
                  isFavorite && "scale-110 fill-red-500 text-red-500"
                )}
              />
            </Button>
          )}

          <Button
            className="border border-white/10 bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            size="icon-sm"
            variant="ghost"
          >
            <Download className="size-4" />
          </Button>

          <Button
            className="border border-white/10 bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            size="icon-sm"
            variant="ghost"
          >
            <Expand className="size-4" />
          </Button>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  className="ml-auto border border-white/10 bg-white/10 text-white hover:bg-white/20"
                  onClick={(e) => e.stopPropagation()}
                  size="icon-sm"
                  variant="ghost"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card">
                <DropdownMenuItem onClick={onToggleVisibility}>
                  {visibility === "public" ? (
                    <>
                      <Lock className="mr-2 size-4" />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 size-4" />
                      Make Public
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  Delete Image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </motion.div>

      {/* Favorite indicator (always visible when favorited) */}
      {isFavorite && !isHovered && (
        <motion.div
          animate={{ scale: 1 }}
          className="absolute top-3 right-3"
          initial={{ scale: 0 }}
        >
          <Heart className="size-5 fill-red-500 text-red-500 drop-shadow-lg" />
        </motion.div>
      )}
    </motion.div>
  );
}
