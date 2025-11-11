// Configuration for API endpoints
const removeTrailingSlash = (url) => url.endsWith('/') ? url.slice(0, -1) : url

const rawBackendUrl = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:5000'
const cleanBackendUrl = removeTrailingSlash(rawBackendUrl)

// Debug logging for production
if (import.meta.env.PROD) {
  console.log('🔧 Backend URL Config:')
  console.log('Raw VITE_AI_BACKEND_URL:', rawBackendUrl)
  console.log('Cleaned AI_BACKEND_URL:', cleanBackendUrl)
}

const config = {
  AI_BACKEND_URL: cleanBackendUrl,
  RECRUITER_BACKEND_URL: removeTrailingSlash(import.meta.env.VITE_RECRUITER_BACKEND_URL || 'http://localhost:5000'),
  CODE_EDITOR_URL: import.meta.env.AI_CodeEditor_API || 'https://ai-code-editor-psi-two.vercel.app/'
}

export default config