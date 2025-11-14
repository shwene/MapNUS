// tests/pathUtils.test.js
import { processPath } from '../utils/pathUtils.js';

describe('Path Utils Unit Tests', () => {
  test('processPath should handle empty segments', () => {
    const mockPath = {
      segments: [],
      end: { properties: { Name: 'End' } }
    };
    
    const result = processPath(mockPath);

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
    expect(result.total_distance).toBe(0);
    expect(result.total_time_cost).toBe(0);
  });

  test('processPath should calculate correct totals', () => {
    const mockPath = {
      segments: [
        {
          start: { properties: { Name: 'A' } },
          end: { properties: { Name: 'B' } },
          relationship: {
            properties: {
              Distance: 10,
              Time_Cost: 5,
              Parent_Layer: 'L1',
              Heading: 'N',
              coordinates: []
            }
          }
        },
        {
          start: { properties: { Name: 'B' } },
          end: { properties: { Name: 'C' } },
          relationship: {
            properties: {
              Distance: 15,
              Time_Cost: 8,
              Parent_Layer: 'L1',
              Heading: 'E',
              coordinates: []
            }
          }
        }
      ],
      end: { properties: { Name: 'C' } }
    };
    
    const result = processPath(mockPath);
    expect(result.total_distance).toBe(25);
    expect(result.total_time_cost).toBe(13);
    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);
  });
});

describe('Path Utils Extended Tests', () => {
  test('handles undefined Parent_Layer and Heading defaults', () => {
    const mockPath = {
      segments: [
        {
          start: { properties: { Name: 'X' } },
          end: { properties: { Name: 'Y' } },
          relationship: {
            properties: {
              Distance: 5,
              Time_Cost: 2,
              // Parent_Layer and Heading intentionally missing
              coordinates: []
            }
          }
        }
      ],
      end: { properties: { Name: 'Y' } }
    };

    const result = processPath(mockPath);
    expect(result.total_distance).toBe(5);
    expect(result.total_time_cost).toBe(2);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges[0].layer).toBe('Unknown'); // default triggered
    expect(result.edges[0].heading).toBe('N'); // default triggered
  });

  test('getDirection handles Up, Down, Lift', () => {
    const mockPath = {
      segments: [
        {
          start: { properties: { Name: 'A' } },
          end: { properties: { Name: 'B' } },
          relationship: {
            properties: {
              Distance: 1,
              Time_Cost: 1,
              Parent_Layer: 'L1',
              Heading: 'U',
              coordinates: []
            }
          }
        },
        {
          start: { properties: { Name: 'B' } },
          end: { properties: { Name: 'C' } },
          relationship: {
            properties: {
              Distance: 1,
              Time_Cost: 1,
              Parent_Layer: 'L1',
              Heading: 'D',
              coordinates: []
            }
          }
        },
        {
          start: { properties: { Name: 'C' } },
          end: { properties: { Name: 'D' } },
          relationship: {
            properties: {
              Distance: 1,
              Time_Cost: 1,
              Parent_Layer: 'L1',
              Heading: 'L',
              coordinates: []
            }
          }
        },
        {
          start: { properties: { Name: 'D' } },
          end: { properties: { Name: 'E' } },
          relationship: {
            properties: {
              Distance: 1,
              Time_Cost: 1,
              Parent_Layer: 'L1',
              Heading: 'N',
              coordinates: []
            }
          }
        }
      ],
      end: { properties: { Name: 'E' } }
    };

    const result = processPath(mockPath);

    // Validate coverage-triggering branches
    const directions = result.edges.map(e => e.direction);
    expect(directions).toContain('Go Up');
    expect(directions).toContain('Go Down');
    expect(directions).toContain('Take Lift');
    expect(directions).toContain('Go Straight'); // fallback for unknown heading
  });
});
