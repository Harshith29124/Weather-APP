# Design Document: Weather App Improvements

## Overview

This design addresses comprehensive improvements to the weather app codebase across multiple dimensions: code quality, testing infrastructure, error handling, accessibility, performance optimization, and documentation accuracy. The improvements will transform the existing monolithic App.js into a well-structured, maintainable, and production-ready application.

The design follows a modular architecture pattern, separating concerns into distinct layers: presentation components, business logic, API services, and utilities. This separation enables better testability, maintainability, and scalability.

## Architecture

### High-Level Structure

```
src/
├── components/           # React components
│   ├── ErrorBoundary.jsx
│   ├── CurrentView.jsx
│   ├── HistoricalView.jsx
│   ├── MarineView.jsx
│   ├── SearchModal.jsx
│   └── LoadingSpinner.jsx
├── services/            # API and external services
│   ├── weatherApi.js
│   └── cacheService.js
├── utils/               # Utility functions
│   ├── weatherUtils.js
│   ├── validation.js
│   └── errorLogger.js
├── constants/           # Configuration and constants
│   └── config.js
├── hooks/               # Custom React hooks
│   └── useWeatherData.js
└── App.js              # Main application component
```

### Component Hierarchy

```
App (Error Boundary wrapped)
├── Header
│   ├── LocationButton
│   └── SearchButton
├── TabNavigation
├── ContentArea
│   ├── CurrentView
│   ├── HistoricalView
│   └── MarineView
└── SearchModal
```

## Components and Interfaces

### 1. Error Boundary Component

**Purpose:** Catch and handle React component errors gracefully

**Interface:**
```javascript
<ErrorBoundary
  fallback={(error, resetError) => <ErrorFallback error={error} onReset={resetError} />}
  onError={(error, errorInfo) => logError(error, errorInfo)}
>
  {children}
</ErrorBoundary>
```

**State:**
- `hasError: boolean` - Whether an error has been caught
- `error: Error | null` - The caught error object

**Methods:**
- `componentDidCatch(error, errorInfo)` - Logs error details
- `resetError()` - Resets error state to retry rendering

### 2. Weather API Service

**Purpose:** Centralize all API calls with error handling and retry logic

**Interface:**
```javascript
// weatherApi.js
export const weatherApi = {
  fetchCurrentWeather(lat, lon, options),
  fetchHistoricalWeather(lat, lon, startDate, endDate, options),
  fetchMarineWeather(lat, lon, options),
  searchLocation(query, options)
}
```

**Features:**
- Automatic retry with exponential backoff (3 attempts)
- Request timeout configuration (10 seconds default)
- Response validation
- Error normalization

**Error Handling:**
```javascript
try {
  const response = await axios.get(url, { timeout: 10000, ...config });
  validateResponse(response);
  return response.data;
} catch (error) {
  if (error.response) {
    // Server responded with error status
    throw new ApiError(error.response.status, error.response.data);
  } else if (error.request) {
    // Request made but no response
    throw new NetworkError('No response from server');
  } else {
    // Request setup error
    throw new RequestError(error.message);
  }
}
```

### 3. Input Validation Module

**Purpose:** Sanitize and validate all user inputs

**Interface:**
```javascript
// validation.js
export const validation = {
  sanitizeSearchQuery(input),
  validateCoordinates(lat, lon),
  validateDateRange(startDate, endDate),
  isValidSearchInput(input)
}
```

**Validation Rules:**
- Search query: 1-100 characters, trim whitespace, escape HTML
- Coordinates: lat [-90, 90], lon [-180, 180]
- Date range: start <= end, not in future

**Sanitization:**
```javascript
function sanitizeSearchQuery(input) {
  // Remove leading/trailing whitespace
  let sanitized = input.trim();
  
  // Limit length
  sanitized = sanitized.substring(0, 100);
  
  // Escape HTML special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return sanitized;
}
```

### 4. Loading State Management

**Purpose:** Provide consistent loading indicators across all async operations

**Interface:**
```javascript
// Custom hook
function useLoadingState(initialState = false) {
  const [loading, setLoading] = useState(initialState);
  const [error, setError] = useState(null);
  
  const withLoading = async (asyncFn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { loading, error, withLoading };
}
```

**Loading States:**
- `weatherLoading` - Current weather fetch
- `historicalLoading` - Historical data fetch
- `marineLoading` - Marine data fetch
- `searchLoading` - Location search

### 5. Accessibility Enhancements

**ARIA Labels:**
```javascript
// Search button
<button
  aria-label="Search for a location"
  aria-expanded={showSearch}
  onClick={() => setShowSearch(true)}
>
  <Search size={20} />
</button>

// Tab navigation
<button
  role="tab"
  aria-selected={activeView === 'current'}
  aria-controls="current-panel"
  onClick={() => setActiveView('current')}
>
  Current
</button>

// Weather data
<div role="region" aria-label="Current weather information">
  <div aria-label={`Temperature: ${temp} degrees Celsius`}>
    {temp}°C
  </div>
</div>
```

**Keyboard Navigation:**
- Tab key: Navigate through interactive elements
- Enter/Space: Activate buttons
- Escape: Close modals
- Arrow keys: Navigate tabs

**Focus Management:**
```javascript
// Trap focus in modal
useEffect(() => {
  if (showSearch) {
    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, input, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    firstElement.focus();
    
    const handleTab = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }
}, [showSearch]);
```

### 6. Performance Optimizations

**Memoization Strategy:**
```javascript
// Memoize expensive computations
const hourlyForecast = useMemo(() => {
  return hourly.time.slice(0, 24).map((time, index) => ({
    time,
    hour: new Date(time),
    weatherCode: hourly.weather_code[index],
    isDay: hourly.is_day[index],
    temp: hourly.temperature_2m[index],
    precipitation: hourly.precipitation_probability[index]
  }));
}, [hourly.time, hourly.weather_code, hourly.is_day, 
    hourly.temperature_2m, hourly.precipitation_probability]);

// Memoize callbacks
const handleSearch = useCallback((e) => {
  e.preventDefault();
  searchLocation(searchInput);
}, [searchInput]);

// Memoize components
const CurrentView = React.memo(({ data, location, getWeatherIcon, getWeatherDescription }) => {
  // Component implementation
});
```

**Code Splitting:**
```javascript
// Lazy load view components
const CurrentView = lazy(() => import('./components/CurrentView'));
const HistoricalView = lazy(() => import('./components/HistoricalView'));
const MarineView = lazy(() => import('./components/MarineView'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <CurrentView data={weatherData} />
</Suspense>
```

### 7. Configuration Management

**Environment Variables:**
```javascript
// .env.example
REACT_APP_GEOCODING_URL=https://geocoding-api.open-meteo.com/v1/search
REACT_APP_WEATHER_URL=https://api.open-meteo.com/v1/forecast
REACT_APP_MARINE_URL=https://marine-api.open-meteo.com/v1/marine
REACT_APP_API_TIMEOUT=10000
REACT_APP_RETRY_ATTEMPTS=3
```

**Configuration Module:**
```javascript
// constants/config.js
export const config = {
  api: {
    geocodingUrl: process.env.REACT_APP_GEOCODING_URL,
    weatherUrl: process.env.REACT_APP_WEATHER_URL,
    marineUrl: process.env.REACT_APP_MARINE_URL,
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000'),
    retryAttempts: parseInt(process.env.REACT_APP_RETRY_ATTEMPTS || '3')
  },
  cache: {
    weatherTTL: 10 * 60 * 1000, // 10 minutes
    locationTTL: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Validate configuration on startup
export function validateConfig() {
  const required = ['geocodingUrl', 'weatherUrl', 'marineUrl'];
  const missing = required.filter(key => !config.api[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}
```

### 8. Offline Support and Caching

**Cache Service:**
```javascript
// services/cacheService.js
class CacheService {
  constructor() {
    this.cache = new Map();
  }
  
  set(key, value, ttl) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  has(key) {
    return this.get(key) !== null;
  }
  
  clear() {
    this.cache.clear();
  }
}

export const cacheService = new CacheService();
```

**Service Worker Registration:**
```javascript
// index.js
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Register service worker for offline support
serviceWorkerRegistration.register({
  onSuccess: () => console.log('Service worker registered'),
  onUpdate: (registration) => {
    // Notify user of available update
    if (window.confirm('New version available! Reload to update?')) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
});
```

### 9. Error Logging

**Error Logger Module:**
```javascript
// utils/errorLogger.js
class ErrorLogger {
  log(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorData);
    }
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(errorData);
    }
    
    // Store locally for debugging
    this.storeLocally(errorData);
  }
  
  logApiError(error, endpoint, params) {
    this.log(error, {
      type: 'API_ERROR',
      endpoint,
      params,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
  }
  
  storeLocally(errorData) {
    try {
      const errors = JSON.parse(localStorage.getItem('errorLog') || '[]');
      errors.push(errorData);
      // Keep only last 50 errors
      const recentErrors = errors.slice(-50);
      localStorage.setItem('errorLog', JSON.stringify(recentErrors));
    } catch (e) {
      console.error('Failed to store error locally:', e);
    }
  }
  
  sendToMonitoring(errorData) {
    // Placeholder for monitoring service integration
    // e.g., Sentry, LogRocket, etc.
  }
}

export const errorLogger = new ErrorLogger();
```

## Data Models

### Weather Data Structure

```javascript
// Current weather response
interface CurrentWeather {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: 0 | 1;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  pressure_msl: number;
  visibility: number;
}

// Hourly forecast
interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  is_day: (0 | 1)[];
  precipitation_probability: number[];
}

// Daily forecast
interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
  uv_index_max: number[];
}

// Complete weather response
interface WeatherResponse {
  current: CurrentWeather;
  hourly: HourlyForecast;
  daily: DailyForecast;
  timezone: string;
}
```

### Location Data Structure

```javascript
interface Location {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  admin1?: string;
}

interface LocationSearchResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}
```

### Error Data Structure

```javascript
class ApiError extends Error {
  constructor(status, data) {
    super(`API Error: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

class ValidationError extends Error {
  constructor(field, message) {
    super(`Validation Error: ${field} - ${message}`);
    this.name = 'ValidationError';
    this.field = field;
  }
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Error Boundary Catches All Component Errors

*For any* React component error, the Error Boundary should catch the error, display a fallback UI, and log the error without crashing the application.

**Validates: Requirements 3.1**

### Property 2: API Failures Display User-Friendly Messages

*For any* API call failure (network error, timeout, or server error), the application should display a user-friendly error message and not expose technical details to the user.

**Validates: Requirements 3.2**

### Property 3: Failed Requests Retry with Exponential Backoff

*For any* network error during an API call, the application should retry the request up to 3 times with exponentially increasing delays (1s, 2s, 4s) before failing.

**Validates: Requirements 3.3**

### Property 4: Multiple Errors Are Handled Independently

*For any* combination of simultaneous errors (e.g., weather fetch fails while marine fetch succeeds), each error should be handled independently without affecting other operations.

**Validates: Requirements 3.6**

### Property 5: Search Input Sanitization Prevents XSS

*For any* user input containing HTML special characters or script tags, the sanitization function should escape all dangerous characters and prevent XSS attacks.

**Validates: Requirements 4.1**

### Property 6: Empty or Whitespace-Only Input Is Rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), the validation function should reject it as invalid input.

**Validates: Requirements 4.2**

### Property 7: Input Length Is Limited

*For any* user input exceeding 100 characters, the application should truncate it to 100 characters before processing.

**Validates: Requirements 4.3**

### Property 8: Invalid Coordinates Are Rejected

*For any* coordinate pair where latitude is outside [-90, 90] or longitude is outside [-180, 180], the validation function should reject them and return an error.

**Validates: Requirements 4.4**

### Property 9: Special Characters Are Handled Safely

*For any* input string containing special characters (quotes, brackets, symbols), the application should handle them without throwing errors or breaking functionality.

**Validates: Requirements 4.5**

### Property 10: Interactive Elements Have ARIA Labels

*For any* interactive element (button, input, link) in the application, it should have either an aria-label, aria-labelledby, or descriptive text content for screen readers.

**Validates: Requirements 5.1, 5.5**

### Property 11: Keyboard Navigation Works for All Interactive Elements

*For any* interactive element in the application, it should be reachable and activatable using only keyboard navigation (Tab, Enter, Space, Arrow keys).

**Validates: Requirements 5.2**

### Property 12: Focus Indicators Are Visible

*For any* focusable element, when it receives focus, it should display a visible focus indicator (outline, border, or background change).

**Validates: Requirements 5.3**

### Property 13: Dynamic Content Changes Are Announced

*For any* dynamic content update (loading complete, error message, data refresh), the change should be announced to screen readers via aria-live regions.

**Validates: Requirements 5.4**

### Property 14: Loading Indicators Are Removed on Completion

*For any* asynchronous operation (API call, data processing), when the operation completes (success or failure), the loading indicator should be removed.

**Validates: Requirements 6.4, 6.5**

### Property 15: API Responses Are Cached with TTL

*For any* successful API response, the data should be cached with an appropriate time-to-live (10 minutes for weather, 24 hours for locations).

**Validates: Requirements 9.2**

### Property 16: Cached Data Is Served When Offline

*For any* API request made while offline, if cached data exists and hasn't expired, it should be served to the user.

**Validates: Requirements 9.3**

### Property 17: Stale Cache Is Indicated to User

*For any* cached data displayed to the user, if the cache is older than 5 minutes, a visual indicator should inform the user that the data may be stale.

**Validates: Requirements 9.4**

### Property 18: Cache Refreshes When Coming Online

*For any* cached data, when the application detects the user has come back online, it should refresh the cache in the background.

**Validates: Requirements 9.5**

### Property 19: Errors Are Logged with Context

*For any* error that occurs in the application, it should be logged with sufficient context including timestamp, error message, stack trace, and user context.

**Validates: Requirements 11.1, 11.3, 11.4**

### Property 20: API Errors Include Endpoint Details

*For any* API call failure, the error log should include the endpoint URL, HTTP method, status code, and request parameters.

**Validates: Requirements 11.2**

### Property 21: Error Severity Is Categorized

*For any* logged error, it should be categorized by severity (critical, error, warning, info) to enable proper filtering and alerting.

**Validates: Requirements 11.5**

### Property 22: Components Validate Prop Types

*For any* component that receives props, it should have PropTypes defined (or TypeScript types) that validate the shape and type of all props.

**Validates: Requirements 13.1, 13.3**

### Property 23: API Responses Are Validated

*For any* API response received, the application should validate that the response contains the expected fields and data types before using the data.

**Validates: Requirements 13.2**

### Property 24: Optional Props Have Default Values

*For any* component with optional props, default values should be provided via defaultProps (or TypeScript default parameters) to prevent undefined errors.

**Validates: Requirements 13.4**

## Error Handling

### Error Categories

1. **Network Errors**: Connection failures, timeouts, DNS errors
   - Retry with exponential backoff
   - Display "Connection problem" message
   - Serve cached data if available

2. **API Errors**: 4xx and 5xx HTTP responses
   - 400: "Invalid request" - check input validation
   - 404: "Location not found" - suggest alternative searches
   - 429: "Too many requests" - implement rate limiting
   - 500: "Server error" - retry after delay
   - 503: "Service unavailable" - show maintenance message

3. **Validation Errors**: Invalid user input
   - Display inline error messages
   - Highlight invalid fields
   - Provide correction suggestions

4. **Component Errors**: React rendering errors
   - Caught by Error Boundary
   - Display fallback UI with retry option
   - Log error details for debugging

### Error Recovery Strategies

**Automatic Recovery:**
- Retry failed API calls (3 attempts)
- Fall back to cached data
- Graceful degradation (hide unavailable features)

**User-Initiated Recovery:**
- "Try Again" button in error states
- "Refresh" option for stale data
- "Reset" option in Error Boundary

**Error Prevention:**
- Input validation before API calls
- Debounce search input (300ms)
- Cancel pending requests on unmount
- Validate environment variables on startup

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests:**
- Specific examples and edge cases
- Component rendering and interaction
- API mocking and error scenarios
- Integration between components
- Accessibility compliance checks

**Property-Based Tests:**
- Universal properties across all inputs
- Input validation with random data
- Error handling with various failure modes
- Cache behavior with different TTLs
- Type validation with generated data

### Testing Tools

**Unit Testing:**
- Jest: Test runner and assertion library
- React Testing Library: Component testing
- @testing-library/user-event: User interaction simulation
- axios-mock-adapter: API mocking
- jest-axe: Accessibility testing

**Property-Based Testing:**
- fast-check: Property-based testing library for JavaScript
- Minimum 100 iterations per property test
- Custom generators for domain-specific data

### Test Organization

```
src/
├── components/
│   ├── ErrorBoundary.jsx
│   ├── ErrorBoundary.test.jsx
│   ├── CurrentView.jsx
│   └── CurrentView.test.jsx
├── services/
│   ├── weatherApi.js
│   ├── weatherApi.test.js
│   ├── weatherApi.property.test.js
│   └── cacheService.test.js
├── utils/
│   ├── validation.js
│   ├── validation.test.js
│   └── validation.property.test.js
└── App.test.js
```

### Property Test Configuration

Each property test must:
1. Run minimum 100 iterations
2. Reference the design document property
3. Use descriptive test names
4. Include shrinking for failure cases

**Example Property Test:**
```javascript
// validation.property.test.js
import fc from 'fast-check';
import { sanitizeSearchQuery } from './validation';

describe('Property Tests: Input Validation', () => {
  test('Feature: weather-app-improvements, Property 5: Search Input Sanitization Prevents XSS', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (input) => {
          const sanitized = sanitizeSearchQuery(input);
          // XSS characters should be escaped
          expect(sanitized).not.toContain('<script>');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toMatch(/<[^>]*>/);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Feature: weather-app-improvements, Property 6: Empty or Whitespace-Only Input Is Rejected', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')),
        (whitespace) => {
          const result = isValidSearchInput(whitespace);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Feature: weather-app-improvements, Property 7: Input Length Is Limited', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 101 }),
        (longInput) => {
          const sanitized = sanitizeSearchQuery(longInput);
          expect(sanitized.length).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Examples

**Component Test:**
```javascript
// CurrentView.test.jsx
import { render, screen } from '@testing-library/react';
import CurrentView from './CurrentView';

describe('CurrentView', () => {
  const mockData = {
    current: {
      temperature_2m: 25,
      weather_code: 0,
      is_day: 1,
      // ... other fields
    },
    hourly: { /* ... */ },
    daily: { /* ... */ }
  };

  test('displays current temperature', () => {
    render(<CurrentView data={mockData} location={{ name: 'Test City' }} />);
    expect(screen.getByText(/25°C/)).toBeInTheDocument();
  });

  test('displays location name', () => {
    render(<CurrentView data={mockData} location={{ name: 'Test City' }} />);
    expect(screen.getByText('Test City')).toBeInTheDocument();
  });
});
```

**API Service Test:**
```javascript
// weatherApi.test.js
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { weatherApi } from './weatherApi';

describe('Weather API Service', () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  test('fetches current weather successfully', async () => {
    const mockResponse = { current: { temperature_2m: 25 } };
    mock.onGet(/forecast/).reply(200, mockResponse);

    const result = await weatherApi.fetchCurrentWeather(40.7, -74.0);
    expect(result).toEqual(mockResponse);
  });

  test('retries on network error', async () => {
    mock.onGet(/forecast/).networkErrorOnce().reply(200, { current: {} });

    const result = await weatherApi.fetchCurrentWeather(40.7, -74.0);
    expect(result).toBeDefined();
    expect(mock.history.get.length).toBe(2); // Initial + 1 retry
  });

  test('throws error after max retries', async () => {
    mock.onGet(/forecast/).networkError();

    await expect(
      weatherApi.fetchCurrentWeather(40.7, -74.0)
    ).rejects.toThrow('Network error');
  });
});
```

**Accessibility Test:**
```javascript
// App.test.js
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from './App';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  test('has no accessibility violations', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Test Coverage Goals

- **Overall Coverage**: Minimum 80%
- **Critical Paths**: 100% (API calls, error handling, validation)
- **Components**: Minimum 80%
- **Utilities**: 100%
- **Services**: 100%

### Continuous Integration

Tests should run on:
- Every commit (pre-commit hook)
- Pull requests (CI pipeline)
- Before deployment (production gate)

**CI Configuration:**
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --coverage
      - run: npm run test:a11y
```
