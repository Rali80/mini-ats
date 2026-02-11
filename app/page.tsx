import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center space-y-6">
      <h1 className="text-4xl sm:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
        Mini ATS
      </h1>
      <p className="text-xl text-slate-500 max-w-2xl">
        The simplest way to track your candidates and manage your hiring pipeline.
      </p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button size="lg" className="text-lg px-8">
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  )
}
