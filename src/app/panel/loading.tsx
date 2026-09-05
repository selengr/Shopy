export default function PanelLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <div className="h-8 w-44 animate-pulse rounded-full bg-[#14110e]/10" />
      <div className="mt-4 h-4 w-80 max-w-full animate-pulse rounded-full bg-[#14110e]/8" />
      <div className="mt-10 space-y-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-3xl bg-[#14110e]/5"
          />
        ))}
      </div>
    </div>
  );
}
