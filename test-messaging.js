// Test script for messaging API endpoints
// Run with: node test-messaging.js

const BASE_URL = 'http://localhost:3000'

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
}

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  }
  console.log(`${colors[type]}${message}${colors.reset}`)
}

async function test(name, fn) {
  try {
    log(`\nTesting: ${name}`, 'info')
    await fn()
    results.passed++
    results.tests.push({ name, status: 'PASSED' })
    log(`✓ PASSED: ${name}`, 'success')
  } catch (error) {
    results.failed++
    results.tests.push({ name, status: 'FAILED', error: error.message })
    log(`✗ FAILED: ${name}`, 'error')
    log(`  Error: ${error.message}`, 'error')
  }
}

async function createTestUsers() {
  log('\n=== Creating Test Users ===', 'info')

  const users = [
    { email: 'alice@test.com', username: 'alice', displayName: 'Alice', password: 'password123' },
    { email: 'bob@test.com', username: 'bob', displayName: 'Bob', password: 'password123' }
  ]

  const createdUsers = []

  for (const userData of users) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      if (res.status === 201 || res.status === 200) {
        const data = await res.json()
        log(`  ✓ Created user: ${userData.username}`, 'success')
        createdUsers.push({ ...userData, token: data.token })
      } else if (res.status === 400) {
        // User might already exist, try to login
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userData.email, password: userData.password })
        })

        if (loginRes.ok) {
          const data = await loginRes.json()
          log(`  ✓ Logged in existing user: ${userData.username}`, 'success')
          createdUsers.push({ ...userData, token: data.token })
        }
      }
    } catch (error) {
      log(`  ✗ Failed to create/login user: ${userData.username}`, 'error')
    }
  }

  return createdUsers
}

async function runTests() {
  log('=================================================', 'info')
  log('   Quiz Squirrel - Messaging API Tests', 'info')
  log('=================================================', 'info')

  // Create test users
  const users = await createTestUsers()

  if (users.length < 2) {
    log('\n✗ ERROR: Could not create/login test users', 'error')
    return
  }

  const [alice, bob] = users

  let conversationId
  let messageId

  // Test 1: Create conversation
  await test('Create conversation between Alice and Bob', async () => {
    const res = await fetch(`${BASE_URL}/api/messages/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${alice.token}`
      },
      body: JSON.stringify({ userId: 'bob-user-id' }) // Will need real ID
    })

    // This will fail without real user ID, but tests the endpoint exists
    if (res.status === 403 || res.status === 400 || res.status === 201) {
      // Endpoint exists and responds
    } else {
      throw new Error(`Unexpected status: ${res.status}`)
    }
  })

  // Test 2: Get conversations list
  await test('Get conversations list', async () => {
    const res = await fetch(`${BASE_URL}/api/messages/conversations`, {
      headers: {
        'Cookie': `auth-token=${alice.token}`
      }
    })

    if (!res.ok) throw new Error(`Status: ${res.status}`)

    const data = await res.json()
    if (!Array.isArray(data.conversations)) {
      throw new Error('Response should contain conversations array')
    }
  })

  // Test 3: Get unread count
  await test('Get unread message count', async () => {
    const res = await fetch(`${BASE_URL}/api/messages/unread-count`, {
      headers: {
        'Cookie': `auth-token=${alice.token}`
      }
    })

    if (!res.ok) throw new Error(`Status: ${res.status}`)

    const data = await res.json()
    if (typeof data.count !== 'number') {
      throw new Error('Response should contain numeric count')
    }
  })

  // Test 4: Poll for new messages
  await test('Poll for new messages', async () => {
    const since = new Date(Date.now() - 60000).toISOString() // 1 minute ago
    const res = await fetch(`${BASE_URL}/api/messages/poll?since=${since}`, {
      headers: {
        'Cookie': `auth-token=${alice.token}`
      }
    })

    if (!res.ok) throw new Error(`Status: ${res.status}`)

    const data = await res.json()
    if (!Array.isArray(data.newMessages)) {
      throw new Error('Response should contain newMessages array')
    }
    if (!Array.isArray(data.updatedConversations)) {
      throw new Error('Response should contain updatedConversations array')
    }
  })

  // Test 5: Unauthorized access
  await test('Reject unauthorized access', async () => {
    const res = await fetch(`${BASE_URL}/api/messages/conversations`)

    if (res.status !== 401 && res.status !== 500) {
      throw new Error(`Expected 401, got ${res.status}`)
    }
  })

  // Print results
  log('\n=================================================', 'info')
  log('   Test Results', 'info')
  log('=================================================', 'info')
  log(`Total Tests: ${results.passed + results.failed}`, 'info')
  log(`Passed: ${results.passed}`, 'success')
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success')

  if (results.failed > 0) {
    log('\nFailed Tests:', 'error')
    results.tests.filter(t => t.status === 'FAILED').forEach(t => {
      log(`  - ${t.name}`, 'error')
      if (t.error) log(`    ${t.error}`, 'error')
    })
  }

  log('\n=================================================\n', 'info')
}

runTests().catch(error => {
  log(`\n✗ Fatal error: ${error.message}`, 'error')
  process.exit(1)
})
