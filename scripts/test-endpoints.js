const assert = require('assert');
const http = require('http');
const { Readable } = require('stream');
const app = require('../app');
const pool = require('../db');

/**
 * In-process HTTP request dispatcher without network sockets
 */
function request(app, options) {
  return new Promise((resolve) => {
    const { method = 'GET', path = '/', body = null, headers = {} } = options;

    const payload = body !== null ? JSON.stringify(body) : null;
    const reqHeaders = {
      'host': 'localhost',
      ...headers,
    };
    if (payload !== null) {
      reqHeaders['content-type'] = 'application/json';
      reqHeaders['content-length'] = String(Buffer.byteLength(payload));
    }

    const req = new Readable({
      read() {},
    });
    req.method = method;
    req.url = path;
    req.headers = reqHeaders;

    const res = new http.ServerResponse(req);
    res.assignSocket({
      _writableState: {},
      cork() {},
      uncork() {},
      write() {},
      on() {},
      once() {},
      emit() {},
    });

    let responseData = '';
    res.write = function (chunk) {
      if (chunk) responseData += chunk.toString();
      return true;
    };

    res.end = function (chunk) {
      if (chunk) responseData += chunk.toString();
      let json = null;
      try {
        json = JSON.parse(responseData);
      } catch (e) {}

      resolve({
        status: res.statusCode,
        headers: res.getHeaders(),
        text: responseData,
        json: () => json,
      });
    };

    app(req, res);

    if (payload !== null) {
      req.push(payload);
    }
    req.push(null);
  });
}

/**
 * Test runner to verify all endpoints and architecture requirements.
 */
async function runTests() {
  console.log('--- Starting API Endpoint Tests ---');

  // Track queries executed by pool
  const originalQuery = pool.query;
  const executedQueries = [];

  // In-memory mock store
  const inMemoryAssignments = [
    { id: 1, title: 'Backend Lab', deadline: '2026-08-10', submitted: false },
    { id: 2, title: 'Express Lab', deadline: '2026-08-12', submitted: true },
  ];

  pool.query = async function (text, params) {
    executedQueries.push({ text: text.trim(), params });

    // Handle INSERT
    if (text.includes('INSERT INTO assignments')) {
      const newId = inMemoryAssignments.length + 1;
      const created = {
        id: newId,
        title: params[0],
        deadline: params[1],
        submitted: false,
      };
      inMemoryAssignments.push(created);
      return { rows: [created] };
    }

    // Handle SELECT with submitted filter
    if (text.includes('SELECT') && text.includes('WHERE submitted = $1')) {
      const isSub = params[0];
      const rows = inMemoryAssignments
        .filter((a) => a.submitted === isSub)
        .sort((a, b) => b.id - a.id);
      return { rows };
    }

    // Handle SELECT all (ORDER BY id DESC)
    if (text.includes('SELECT') && text.includes('ORDER BY id DESC')) {
      const rows = [...inMemoryAssignments].sort((a, b) => b.id - a.id);
      return { rows };
    }

    // Handle UPDATE
    if (text.includes('UPDATE assignments') && text.includes('SET submitted = true')) {
      const id = params[0];
      const item = inMemoryAssignments.find((a) => a.id === id);
      if (item) {
        item.submitted = true;
        return { rows: [{ ...item }] };
      }
      return { rows: [] };
    }

    // Handle DELETE
    if (text.includes('DELETE FROM assignments')) {
      const id = params[0];
      const index = inMemoryAssignments.findIndex((a) => a.id === id);
      if (index !== -1) {
        const deleted = inMemoryAssignments.splice(index, 1)[0];
        return { rows: [deleted] };
      }
      return { rows: [] };
    }

    return { rows: [] };
  };

  try {
    // -------------------------------------------------------------
    // Test 1: POST /assignments
    // -------------------------------------------------------------
    console.log('\nTesting POST /assignments...');
    const createRes = await request(app, {
      method: 'POST',
      path: '/assignments',
      body: {
        title: 'Node.js Architecture Lab',
        deadline: '2026-09-30',
      },
    });
    assert.strictEqual(createRes.status, 201, 'POST should return 201 Created');
    const createdData = createRes.json();
    assert.strictEqual(createdData.title, 'Node.js Architecture Lab');
    assert.strictEqual(createdData.deadline, '2026-09-30');
    assert.strictEqual(createdData.submitted, false, 'Default submitted must be false');
    console.log('✓ POST /assignments passed:', createdData);

    // Test 1b: POST validation errors
    const invalidRes = await request(app, {
      method: 'POST',
      path: '/assignments',
      body: { title: '' },
    });
    assert.strictEqual(invalidRes.status, 400, 'POST with invalid body should return 400');
    console.log('✓ POST /assignments validation passed');

    // -------------------------------------------------------------
    // Test 2: GET /assignments (Newest first: ORDER BY id DESC)
    // -------------------------------------------------------------
    console.log('\nTesting GET /assignments (all, newest first)...');
    const getRes = await request(app, {
      method: 'GET',
      path: '/assignments',
    });
    assert.strictEqual(getRes.status, 200, 'GET should return 200 OK');
    const list = getRes.json();
    assert(Array.isArray(list), 'Response must be an array');
    assert(list.length >= 2, 'Should have multiple assignments');
    // Check ordering newest first
    for (let i = 0; i < list.length - 1; i++) {
      assert(list[i].id >= list[i + 1].id, 'Assignments must be ordered by id DESC');
    }
    console.log(`✓ GET /assignments returned ${list.length} assignments ordered newest first`);

    // -------------------------------------------------------------
    // Test 3: GET /assignments?submitted=true
    // -------------------------------------------------------------
    console.log('\nTesting GET /assignments?submitted=true...');
    const getSubRes = await request(app, {
      method: 'GET',
      path: '/assignments?submitted=true',
    });
    assert.strictEqual(getSubRes.status, 200, 'GET with filter should return 200 OK');
    const subList = getSubRes.json();
    assert(Array.isArray(subList), 'Filter response must be an array');
    subList.forEach((item) => {
      assert.strictEqual(item.submitted, true, 'Filtered item must have submitted = true');
    });
    console.log(`✓ GET /assignments?submitted=true returned ${subList.length} items with submitted=true`);

    // Test 3b: GET /assignments?submitted=invalid
    const invalidQueryRes = await request(app, {
      method: 'GET',
      path: '/assignments?submitted=maybe',
    });
    assert.strictEqual(invalidQueryRes.status, 400, 'Invalid query parameter should return 400');
    console.log('✓ GET /assignments?submitted=invalid validation passed');

    // Check parameterized queries executed
    const hasParameterizedSelect = executedQueries.some(
      (q) => q.text.includes('WHERE submitted = $1') && q.params && q.params[0] === true
    );
    assert(hasParameterizedSelect, 'GET filter must use parameterized query ($1)');
    console.log('✓ Parameterized SQL query verified for GET filter');

    console.log('\n--- Route 1 and Route 2 Verified Successfully! ---');
  } finally {
    pool.query = originalQuery;
  }
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}

module.exports = { runTests, request };
