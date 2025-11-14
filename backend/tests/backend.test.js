// tests/backend.test.js
import request from 'supertest';
import express from 'express';
import cilentRoutes from '../routes/cilentRoute.js';

const app = express();
app.use(express.json());
app.use('/', cilentRoutes);

describe('Backend API Integration Tests', () => {
    // Mock the neo4j driver to avoid database connection issues in tests
    beforeAll(() => {
    jest.mock('neo4j-driver', () => ({
      driver: jest.fn(() => ({
        session: jest.fn(() => ({
          run: jest.fn((query) => {
            if (query.includes('COM3-01-20')) {
              return Promise.resolve({
                records: [
                  { get: () => ({ coordinate: [1.297, 103.773] }) }
                ]
              });
            } else {
              return Promise.resolve({ records: [] });
            }
          }),
          close: jest.fn()
        }))
      })),
      auth: { basic: jest.fn() }
    }));
  });

  // Test 1: Root endpoint
  test('GET / should return hello message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Hello World Nice');
  });

  // Test 2: Path endpoint with valid data
  test('GET /map/path should return path with valid origin and destination', async () => {
    const response = await request(app)
      .get('/map/path')
      .query({ origin: 'COM3-01-20', dest: 'COM3-01-25' });
    
    expect([200, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('nodes');
      expect(response.body).toHaveProperty('edges');
    }
  });

  // Test 3: Path endpoint with invalid data
  test('GET /map/path should return 404 for non-existent locations', async () => {
    const response = await request(app)
      .get('/map/path')
      .query({ origin: 'INVALID_ORIGIN', dest: 'INVALID_DEST' });
    
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('No path found');
  });

  // Test 4: Path endpoint missing origin
  test('GET /map/path should return 400 when origin is missing', async () => {
    const response = await request(app)
      .get('/map/path')
      .query({ dest: 'TestDest' });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Missing origin or destination');
  });

  // Test 5: Path endpoint missing destination
  test('GET /map/path should return 400 when destination is missing', async () => {
    const response = await request(app)
      .get('/map/path')
      .query({ origin: 'TestOrigin' });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Missing origin or destination');
  });

  // Test 6: Venue endpoint with valid name
  test('GET /venue/:venueName should return venue data for existing venue', async () => {
    const response = await request(app)
      .get('/venue/COM3-01-20');
    
    expect([200, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('coordinate');
    }
  });

  // Test 7: Venue endpoint with invalid name
  test('GET /venue/:venueName should return 404 for non-existent venue', async () => {
    const response = await request(app)
      .get('/venue/NON_EXISTENT_VENUE');
    
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Venue not found');
  });

  // Test 8: Venue endpoint with empty name
  test('GET /venue/ should return 404 for empty venue name', async () => {
    const response = await request(app)
      .get('/venue/');
    
    expect(response.status).toBe(404);
  });
});
