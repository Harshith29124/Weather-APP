import { render, screen } from '@testing-library/react';
import App from './App';

test('renders weather app', () => {
  render(<App />);
  // App should render without crashing
  expect(document.querySelector('.app')).toBeInTheDocument();
});
