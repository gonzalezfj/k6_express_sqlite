import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50, // Number of virtual users
  duration: '30s', // Test duration
};

export default function () {
  const baseUrl = 'http://localhost:3005';
  
  for (let i = 0; i < 100; i++) { // Each VU will create 100 items, with 50 VUs = 5000 items
    const payload = JSON.stringify({
      name: `Test Item ${i}`,
      description: `Test Description for item ${i}`
    });
    
    let response = http.post(http.url`${baseUrl}/items`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    const createSuccess = check(response, {
      'create item returns 200': (r) => r.status === 200,
      'create item returns id': (r) => JSON.parse(r.body).id !== undefined,
    });

    // // Only proceed with other operations if create was successful
    if (createSuccess) {
      const createdId = JSON.parse(response.body).id;
      response = http.get(http.url`${baseUrl}/items/${createdId}`);
      check(response, {
        'get created item returns 200': (r) => r.status === 200,
        'get created item returns correct id': (r) => JSON.parse(r.body).id === createdId,
      });

      // Only update and delete 30% of items
      if (i % 5 === 0) {
        // Update item 
        const updatePayload = JSON.stringify({
          name: `Updated Item ${i}`,
          description: `Updated Description for item ${i}`
        });
        const updateResponse = http.put(http.url`${baseUrl}/items/${createdId}`, updatePayload, {
          headers: { 'Content-Type': 'application/json' },
        });
        check(updateResponse, {
          'update item returns 200': (r) => r.status === 200,
          'update item returns correct id': (r) => JSON.parse(r.body).id === createdId,
          'update item returns updated data': (r) => JSON.parse(r.body).name === `Updated Item ${i}`,
        });

        // Delete item 
        const deleteResponse = http.del(http.url`${baseUrl}/items/${createdId}`);
        check(deleteResponse, {
          'delete item returns 200': (r) => r.status === 200,
          'delete returns success message': (r) => JSON.parse(r.body).message === 'Item deleted',
        });
      }
    }
  }

  // Test GET all items to verify operations
  // let response = http.get(http.url`${baseUrl}/items`);
  // check(response, {
  //   'get all items returns 200': (r) => r.status === 200,
  //   'get all items returns array': (r) => Array.isArray(JSON.parse(r.body).items),
  // });

  sleep(1); // Wait 1 second between iterations
}
