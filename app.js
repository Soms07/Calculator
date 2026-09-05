const expressionEl = document.querySelector('#expression');
const resultEl = document.querySelector('#result');
const historyList = document.querySelector('#historyList');
let expression = '';
let lastAnswer = 0;
let angleUnit = 'DEG';
let history = [];


const symbols = {
  '×': '*',
  '÷': '/',
  '−': '-',
  'π': 'PI',
  ans: 'ANS',
  '^': '**'
};


function render() {
  expressionEl.textContent = expression || 'Ready when you are';
  resultEl.textContent = expression ? resultEl.textContent : '0';
}

function factorial(value) {
  if (value < 0 || value > 170 || value % 1) {
    throw new Error('Invalid factorial');
  }

  let total = 1;
  for (let i = 2; i <= value; i += 1) {
    total *= i;
  }

  return total;
}

function evaluate(value) {
  let parsed = value
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replaceAll('π', 'PI')
    .replaceAll('ans', 'ANS')
    .replaceAll('^', '**');

  parsed = parsed
    .replace(/(\d+(?:\.\d+)?)%/g, '($1/100)')
    .replace(/(\d+(?:\.\d+)?)!/g, 'factorial($1)');

  const deg = (n) => angleUnit === 'DEG' ? n * Math.PI / 180 : n;
  const inverseDeg = (n) => angleUnit === 'DEG' ? n * 180 / Math.PI : n;
  const funcs = {
    sin: (n) => Math.sin(deg(n)),
    cos: (n) => Math.cos(deg(n)),
    tan: (n) => Math.tan(deg(n)),
    asin: (n) => inverseDeg(Math.asin(n)),
    acos: (n) => inverseDeg(Math.acos(n)),
    atan: (n) => inverseDeg(Math.atan(n)),
    log: Math.log10,
    ln: Math.log,
    sqrt: Math.sqrt,
    abs: Math.abs,
    factorial,
    PI: Math.PI,
    E: Math.E,
    ANS: lastAnswer
  };

  if (!/^[0-9+\-*/().,\sA-Za-z_*]+$/.test(parsed)) {
    throw new Error('Invalid expression');
  }

  const names = Object.keys(funcs);
  const computed = Function(
    ...names,
    `"use strict"; return (${parsed})`
  )(...names.map((name) => funcs[name]));

  if (!Number.isFinite(computed)) {
    throw new Error('Undefined result');
  }

  return Math.abs(computed) < 1e-12 ? 0 : computed;
}

function format(value) {
  return Number.isInteger(value)
    ? String(value)
    : String(Number(value.toPrecision(12)));
}

function addHistory(raw, answer) {
  history.unshift({ raw, answer });
  history = history.slice(0, 8);
  historyList.innerHTML = history
    .map((item) => `
      <div class="history-item" data-expression="${item.raw}">
        <div class="history-expression">${item.raw}</div>
        <div class="history-result">= ${format(item.answer)}</div>
      </div>
    `)
    .join('');
}

function calculate() {
  if (!expression) return;

  try {
    const answer = evaluate(expression);
    lastAnswer = answer;
    resultEl.textContent = format(answer);
    addHistory(expression, answer);
    expression = '';
    expressionEl.textContent = 'Result';
  } catch {
    resultEl.textContent = 'Error';
    expressionEl.textContent = 'Check your expression';
  }
}

function input(value) {
  if (value === 'ans') value = 'ans';
  expression += value;
  expressionEl.textContent = expression;

  try {
    resultEl.textContent = format(evaluate(expression));
  } catch {
    resultEl.textContent = '…';
  }
}

document.querySelector('#keypad').addEventListener('click', (event) => {
  const key = event.target.closest('button');
  if (!key) return;

  if (key.dataset.action === 'clear') {
    expression = '';
    render();
    return;
  }

  if (key.dataset.action === 'backspace') {
    expression = expression.slice(0, -1);
    render();
    return;
  }

  if (key.dataset.action === 'calculate') {
    calculate();
    return;
  }

  input(key.dataset.value);
});

document.querySelectorAll('.angle').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.angle').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    angleUnit = button.dataset.angle;
  });
});

document.querySelectorAll('.mode').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.mode').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    document.querySelectorAll('[data-scientific]').forEach((item) => {
      item.hidden = button.dataset.mode === 'basic';
    });
    document.querySelector('#keypad').classList.toggle(
      'basic-mode',
      button.dataset.mode === 'basic'
    );
  });
});

document.querySelector('#clearHistory').addEventListener('click', () => {
  history = [];
  historyList.innerHTML = '<div class="empty-history"><span class="empty-icon">∿</span><p>Your calculations<br />will appear here.</p></div>';
});

historyList.addEventListener('click', (event) => {
  const item = event.target.closest('.history-item');
  if (item) {
    expression = item.dataset.expression;
    render();
  }
});

document.querySelector('#themeButton').addEventListener('click', () => {
  document.body.classList.toggle('high-contrast');
});

document.addEventListener('keydown', (event) => {
  if (/^F(?:[1-9]|1[0-2])$/.test(event.key)) {
    event.preventDefault();
    return;
  }

  const keyMap = { '*': '×', '/': '÷', '-': '−' };

  if (/\d|[+().%^]/.test(event.key) || keyMap[event.key]) {
    event.preventDefault();
    input(keyMap[event.key] || event.key);
  } else if (event.key === 'Enter' || event.key === '=') {
    event.preventDefault();
    calculate();
  } else if (event.key === 'Backspace') {
    expression = expression.slice(0, -1);
    render();
  } else if (event.key === 'Escape') {
    expression = '';
    render();
  }
});