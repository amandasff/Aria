import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold text-[#1A1A1A] tracking-tight">MusicPractice</span>
            </div>
            <div className="flex gap-6 items-center">
              <Link
                href="/login"
                className="text-[#1A1A1A] hover:text-[#1E59C7] px-4 py-2 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-[#1E59C7] text-white hover:bg-[#1a4ba8] px-6 py-2.5 rounded text-sm font-medium transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-40">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-[#1A1A1A] tracking-tight leading-none mb-8">
            AI-Powered Music
            <br />
            Practice Platform
          </h1>
          <p className="text-xl md:text-2xl text-[#1A1A1A] font-light mb-12 max-w-2xl mx-auto leading-relaxed">
            Transform music education with intelligent practice tracking and real-time AI feedback for teachers and students.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="bg-[#1E59C7] text-white px-8 py-4 rounded text-base font-medium hover:bg-[#1a4ba8] transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="border border-[#1A1A1A] text-[#1A1A1A] px-8 py-4 rounded text-base font-medium hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature Card 1 */}
          <div className="border border-gray-200 bg-white p-8 hover:border-[#1E59C7] transition-colors">
            <div className="mb-6">
              <svg className="w-8 h-8 text-[#1E59C7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-3 tracking-tight">
              Record Practice Sessions
            </h3>
            <p className="text-[#1A1A1A] font-light leading-relaxed">
              Browser-based recording interface captures practice sessions with automatic time tracking and metadata.
            </p>
          </div>

          {/* Feature Card 2 */}
          <div className="border border-gray-200 bg-white p-8 hover:border-[#1E59C7] transition-colors">
            <div className="mb-6">
              <svg className="w-8 h-8 text-[#1E59C7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-3 tracking-tight">
              AI-Powered Analysis
            </h3>
            <p className="text-[#1A1A1A] font-light leading-relaxed">
              Advanced AI provides detailed feedback on technique, timing, rhythm, and musicality with actionable insights.
            </p>
          </div>

          {/* Feature Card 3 */}
          <div className="border border-gray-200 bg-white p-8 hover:border-[#1E59C7] transition-colors">
            <div className="mb-6">
              <svg className="w-8 h-8 text-[#1E59C7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-3 tracking-tight">
              Teacher Dashboard
            </h3>
            <p className="text-[#1A1A1A] font-light leading-relaxed">
              Centralized platform to monitor all students' practice sessions, review recordings, and track progress.
            </p>
          </div>

          {/* Feature Card 4 */}
          <div className="border border-gray-200 bg-white p-8 hover:border-[#1E59C7] transition-colors">
            <div className="mb-6">
              <svg className="w-8 h-8 text-[#1E59C7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-3 tracking-tight">
              Progress Tracking
            </h3>
            <p className="text-[#1A1A1A] font-light leading-relaxed">
              Visualize practice time, consistency, and improvement metrics over weeks and months with data-driven insights.
            </p>
          </div>

          {/* Feature Card 5 */}
          <div className="border border-gray-200 bg-white p-8 hover:border-[#1E59C7] transition-colors">
            <div className="mb-6">
              <svg className="w-8 h-8 text-[#1E59C7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-3 tracking-tight">
              Personalized Feedback
            </h3>
            <p className="text-[#1A1A1A] font-light leading-relaxed">
              Receive specific, tailored suggestions for improvement based on your individual practice patterns and goals.
            </p>
          </div>

          {/* Feature Card 6 */}
          <div className="border border-gray-200 bg-white p-8 hover:border-[#1E59C7] transition-colors">
            <div className="mb-6">
              <svg className="w-8 h-8 text-[#1E59C7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-3 tracking-tight">
              Time Breakdown
            </h3>
            <p className="text-[#1A1A1A] font-light leading-relaxed">
              AI automatically identifies pieces, exercises, and scales practiced with precise time allocation analysis.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] text-center mb-20 tracking-tight">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-[#1E59C7] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-[#1E59C7]">1</span>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4 tracking-tight">Sign Up & Invite</h3>
            <p className="text-[#1A1A1A] font-light leading-relaxed">
              Teachers create an account and invite students with a secure, personalized invitation link.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-[#1E59C7] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-[#1E59C7]">2</span>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4 tracking-tight">Record & Practice</h3>
            <p className="text-[#1A1A1A] font-light leading-relaxed">
              Students record practice sessions directly in the browser with one-click audio capture.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-[#1E59C7] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-[#1E59C7]">3</span>
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4 tracking-tight">Get AI Feedback</h3>
            <p className="text-[#1A1A1A] font-light leading-relaxed">
              Receive instant AI analysis with detailed feedback and actionable suggestions for improvement.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-32">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-[#1A1A1A] mb-8 tracking-tight">
            Ready to Transform Music Practice?
          </h2>
          <p className="text-xl md:text-2xl text-[#1A1A1A] font-light mb-12 leading-relaxed">
            Join educators and students using AI to elevate their music practice and achieve measurable improvement.
          </p>
          <Link
            href="/signup"
            className="bg-[#1E59C7] text-white px-10 py-5 rounded text-lg font-medium hover:bg-[#1a4ba8] transition-colors inline-block"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <p className="text-center text-[#1A1A1A] font-light text-sm">
            &copy; 2024 MusicPractice Platform. Built for YC Application.
          </p>
        </div>
      </footer>
    </div>
  )
}
