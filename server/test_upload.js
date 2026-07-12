const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  const form = new FormData();
  form.append('resumePdf', fs.createReadStream('dummy.pdf'));
  form.append('email', 'test2@example.com');
  form.append('name', 'Test User 2');
  
  try {
    const res = await axios.post('http://localhost:5001/api/candidates', form, {
      headers: form.getHeaders()
    });
    console.log(res.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
}
test();
