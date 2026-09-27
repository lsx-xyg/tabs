import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: ref(null),
      isPending: ref(false),
      error: ref(null),
      refetch: vi.fn(),
    }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}))

import App from '../App.vue'

describe('App shell', () => {
  it('renders without crashing', () => {
    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Tabs')
  })
})
