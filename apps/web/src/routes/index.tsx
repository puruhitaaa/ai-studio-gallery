import { api } from "@ai-studio-gallery/backend/convex/_generated/api";
import type { Id } from "@ai-studio-gallery/backend/convex/_generated/dataModel";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ImageIcon, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ImageCard } from "@/components/gallery/image-card";
import { ImageLightbox } from "@/components/gallery/image-lightbox";
import { GenerateDialog } from "@/components/generate/generate-dialog";

export const Route = createFileRoute("/")({
  component: GalleryPage,
});

function GalleryPage() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const imagesQuery = useQuery(convexQuery(api.images.listMine, {}));
  const images = imagesQuery.data?.images ?? [];

  const toggleFavoriteMutation = useMutation({
    mutationFn: useConvexMutation(api.images.toggleFavorite),
    onSuccess: () => {
      toast.success("Updated favorite status");
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: useConvexMutation(api.images.toggleVisibility),
    onSuccess: () => {
      toast.success("Visibility updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: useConvexMutation(api.images.remove),
    onSuccess: () => {
      toast.success("Image deleted");
    },
  });

  const handleDownload = async (url: string, prompt: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success("Image downloaded");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Transform images for lightbox
  const lightboxImages = images.map((img) => ({
    id: img._id as Id<"images">,
    url: img.url ?? "",
    prompt: img.prompt,
    aspectRatio: img.aspectRatio,
    model: img.model,
    visibility: img.visibility,
    isFavorite: img.isFavorite,
    createdAt: img.createdAt,
  }));

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative overflow-hidden px-4 py-16">
        {/* Background effects */}
        <div className="aurora-mesh absolute inset-0 opacity-10" />
        <div className="absolute top-1/2 left-1/2 h-200 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-2/5 blur-3xl" />

        <div className="container relative z-10 mx-auto max-w-5xl">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-aurora-2/20 bg-aurora-2/10 px-4 py-1.5 font-medium text-aurora-2 text-sm"
              initial={{ scale: 0.9, opacity: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Sparkles className="size-4" />
              Powered by Google Nano Banana
            </motion.div>

            <h1 className="mb-6 font-bold text-5xl tracking-tight md:text-7xl">
              <span className="aurora-gradient-text">AI Studio</span>{" "}
              <span className="text-foreground">Gallery</span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground leading-relaxed md:text-xl">
              Transform your imagination into stunning visuals with AI-powered
              image generation. Create, collect, and share amazing artwork.
            </p>

            <div className="flex justify-center gap-4">
              <GenerateDialog />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-border/50 border-y bg-muted/30 py-6">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div
            animate={{ opacity: 1 }}
            className="flex justify-center gap-12 text-center"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col items-center">
              <div className="aurora-gradient-text font-bold font-mono text-3xl">
                {images.length}
              </div>
              <div className="text-muted-foreground text-sm">
                Images Created
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 font-bold font-mono text-3xl">
                <Zap className="size-6 text-aurora-4" />
              </div>
              <div className="text-muted-foreground text-sm">
                Fast Generation
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="aurora-gradient-text font-bold font-mono text-3xl">
                4K
              </div>
              <div className="text-muted-foreground text-sm">
                Max Resolution
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery grid */}
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-7xl">
          {images.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3 xl:columns-4">
              {images.map((image, index) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="break-inside-avoid"
                  initial={{ opacity: 0, y: 20 }}
                  key={image._id}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <ImageCard
                    aspectRatio={image.aspectRatio}
                    id={image._id as Id<"images">}
                    isFavorite={image.isFavorite}
                    isOwner={true}
                    model={image.model}
                    onDelete={() =>
                      deleteMutation.mutate({ id: image._id as Id<"images"> })
                    }
                    onDownload={() =>
                      handleDownload(image.url ?? "", image.prompt)
                    }
                    onExpand={() => openLightbox(index)}
                    onFavorite={() =>
                      toggleFavoriteMutation.mutate({
                        id: image._id as Id<"images">,
                      })
                    }
                    onToggleVisibility={() =>
                      toggleVisibilityMutation.mutate({
                        id: image._id as Id<"images">,
                      })
                    }
                    prompt={image.prompt}
                    thumbnailUrl={image.thumbnailUrl ?? undefined}
                    url={image.url ?? ""}
                    visibility={image.visibility}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        isOwner={true}
        onClose={() => setLightboxOpen(false)}
        onDownload={handleDownload}
        onFavorite={(id) => toggleFavoriteMutation.mutate({ id })}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="py-20 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        className="glass-card mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl"
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <ImageIcon className="size-10 text-aurora-2" />
      </motion.div>
      <h2 className="mb-2 font-bold text-2xl">No images yet</h2>
      <p className="mx-auto mb-8 max-w-md text-muted-foreground">
        Start creating amazing images with AI. Your gallery is waiting to be
        filled with stunning artwork.
      </p>
      <GenerateDialog />
    </motion.div>
  );
}
