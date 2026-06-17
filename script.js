// STATE (CALCULATOR'S MEMORY STORAGE)
const state = {
    current: '0',
    previous: '',
    operator: null,
    waitNext: false,   //waiting for next number after operator press
    justCalc: false, //just hit equal sign
};

/* DOM */
const $result = document.getElementById('result');
const $expression = document.getElementById('expression');


/*DISPLAY HELPERS */
function formatNum(n) {
    if (n=== 'Error' || n === 'Infinity' || n === '-Infinity') return n;
    const num = parseFloat(n);
    if (isNaN(num)) return n;
    let s = parseFloat(num.toPrecision(10)).toString();
    if (s.length > 14) s = num.toExponential(5);
    return s;
}

function updateDisplay(opts = {}) {
    const { pulse = false, justCalc = false, error = false } = opts;
    const val = formatNum(state.current);

    $result.innerHTML = val + '<span class="cursor"></span>';
    $result.classList.toggle('just-calculated', justCalc);
    $result.classList.toggle('error', error);
    if (pulse) { $result.classList.remove('pulse'); void $result.offsetWidth; $result.classList.add('pulse'); }

    if (state.previous !== '' && state.operator) {
        const opSym = { '+':'+', '-':'-', '*':'x', '/':'÷' }[state.operator] || state.operator;
        $expression.textContent = formatNum(state.previous) + ' ' + opSym;
        $expression.classList.add('has-content');    
    } else if (state.justCalc) {
        $expression.classList.remove('has-content');
    } else {
        $expression.textContent = '';
        $expression.classList.remove('has-content');
    }
}

/*ARITHMETIC */
function calculate(a, op, b) {
    a = parseFloat(a); b = parseFloat(b);
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b === 0 ? 'Error' : a/b;
    }
    return b;
}

/*HANDLERS */
function handleDigit(d) {
    if (state.waitNext) {
        state.current = d === '0' ? '0' : d;
        state.waitNext = false;
        state.justCalc = false;
    } else if (state.justCalc) {
        state.current = d;
        state.previous = '';
        state.operator = null;
        state.justCalc = false;
    } else {
        if (state.current === '0' && d !== '.') state.current = d;
        else if (state.current.length < 12) state.current += d;
    }
    updateDisplay();
}

function handleDecimal(){
    if (state.waitNext) { state.current = '0.'; state.waitNext = false; return; }
    if (state.justCalc) { state.current = '0.'; state.previous = ''; state.operator = null; state.justCalc = false; return; }
    if (!state.current.includes('.')) state.current += '.';
    updateDisplay();
}

function handleOperator(op) {
    state.justCalc = false;
    if (state.operator && !state.waitNext) {
        const result = calculate(state.previous, state.operator, state.current);
        if (result === 'Error') { handleError(); return; }
        state.previous = String(result);
        state.current = String(result);
    } else {
        state.previous = state.current;
    }
    state.operator = op;
    state.waitNext = true;
    updateDisplay();
}

function handleEquals() {
    if (!state.operator || state.previous === '') return;
    const result = calculate(state.previous, state.operator, state.current);
    if (result === 'Error') { handleError(); return; }
    const opSym = { '+':'+', '-':'−', '*':'×', '/':'÷' }[state.operator];
    $expression.textContent = formatNum(state.previous) + ' ' + opSym + ' ' + formatNum(state.current) + ' =';
    $expression.classList.add('has-content');
    state.current = String(result);
    state.previous = '';
    state.operator = null;
    state.waitNext = false;
    state.justCalc = true;
    updateDisplay({ pulse: true, justCalc: true });
}

function handleClear() {
    state.current = '0'; state.previous = '';
    state.operator = null; state.waitNext = false; state.justCalc = false;
    $expression.textContent = '';
    $expression.classList.remove('has-content');
    updateDisplay();
}

function handleSign() {
    if (state.current === '0') return;
    state.current = state.current.startsWith('-') ? state.current.slice(1) : '-' + state.current;
    updateDisplay({ pulse: true});
}

function handlePercent() {
    state.current = String(parseFloat(state.current) / 100);
    updateDisplay({ pulse: true });
}

function handleError() {
    state.current = 'Error'; state.previous = '';
    state.operator = null; state.waitNext = false; state.justCalc = false;
    $expression.textContent = '';
    updateDisplay({ error: true });
}

/* RIPPLE */
function addRipple(btn, e) {
    const r = btn.getBoundingClientRect();
    const span = document.createElement('span');
    span.className = 'ripple'
    const size = Math.max(r.width, r.height);
    span.style.cssText = `width:${size}px;height:${size}px;left:${(e.clientX||r.left+r.width/2)-r.left-size/2}px;top:${(e.clientY||r.top+r.height/2)-r.top-size/2}px`;
    btn.appendChild(span);
    setTimeout(() => span.remove(), 420);
}

function flashBtn(btn) {
    btn.classList.remove('pressed');
    void btn.offsetWidth;
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 160);
}

/* BUTTON CLICKS*/
document.querySelector('.btn-grid').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    addRipple (btn, e);
    const { action, val, op } = btn.dataset;
    switch (action) {
        case 'digit':    handleDigit(val);   break;
        case 'decimal':  handleDecimal();    break;
        case 'operator': handleOperator(op); break;
        case 'equals':   handleEquals();     break;
        case 'clear':    handleClear();      break;
        case 'sign':     handleSign();       break;
        case 'percent':  handlePercent();    break;
    }
});

/*KEYBOARD SUPPORT */
const keyMap = {
    '0':'btn-0', '1':'btn-1', '2':'btn-2', '3':'btn-3', '4':'btn-4',
    '5':'btn-5', '6':'btn-6', '7':'btn-7', '8':'btn-8', '9':'btn-9',
    '.':'btn-dot', ',':'btn-dot',
    '+':'btn-add', '-':'btn-sub', '*':'btn-mul', '/':'btn-div',
    'Enter':'btn-eq', '=':'btn-eq',
    'Escape': 'btn-ac', 'Delete':'btn-ac', 'Backspace':'btn-ac',
    '%':'btn-pc',
};

document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const id = keyMap[e.key];
    if (!id) return;
    e.preventDefault();
    const btn = document.getElementById(id);
    if (!btn) return;
    flashBtn(btn);
    btn.click();
});

/*INITIALIZATION */
updateDisplay();


