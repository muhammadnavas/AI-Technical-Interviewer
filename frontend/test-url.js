// Quick test to verify URL construction
console.log('Testing URL construction...')

// Simulate the problematic scenario
const testUrls = [
  'https://ai-technical-interviewer-o7qo.onrender.com',
  'https://ai-technical-interviewer-o7qo.onrender.com/',
  'http://localhost:5000',
  'http://localhost:5000/'
]

const removeTrailingSlash = (url) => url.endsWith('/') ? url.slice(0, -1) : url

testUrls.forEach(url => {
  const cleaned = removeTrailingSlash(url)
  const fullApiUrl = `${cleaned}/api/health`
  console.log(`Original: "${url}" -> Cleaned: "${cleaned}" -> API URL: "${fullApiUrl}"`)
})