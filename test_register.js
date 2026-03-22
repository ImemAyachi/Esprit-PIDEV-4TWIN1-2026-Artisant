const http = require('http');

const data = JSON.stringify({
    companyName: 'Test Manufacturer',
    email: `test_manuf_${Date.now()}@test.com`,
    password: 'password123',
    phone: '12345678',
    role: 'manufacturer'
});

const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    let responseBody = '';
    res.on('data', (d) => responseBody += d);
    res.on('end', () => {
        try {
            const body = JSON.parse(responseBody);
            console.log('Result:', body.data?.user?.role || 'User not found');
        } catch (e) { console.log('Error parsing response'); }
    });
});
req.write(data);
req.end();
