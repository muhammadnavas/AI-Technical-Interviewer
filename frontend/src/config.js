// Configuration for API endpoints
const config = {
  AI_BACKEND_URL: import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:3000',
  RECRUITER_BACKEND_URL: import.meta.env.VITE_RECRUITER_BACKEND_URL || 'http://localhost:5000',
  CODE_EDITOR_URL: import.meta.env.AI_CodeEditor_API || 'https://ai-code-editor-psi-two.vercel.app/'
}

export default config