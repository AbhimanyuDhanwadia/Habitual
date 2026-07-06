import axios from 'axios';
async function test() {
  try {
    const res = await axios.get('http://localhost:5001/api/todos');
    console.log(res.status);
  } catch(e) {
    console.log(e.response ? e.response.status : e.message);
  }
}
test();
