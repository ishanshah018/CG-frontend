export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-canvas">
      <main className="flex w-full max-w-4xl flex-col gap-8 p-8">
        {/* Header Card */}
        <div className="bg-surface-card rounded-lg shadow-lg p-8 border border-border">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Design Tokens Test
          </h1>
          <p className="text-secondary text-lg mb-2">
            Testing our custom color system
          </p>
          <p className="text-muted">
            This page demonstrates all the design tokens we configured
          </p>
        </div>

        {/* Color Palette Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand Colors */}
          <div className="bg-surface-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Brand Colors</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-brand-primary rounded"></div>
                <div>
                  <p className="text-secondary font-medium">brand-primary</p>
                  <p className="text-muted text-sm">#2596BE</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-brand-primary-hover rounded"></div>
                <div>
                  <p className="text-secondary font-medium">brand-primary-hover</p>
                  <p className="text-muted text-sm">#1F7FA1</p>
                </div>
              </div>
            </div>
          </div>

          {/* Surface Colors */}
          <div className="bg-surface-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Surface Colors</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-surface-sidebar rounded border border-border"></div>
                <div>
                  <p className="text-secondary font-medium">surface-sidebar</p>
                  <p className="text-muted text-sm">#1E293B</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-surface-canvas rounded border border-border"></div>
                <div>
                  <p className="text-secondary font-medium">surface-canvas</p>
                  <p className="text-muted text-sm">#F8FAFC</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text Colors */}
          <div className="bg-surface-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Text Colors</h2>
            <div className="space-y-2">
              <p className="text-primary">text-primary (#0F172A)</p>
              <p className="text-secondary">text-secondary (#475569)</p>
              <p className="text-muted">text-muted (#94A3B8)</p>
            </div>
          </div>

          {/* Interactive Button */}
          <div className="bg-surface-card rounded-lg shadow p-6 border border-border">
            <h2 className="text-xl font-semibold text-primary mb-4">Interactive</h2>
            <button className="bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              Primary Button
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
