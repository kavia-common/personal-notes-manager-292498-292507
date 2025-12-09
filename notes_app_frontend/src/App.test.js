import { render, screen } from '@testing-library/react';
import App from './App';

test('renders notes application', () => {
  render(<App />);
  const titleElement = screen.getByText(/Personal Notes/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders new note button', () => {
  render(<App />);
  const newNoteButton = screen.getByText(/New Note/i);
  expect(newNoteButton).toBeInTheDocument();
});
