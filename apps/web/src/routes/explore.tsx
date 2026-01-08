import { api } from "@ai-studio-gallery/backend/convex/_generated/api";
import type { Id } from "@ai-studio-gallery/backend/convex/_generated/dataModel";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Globe, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ImageCard } from "@/components/gallery/image-card";
import { ImageLightbox } from "@/components/gallery/image-lightbox";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

function ExplorePage() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const imagesQuery = useQuery(convexQuery(api.images.listPublic, {}));
  const images = imagesQuery.data?.images ?? [];

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
    visibility: img.visibility as "public" | "private",
    isFavorite: false,
    createdAt: img.createdAt,
  }));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden border-border/50 border-b px-4 py-12">
        {/* Background effects */}
        <div className="absolute inset-0 bg-linear-to-r from-aurora-1/5 via-aurora-2/5 to-aurora-3/5" />
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-aurora-2/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-aurora-3/10 blur-3xl" />

        <div className="container relative z-10 mx-auto max-w-7xl">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 md:flex-row md:items-center"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              className="aurora-gradient flex h-16 w-16 items-center justify-center rounded-2xl shadow-aurora-2/30 shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <Users className="size-8 text-white" />
            </motion.div>
            <div>
              <h1 className="mb-2 font-bold text-3xl md:text-4xl">
                Community Gallery
              </h1>
              <p className="text-lg text-muted-foreground">
                Explore amazing creations shared by the community
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 md:ml-auto">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="size-4" />
                <span className="font-medium font-mono">{images.length}</span>
                <span className="text-sm">public</span>
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
                  transition={{ delay: index * 0.03, duration: 0.4 }}
                >
                  <ImageCard
                    aspectRatio={image.aspectRatio}
                    id={image._id as Id<"images">}
                    isFavorite={false}
                    isOwner={false}
                    model={image.model}
                    onDownload={() =>
                      handleDownload(image.url ?? "", image.prompt)
                    }
                    onExpand={() => openLightbox(index)}
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
        isOwner={false}
        onClose={() => setLightboxOpen(false)}
        onDownload={handleDownload}
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
        animate={{ y: [0, -8, 0] }}
        className="glass-card mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl"
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <TrendingUp className="size-10 text-aurora-2" />
      </motion.div>
      <h2 className="mb-2 font-bold text-2xl">No public images yet</h2>
      <p className="mx-auto max-w-md text-muted-foreground">
        Be the first to share your creations with the community! Generate an
        image and set it to public.
      </p>
    </motion.div>
  );
}
