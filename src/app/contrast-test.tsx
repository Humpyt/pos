'use client'

export default function ContrastTest() {
  return (
    <div className="min-h-screen p-8 space-y-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-contrast-primary mb-2">Color Contrast Test</h1>
        <p className="text-contrast-secondary mb-8">This page demonstrates the improved color contrast throughout the application.</p>

        {/* Text Contrast Examples */}
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-contrast-primary mb-4">Text Contrast Examples</h2>
          <div className="space-y-4">
            <div>
              <p className="text-contrast-primary font-medium">Primary Text (High Contrast)</p>
              <p className="text-sm text-contrast-muted">Used for headings, important information, and primary UI elements.</p>
            </div>
            <div>
              <p className="text-contrast-secondary font-medium">Secondary Text</p>
              <p className="text-sm text-contrast-muted">Used for body text, descriptions, and secondary information.</p>
            </div>
            <div>
              <p className="text-contrast-muted font-medium">Muted Text</p>
              <p className="text-sm text-contrast-muted">Used for timestamps, metadata, and subtle information.</p>
            </div>
          </div>
        </div>

        {/* Button Contrast Examples */}
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-contrast-primary mb-4">Button Contrast Examples</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="btn-primary px-4 py-2 rounded-md">
              Primary
            </button>
            <button className="btn-secondary px-4 py-2 rounded-md">
              Secondary
            </button>
            <button className="btn-outline px-4 py-2 rounded-md">
              Outline
            </button>
            <button className="btn-ghost px-4 py-2 rounded-md">
              Ghost
            </button>
          </div>
        </div>

        {/* Status Colors */}
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-contrast-primary mb-4">Status Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="badge-success mb-2">Success</div>
              <p className="text-sm text-contrast-muted">High contrast green</p>
            </div>
            <div className="text-center">
              <div className="badge-warning mb-2">Warning</div>
              <p className="text-sm text-contrast-muted">High contrast yellow</p>
            </div>
            <div className="text-center">
              <div className="badge-error mb-2">Error</div>
              <p className="text-sm text-contrast-muted">High contrast red</p>
            </div>
            <div className="text-center">
              <div className="badge-info mb-2">Info</div>
              <p className="text-sm text-contrast-muted">High contrast blue</p>
            </div>
          </div>
        </div>

        {/* Background Variations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-contrast-primary mb-2">Card Background</h3>
            <p className="text-contrast-secondary">Standard white card with proper text contrast.</p>
          </div>
          <div className="bg-surface p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-contrast-primary mb-2">Surface Background</h3>
            <p className="text-contrast-secondary">Light gray surface with maintained text contrast.</p>
          </div>
          <div className="bg-secondary p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-contrast-primary mb-2">Secondary Background</h3>
            <p className="text-contrast-secondary">Subtle background with appropriate text contrast.</p>
          </div>
        </div>

        {/* Input Fields */}
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-contrast-primary mb-4">Input Field Contrast</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Default input field"
              className="input-field w-full"
            />
            <input
              type="text"
              placeholder="Focused input field"
              className="input-field w-full focus-ring-primary"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Disabled input"
                className="input-field w-full"
                disabled
              />
              <input
                type="text"
                placeholder="Error state"
                className="input-field w-full border-error focus-ring-error"
              />
            </div>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-contrast-primary mb-4">Before/After Comparison</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-contrast-secondary mb-3">Before (Poor Contrast)</h3>
              <div className="bg-gray-50 p-4 rounded border">
                <p className="text-gray-400 mb-2">Very light text on light background</p>
                <p className="text-gray-300 text-sm">Even harder to read text</p>
                <button className="mt-3 px-3 py-1 bg-gray-200 text-gray-500 rounded text-sm">Low contrast button</button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-contrast-secondary mb-3">After (Improved Contrast)</h3>
              <div className="bg-surface p-4 rounded border">
                <p className="text-contrast-secondary mb-2">Clear text with proper contrast</p>
                <p className="text-contrast-muted text-sm">Readable secondary text</p>
                <button className="mt-3 btn-secondary px-3 py-1 rounded text-sm">High contrast button</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}