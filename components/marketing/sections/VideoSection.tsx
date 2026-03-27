export function VideoSection() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          See Parsli in Action
        </h2>
        <p className="text-lg text-gray-500 mb-8">
          Watch how Parsli extracts structured data from any document in seconds.
        </p>
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
          <video
            src="/videos/parsli-demo.mp4"
            autoPlay
            muted
            loop
            controls
            playsInline
            className="w-full"
          />
        </div>
      </div>
    </section>
  )
}
