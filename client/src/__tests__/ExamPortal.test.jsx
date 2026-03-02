import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import ExamPortal from '../pages/ExamTakingPage' // Note: This file was renamed content-wise in previous step but filename might still be ExamTakingPage or StudentDashboard. The prompt calls it ExamPortal.jsx. 
// I overwrote ExamTakingPage.jsx in the previous step with the portal code.

// Mocks
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    token: 'fake-token',
    user: { id: 1, name: 'Test Student' }
  })
}))

vi.mock('react-router-dom', () => ({
  useParams: () => ({ examId: '1' }),
  useNavigate: () => vi.fn()
}))

describe('ExamPortal Component', () => {
  beforeEach(() => {
    // Mock Fullscreen API
    document.documentElement.requestFullscreen = vi.fn(() => Promise.resolve())
    document.exitFullscreen = vi.fn()
    
    // Mock Fetch
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        title: 'Test Exam',
        duration_minutes: 60,
        questions: [
            { id: 101, question_text: 'Q1', question_type: 'objective', options: ['A', 'B'], marks: 1 }
        ]
      })
    }))
  })

  it('renders start screen initially', async () => {
    render(<ExamPortal />)
    expect(await screen.findByText("Security Protocol:")).toBeInTheDocument()
  })

  it('enters fullscreen on start', async () => {
    render(<ExamPortal />)
    const btn = await screen.findByText(/Agree & Start/i)
    fireEvent.click(btn)
    expect(document.documentElement.requestFullscreen).toHaveBeenCalled()
  })
})
