const assert=require('assert');
const http=require('http');
const { Readable }=require('stream');
const app=require('../app');
const pool=require('../db');

function request(app, options) {
  return new Promise((resolve) => {
    const { method='GET', path='/', body=null, headers={} }=options;

    const payload=body !== null ? JSON.stringify(body) : null;
    const reqHeaders={
      'host': 'localhost',
      ...headers,
    };
    if (payload !== null) {
      reqHeaders['content-type']='application/json';
      reqHeaders['content-length']=String(Buffer.byteLength(payload));
    }

    const req=new Readable({
      read() {},
    });
    req.method=method;
    req.url=path;
    req.headers=reqHeaders;

    const res=new http.ServerResponse(req);
    res.assignSocket({
      _writableState: {},
      cork() {},
      uncork() {},
      write() {},
      on() {},
      once() {},
      emit() {},
    });

    let responseData='';
    res.write=function (chunk) {
      if (chunk) responseData += chunk.toString();
      return true;
    };

    res.end=function (chunk) {
      if (chunk) responseData += chunk.toString();
      let json=null;
      try {
        json=JSON.parse(responseData);
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

async function runTests() {
  console.log('Running tests...');

  const originalQuery=pool.query;
  const executedQueries=[];

  const inMemoryAssignments=[
    { id: 1, title: 'Backend Lab', deadline: '2026-08-10', submitted: false },
    { id: 2, title: 'Express Lab', deadline: '2026-08-12', submitted: true },
  ];

  pool.query=async function (text, params) {
    executedQueries.push({ text: text.trim(), params });

    if (text.includes('INSERT INTO assignments')) {
      const newId=inMemoryAssignments.length + 1;
      const created={
        id: newId,
        title: params[0],
        deadline: params[1],
        submitted: false,
      };
      inMemoryAssignments.push(created);
      return { rows: [created] };
    }

    if (text.includes('SELECT') && text.includes('WHERE submitted = $1')) {
      const isSub=params[0];
      const rows=inMemoryAssignments
        .filter((a) => a.submitted === isSub)
        .sort((a, b) => b.id - a.id);
      return { rows };
    }

    if (text.includes('SELECT') && text.includes('ORDER BY id DESC')) {
      const rows=[...inMemoryAssignments].sort((a, b) => b.id - a.id);
      return { rows };
    }

    if (text.includes('UPDATE assignments') && text.includes('SET submitted = true')) {
      const id=params[0];
      const item=inMemoryAssignments.find((a) => a.id === id);
      if (item) {
        item.submitted=true;
        return { rows: [{ ...item }] };
      }
      return { rows: [] };
    }

    if (text.includes('DELETE FROM assignments')) {
      const id=params[0];
      const index=inMemoryAssignments.findIndex((a) => a.id === id);
      if (index !== -1) {
        const deleted=inMemoryAssignments.splice(index, 1)[0];
        return { rows: [deleted] };
      }
      return { rows: [] };
    }

    return { rows: [] };
  };

  try {
    const createRes=await request(app, {
      method: 'POST',
      path: '/assignments',
      body: {
        title: 'Node.js Architecture Lab',
        deadline: '2026-09-30',
      },
    });
    assert.strictEqual(createRes.status, 201);
    const createdData=createRes.json();
    assert.strictEqual(createdData.title, 'Node.js Architecture Lab');
    assert.strictEqual(createdData.deadline, '2026-09-30');
    assert.strictEqual(createdData.submitted, false);
    console.log('✓ POST /assignments passed');

    const invalidRes=await request(app, {
      method: 'POST',
      path: '/assignments',
      body: { title: '' },
    });
    assert.strictEqual(invalidRes.status, 400);
    console.log('✓ POST validation passed');

    const getRes=await request(app, {
      method: 'GET',
      path: '/assignments',
    });
    assert.strictEqual(getRes.status, 200);
    const list=getRes.json();
    assert(Array.isArray(list));
    for (let i=0; i < list.length - 1; i++) {
      assert(list[i].id >= list[i + 1].id);
    }
    console.log('✓ GET /assignments passed (newest first)');

    const getSubRes=await request(app, {
      method: 'GET',
      path: '/assignments?submitted=true',
    });
    assert.strictEqual(getSubRes.status, 200);
    const subList=getSubRes.json();
    assert(Array.isArray(subList));
    subList.forEach((item) => {
      assert.strictEqual(item.submitted, true);
    });
    console.log('✓ GET /assignments?submitted=true passed');

    const invalidQueryRes=await request(app, {
      method: 'GET',
      path: '/assignments?submitted=maybe',
    });
    assert.strictEqual(invalidQueryRes.status, 400);
    console.log('✓ GET query validation passed');

    const patchRes=await request(app, {
      method: 'PATCH',
      path: '/assignments/1',
    });
    assert.strictEqual(patchRes.status, 200);
    const patchedData=patchRes.json();
    assert.strictEqual(patchedData.id, 1);
    assert.strictEqual(patchedData.submitted, true);
    console.log('✓ PATCH /assignments/:id passed');

    const patchNotFoundRes=await request(app, {
      method: 'PATCH',
      path: '/assignments/9999',
    });
    assert.strictEqual(patchNotFoundRes.status, 404);
    assert.strictEqual(patchNotFoundRes.json().message, 'Assignment not found');

    const patchInvalidIdRes=await request(app, {
      method: 'PATCH',
      path: '/assignments/abc',
    });
    assert.strictEqual(patchInvalidIdRes.status, 400);

    const deleteRes=await request(app, {
      method: 'DELETE',
      path: '/assignments/1',
    });
    assert.strictEqual(deleteRes.status, 200);
    const deleteData=deleteRes.json();
    assert.strictEqual(deleteData.message, 'Assignment deleted successfully');
    assert.strictEqual(deleteData.assignment.id, 1);
    console.log('✓ DELETE /assignments/:id passed');

    const deleteNotFoundRes=await request(app, {
      method: 'DELETE',
      path: '/assignments/9999',
    });
    assert.strictEqual(deleteNotFoundRes.status, 404);
    assert.strictEqual(deleteNotFoundRes.json().message, 'Assignment not found');

    const deleteInvalidIdRes=await request(app, {
      method: 'DELETE',
      path: '/assignments/abc',
    });
    assert.strictEqual(deleteInvalidIdRes.status, 400);

    const notFoundRes=await request(app, {
      method: 'GET',
      path: '/random-unknown-route',
    });
    assert.strictEqual(notFoundRes.status, 404);
    assert.strictEqual(notFoundRes.json().message, 'Route not found');

    console.log('All tests passed!');
  } finally {
    pool.query=originalQuery;
  }
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}

module.exports={ runTests, request };
