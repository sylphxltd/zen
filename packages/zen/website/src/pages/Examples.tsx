/**
 * Examples Page
 */

import { batch, computed, effect, signal } from '../../../src/index.js';
import { CodeBlock } from '../components/CodeBlock.js';

export function Examples() {
  const container = document.createElement('div');
  container.className = 'container';
  container.style.paddingTop = '48px';

  const h1 = document.createElement('h1');
  h1.textContent = 'Examples';
  h1.style.marginBottom = '48px';
  container.appendChild(h1);

  // Example 1: Todo List
  const todoSection = createExampleSection(
    'Todo List',
    'Full-featured todo app with add, remove, and filter.',
  );

  const todos = signal<Array<{ id: number; text: string; done: boolean }>>([]);
  const filter = signal<'all' | 'active' | 'completed'>('all');

  const filteredTodos = computed(() => {
    const allTodos = todos.value;
    switch (filter.value) {
      case 'active':
        return allTodos.filter((t) => !t.done);
      case 'completed':
        return allTodos.filter((t) => t.done);
      default:
        return allTodos;
    }
  });

  const todoDemo = document.createElement('div');
  todoDemo.style.background = 'var(--bg-light)';
  todoDemo.style.border = '1px solid var(--border)';
  todoDemo.style.borderRadius = '12px';
  todoDemo.style.padding = '24px';

  // Input
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Add todo...';
  input.style.width = '100%';
  input.style.padding = '12px';
  input.style.marginBottom = '16px';
  input.style.background = 'var(--bg)';
  input.style.border = '1px solid var(--border)';
  input.style.borderRadius = '6px';
  input.style.color = 'var(--text)';

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-primary';
  addBtn.textContent = 'Add';
  addBtn.style.width = '100%';
  addBtn.style.marginBottom = '16px';

  addBtn.onclick = () => {
    if (input.value.trim()) {
      todos.value = [
        ...todos.value,
        {
          id: Date.now(),
          text: input.value,
          done: false,
        },
      ];
      input.value = '';
    }
  };

  // Filter buttons
  const filterBtns = document.createElement('div');
  filterBtns.style.display = 'flex';
  filterBtns.style.gap = '8px';
  filterBtns.style.marginBottom = '16px';

  ['all', 'active', 'completed'].forEach((f) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.textContent = f.charAt(0).toUpperCase() + f.slice(1);
    btn.style.flex = '1';

    effect(() => {
      btn.style.borderColor = filter.value === f ? 'var(--primary)' : 'var(--border)';
    });

    btn.onclick = () => (filter.value = f as any);
    filterBtns.appendChild(btn);
  });

  // Todo list
  const todoList = document.createElement('div');
  todoList.style.display = 'flex';
  todoList.style.flexDirection = 'column';
  todoList.style.gap = '8px';

  effect(() => {
    todoList.innerHTML = '';
    filteredTodos.value.forEach((todo) => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '12px';
      item.style.padding = '12px';
      item.style.background = 'var(--bg)';
      item.style.borderRadius = '6px';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.done;
      checkbox.onchange = () => {
        todos.value = todos.value.map((t) =>
          t.id === todo.id ? { ...t, done: checkbox.checked } : t,
        );
      };

      const text = document.createElement('span');
      text.textContent = todo.text;
      text.style.flex = '1';
      text.style.textDecoration = todo.done ? 'line-through' : 'none';
      text.style.color = todo.done ? 'var(--text-muted)' : 'var(--text)';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-secondary';
      deleteBtn.textContent = '×';
      deleteBtn.style.padding = '4px 12px';
      deleteBtn.onclick = () => {
        todos.value = todos.value.filter((t) => t.id !== todo.id);
      };

      item.appendChild(checkbox);
      item.appendChild(text);
      item.appendChild(deleteBtn);
      todoList.appendChild(item);
    });

    if (filteredTodos.value.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No todos';
      empty.style.textAlign = 'center';
      empty.style.padding = '24px';
      empty.style.color = 'var(--text-muted)';
      todoList.appendChild(empty);
    }
  });

  todoDemo.appendChild(input);
  todoDemo.appendChild(addBtn);
  todoDemo.appendChild(filterBtns);
  todoDemo.appendChild(todoList);

  todoSection.appendChild(todoDemo);
  container.appendChild(todoSection);

  // Example 2: Form Validation
  const formSection = createExampleSection(
    'Form Validation',
    'Real-time validation with computed errors.',
  );

  const email = signal('');
  const password = signal('');

  const emailError = computed(() => {
    const val = email.value;
    if (!val) return '';
    if (!val.includes('@')) return 'Invalid email';
    return '';
  });

  const passwordError = computed(() => {
    const val = password.value;
    if (!val) return '';
    if (val.length < 8) return 'Password must be at least 8 characters';
    return '';
  });

  const isValid = computed(() => {
    return email.value && password.value && !emailError.value && !passwordError.value;
  });

  const formDemo = document.createElement('div');
  formDemo.style.background = 'var(--bg-light)';
  formDemo.style.border = '1px solid var(--border)';
  formDemo.style.borderRadius = '12px';
  formDemo.style.padding = '24px';

  // Email input
  const emailLabel = document.createElement('label');
  emailLabel.textContent = 'Email';
  emailLabel.style.display = 'block';
  emailLabel.style.marginBottom = '8px';
  emailLabel.style.fontWeight = '600';

  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.placeholder = 'your@email.com';
  emailInput.style.width = '100%';
  emailInput.style.padding = '12px';
  emailInput.style.marginBottom = '4px';
  emailInput.style.background = 'var(--bg)';
  emailInput.style.border = '1px solid var(--border)';
  emailInput.style.borderRadius = '6px';
  emailInput.style.color = 'var(--text)';
  emailInput.oninput = () => (email.value = emailInput.value);

  const emailErrorDiv = document.createElement('div');
  emailErrorDiv.style.color = 'var(--error)';
  emailErrorDiv.style.fontSize = '14px';
  emailErrorDiv.style.marginBottom = '16px';
  emailErrorDiv.style.minHeight = '20px';
  effect(() => {
    emailErrorDiv.textContent = emailError.value;
  });

  // Password input
  const passwordLabel = document.createElement('label');
  passwordLabel.textContent = 'Password';
  passwordLabel.style.display = 'block';
  passwordLabel.style.marginBottom = '8px';
  passwordLabel.style.fontWeight = '600';

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.placeholder = '••••••••';
  passwordInput.style.width = '100%';
  passwordInput.style.padding = '12px';
  passwordInput.style.marginBottom = '4px';
  passwordInput.style.background = 'var(--bg)';
  passwordInput.style.border = '1px solid var(--border)';
  passwordInput.style.borderRadius = '6px';
  passwordInput.style.color = 'var(--text)';
  passwordInput.oninput = () => (password.value = passwordInput.value);

  const passwordErrorDiv = document.createElement('div');
  passwordErrorDiv.style.color = 'var(--error)';
  passwordErrorDiv.style.fontSize = '14px';
  passwordErrorDiv.style.marginBottom = '16px';
  passwordErrorDiv.style.minHeight = '20px';
  effect(() => {
    passwordErrorDiv.textContent = passwordError.value;
  });

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary';
  submitBtn.textContent = 'Submit';
  submitBtn.style.width = '100%';
  effect(() => {
    submitBtn.disabled = !isValid.value;
    submitBtn.style.opacity = isValid.value ? '1' : '0.5';
    submitBtn.style.cursor = isValid.value ? 'pointer' : 'not-allowed';
  });

  submitBtn.onclick = () => {
    if (isValid.value) {
      alert('Form submitted!');
    }
  };

  formDemo.appendChild(emailLabel);
  formDemo.appendChild(emailInput);
  formDemo.appendChild(emailErrorDiv);
  formDemo.appendChild(passwordLabel);
  formDemo.appendChild(passwordInput);
  formDemo.appendChild(passwordErrorDiv);
  formDemo.appendChild(submitBtn);

  formSection.appendChild(formDemo);
  container.appendChild(formSection);

  // Example 3: Batch Updates
  const batchSection = createExampleSection(
    'Batch Updates',
    'Update multiple signals efficiently with batch().',
  );

  const batchCode = CodeBlock({
    code: `import { signal, effect, batch } from 'zenjs';

const firstName = signal('John');
const lastName = signal('Doe');

let updates = 0;
effect(() => {
  console.log(\`\${firstName.value} \${lastName.value}\`);
  updates++;
});

// Without batch: triggers effect twice
firstName.value = 'Jane';
lastName.value = 'Smith';
// updates = 3 (initial + 2 updates)

// With batch: triggers effect once
batch(() => {
  firstName.value = 'Bob';
  lastName.value = 'Johnson';
});
// updates = 4 (only 1 more update)`,
    language: 'typescript',
  });

  batchSection.appendChild(batchCode);
  container.appendChild(batchSection);

  return container;
}

function createExampleSection(title: string, description: string) {
  const section = document.createElement('section');
  section.style.marginBottom = '64px';

  const h2 = document.createElement('h2');
  h2.textContent = title;
  h2.style.fontSize = '32px';
  h2.style.marginBottom = '12px';
  h2.style.color = 'var(--primary)';

  const p = document.createElement('p');
  p.textContent = description;
  p.style.color = 'var(--text-muted)';
  p.style.marginBottom = '24px';

  section.appendChild(h2);
  section.appendChild(p);

  return section;
}
