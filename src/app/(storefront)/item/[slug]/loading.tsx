export default function ItemLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:min-h-screen">
        {/* Image skeleton */}
        <div className="relative aspect-square lg:aspect-auto lg:h-screen bg-muted" />

        {/* Content skeleton */}
        <div className="max-w-xl mx-auto px-5 sm:px-8 py-8 pb-32 lg:pb-40 w-full">
          {/* Title */}
          <div className="mb-8">
            <div className="h-8 w-48 bg-muted rounded-lg mb-3" />
            <div className="h-6 w-24 bg-muted rounded-lg mb-4" />
            <div className="h-4 w-full bg-muted rounded-lg mb-2" />
            <div className="h-4 w-3/4 bg-muted rounded-lg" />
          </div>

          {/* Variant group skeleton */}
          <div className="mb-8 pt-6 border-t border-border">
            <div className="h-5 w-40 bg-muted rounded-lg mb-4" />
            <div className="space-y-0 divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-4">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-5 w-5 bg-muted rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Extra groups skeleton */}
          {[1, 2, 3].map((g) => (
            <div key={g} className="mb-8 pt-6 border-t border-border">
              <div className="h-5 w-44 bg-muted rounded-lg mb-1" />
              <div className="h-3 w-20 bg-muted rounded mb-4" />
              <div className="space-y-0 divide-y divide-border">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div className="h-4 w-36 bg-muted rounded" />
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-14 bg-muted rounded" />
                      <div className="h-5 w-5 bg-muted rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA skeleton */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-1/2 bg-background border-t border-border px-5 py-4 z-20">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <div className="h-12 w-28 bg-muted rounded-full" />
          <div className="flex-1 h-12 bg-muted rounded-full" />
        </div>
      </div>
    </div>
  );
}
