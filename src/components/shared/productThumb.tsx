type Thumb = {
  image?: string;
  emoji?: string;
  title: string;
};

export default function ProductThumb({
  item,
  className = "h-28",
  compact = false,
}: {
  item: Thumb;
  className?: string;
  compact?: boolean;
}) {
  if (item.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.image}
        alt={item.title}
        className={`object-cover ${compact ? "rounded-lg" : "rounded-2xl"} ${
          className.includes("w-") ? "" : "w-full"
        } ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex w-full items-center justify-center bg-[#1f4a45]/8 ${
        compact ? "rounded-lg text-lg" : "rounded-2xl text-5xl"
      } ${className}`}
    >
      {item.emoji ?? "📦"}
    </div>
  );
}
