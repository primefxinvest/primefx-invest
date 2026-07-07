'use client'

import { Component, type ReactNode } from 'react'
import DashboardMockup from '@/components/landing/DashboardMockup'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

/** Keeps the hero visible if the animated dashboard scene throws at runtime. */
export class HeroSceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative mx-auto w-full max-w-[580px] sm:max-w-none lg:mx-0">
          <DashboardMockup />
        </div>
      )
    }

    return this.props.children
  }
}
