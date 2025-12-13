// Make 10 Game Logic

// Game state
let gameState = {
    mode: 5,
    currentProblem: 0,
    problems: [],
    correctCount: 0,
    startTime: null,
    timerInterval: null,
    history: [],
    currentNumbers: [0, 0, 0, 0],
    operators: ['', '', ''],
    parens: new Set(), // Stores paren pairs as "start-end"
    inputHistory: [] // Track input order for proper undo: {type: 'operator'|'paren', index: number, value: string}
};

// Keyboard state for simultaneous key press
let keysPressed = new Set();

// Paren selection state for mouse input
let selectedParenIndices = [];

// Initialize game
function initGame() {
    setupModeButtons();
    resetGame();
}

function setupModeButtons() {
    document.querySelectorAll('.mode-button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (gameState.startTime !== null) {
                if (!confirm('進行中のゲームをリセットしますか？')) {
                    return;
                }
            }

            document.querySelectorAll('.mode-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mode = btn.dataset.mode;
            gameState.mode = parseInt(mode);
            resetGame();
        });
    });
}

function resetGame() {
    // Stop timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    // Shuffle problems
    const shuffled = [...PROBLEMS].sort(() => Math.random() - 0.5);
    gameState.problems = shuffled.slice(0, gameState.mode);
    gameState.currentProblem = 0;
    gameState.correctCount = 0;
    gameState.startTime = null;
    gameState.history = [];

    // Update UI
    document.getElementById('totalProblems').textContent = gameState.mode;
    document.getElementById('currentProblem').textContent = '1';
    document.getElementById('correctCount').textContent = '0';
    document.getElementById('timer').textContent = '00:00';
    document.getElementById('historySection').style.display = 'none';
    document.getElementById('historyGrid').innerHTML = '';

    // Load first problem
    loadProblem();
    clearInput();
}

function loadProblem() {
    if (gameState.currentProblem >= gameState.problems.length) {
        endGame();
        return;
    }

    const problem = gameState.problems[gameState.currentProblem];
    const numbers = problem.split('').map(n => parseInt(n));
    gameState.currentNumbers = numbers;

    // Start timer on first problem
    if (gameState.currentProblem === 0 && gameState.startTime === null) {
        startTimer();
    }

    // Clear input (keep result display to show previous answer)
    clearInput(true);

    // Update display
    updateDisplay();
}

function clearInput(keepResultDisplay = false) {
    gameState.operators = ['', '', ''];  // Initialize with empty
    gameState.parens = new Set();
    gameState.inputHistory = [];
    selectedParenIndices = [];

    // Reset result display to initial state (unless keepResultDisplay is true)
    if (!keepResultDisplay) {
        const resultDiv = document.getElementById('resultDisplay');
        resultDiv.className = 'result-display empty';
        resultDiv.textContent = '記号を入力して計算式を確定してください';
    }

    // Update display immediately
    updateDisplay();
}

function updateResultDisplay() {
    const resultDiv = document.getElementById('resultDisplay');
    const expression = buildExpression();

    if (expression === '') {
        resultDiv.className = 'result-display empty';
        resultDiv.textContent = '記号を入力して計算式を確定してください';
        adjustFontSize(resultDiv);
        return;
    }

    try {
        const result = evaluateExpression(expression);

        if (Math.abs(result - 10) < 0.0001) {
            resultDiv.className = 'result-display correct';
            resultDiv.textContent = result.toFixed(2);
        } else {
            resultDiv.className = 'result-display incorrect';
            resultDiv.textContent = result.toFixed(2);
        }
    } catch (e) {
        resultDiv.className = 'result-display incorrect';
        resultDiv.textContent = 'エラー';
    }

    adjustFontSize(resultDiv);
}

function buildExpression() {
    let expr = '';
    let parenList = Array.from(gameState.parens).map(p => {
        const [start, end] = p.split('-').map(n => parseInt(n));
        return { start, end };
    });

    for (let i = 0; i < 4; i++) {
        // Check for opening parens
        parenList.forEach(p => {
            if (p.start === i * 2) expr += '(';
        });

        // Add number (no signs - all positive)
        expr += gameState.currentNumbers[i];

        // Check for closing parens
        parenList.forEach(p => {
            if (p.end === i * 2 + 1) expr += ')';
        });

        // Add operator
        if (i < 3 && gameState.operators[i]) {
            expr += gameState.operators[i];
        }
    }

    return expr.trim();
}

function evaluateExpression(expr) {
    // Replace operators
    expr = expr.replace(/×/g, '*').replace(/÷/g, '/');

    // Remove spaces
    expr = expr.replace(/\s/g, '');

    // Validate expression
    if (!/^[\d+\-*/().]+$/.test(expr)) {
        throw new Error('Invalid characters');
    }

    // Evaluate
    return Function('"use strict"; return (' + expr + ')')();
}

function submitAnswer() {
    // Disable submit when modal is active
    const modal = document.getElementById('gameEndModal');
    if (modal.classList.contains('active')) {
        return;
    }

    // Check if all operators are filled
    for (let i = 0; i < 3; i++) {
        if (gameState.operators[i] === '') {
            const resultDiv = document.getElementById('resultDisplay');
            resultDiv.className = 'result-display incorrect';
            resultDiv.textContent = 'すべての演算子を入力してください';
            return;
        }
    }

    const expression = buildExpression();

    if (expression === '') {
        // Show error in result display instead of alert
        const resultDiv = document.getElementById('resultDisplay');
        resultDiv.className = 'result-display incorrect';
        resultDiv.textContent = 'ボタンを押してください';
        return;
    }

    try {
        const result = evaluateExpression(expression);
        const isCorrect = Math.abs(result - 10) < 0.0001;

        // Display result (only on submit)
        updateResultDisplay();

        // Add to history
        gameState.history.push({
            problem: gameState.currentNumbers.join(''),
            expression: expression,
            result: result,
            correct: isCorrect
        });

        if (isCorrect) {
            gameState.correctCount++;
            document.getElementById('correctCount').textContent = gameState.correctCount;

            // Move to next problem immediately (no setTimeout)
            gameState.currentProblem++;
            document.getElementById('currentProblem').textContent = gameState.currentProblem + 1;
            loadProblem();
        }

        updateHistory();
    } catch (e) {
        // Show error in result display instead of alert
        const resultDiv = document.getElementById('resultDisplay');
        resultDiv.className = 'result-display incorrect';
        resultDiv.textContent = 'エラー';
    }
}

function updateHistory() {
    const historySection = document.getElementById('historySection');
    const historyGrid = document.getElementById('historyGrid');

    if (gameState.history.length === 0) {
        historySection.style.display = 'none';
        return;
    }

    historySection.style.display = 'block';
    historyGrid.innerHTML = '';

    gameState.history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `history-item ${item.correct ? 'correct' : 'incorrect'}`;
        div.innerHTML = `
            <div><strong>${item.problem}</strong></div>
            <div style="font-size: 0.85em; margin-top: 3px;">${item.expression}</div>
            <div style="font-size: 0.85em; color: #666;">= ${item.result.toFixed(2)}</div>
        `;
        historyGrid.appendChild(div);
    });
}

function startTimer() {
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `${minutes}:${seconds}`;
    }, 1000);
}

function endGame() {
    clearInterval(gameState.timerInterval);

    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    const modal = document.getElementById('gameEndModal');
    const message = document.getElementById('modalMessage');

    message.value = `Make 10

タイム: ${minutes}分${seconds}秒
正解数: ${gameState.correctCount} / ${gameState.mode}

https://zakhor.github.io/Make10/`;

    modal.classList.add('active');
}

// Keyboard event handling
document.addEventListener('keydown', (e) => {
    // Disable game controls when modal is active
    const modal = document.getElementById('gameEndModal');
    if (modal.classList.contains('active')) {
        return;
    }

    keysPressed.add(e.key.toLowerCase());

    // Operator input (Q = +, W = -, E = ×, R = ÷)
    if (e.key.toLowerCase() === 'q') {
        cycleOperators('+');
    } else if (e.key.toLowerCase() === 'w') {
        cycleOperators('-');
    } else if (e.key.toLowerCase() === 'e') {
        cycleOperators('×');
    } else if (e.key.toLowerCase() === 'r') {
        cycleOperators('÷');
    }

    // Parentheses (number combinations)
    else if (['1', '2', '3', '4'].includes(e.key)) {
        // Will be handled in combination
    }

    // Submit (Enter)
    else if (e.key === 'Enter') {
        e.preventDefault();
        submitAnswer();
    }

    // Backspace (delete last paren or operator/sign)
    else if (e.key === 'Backspace') {
        e.preventDefault();
        deleteLastInput();
    }
});

document.addEventListener('keyup', (e) => {
    // Check for number combinations before removing key
    if (['1', '2', '3', '4'].includes(e.key)) {
        checkParentheses();
    }

    keysPressed.delete(e.key.toLowerCase());
});


function cycleOperators(op) {
    // Find first empty operator slot
    for (let i = 0; i < 3; i++) {
        if (gameState.operators[i] === '') {
            gameState.operators[i] = op;
            gameState.inputHistory.push({ type: 'operator', index: i, value: op });
            updateDisplay();
            return;
        } else if (i === 2) {
            // If all slots filled, cycle the last one
            gameState.operators[i] = op;
            gameState.inputHistory.push({ type: 'operator', index: i, value: op });
            updateDisplay();
            return;
        }
    }
}

function checkParentheses() {
    const numberKeys = ['1', '2', '3', '4'].filter(k => keysPressed.has(k));

    if (numberKeys.length === 2) {
        const nums = numberKeys.map(k => parseInt(k)).sort((a, b) => a - b);
        const start = (nums[0] - 1) * 2;
        const end = (nums[1] - 1) * 2 + 1;
        const parenKey = `${start}-${end}`;

        // Toggle paren pair
        if (gameState.parens.has(parenKey)) {
            gameState.parens.delete(parenKey);
            // Don't add to history when deleting
        } else {
            gameState.parens.add(parenKey);
            gameState.inputHistory.push({ type: 'paren', value: parenKey });
        }
        updateDisplay();
    }
}

function deleteLastInput() {
    // Delete based on input history (most recent input first)
    if (gameState.inputHistory.length === 0) {
        return;
    }

    const lastInput = gameState.inputHistory.pop();

    if (lastInput.type === 'operator') {
        gameState.operators[lastInput.index] = '';
    } else if (lastInput.type === 'paren') {
        gameState.parens.delete(lastInput.value);
    }

    updateDisplay();
}

// Button event listeners
document.getElementById('submitBtn').addEventListener('click', submitAnswer);
document.getElementById('clearBtn').addEventListener('click', () => {
    const modal = document.getElementById('gameEndModal');
    if (modal.classList.contains('active')) return;
    clearInput();
});
document.getElementById('resetBtn').addEventListener('click', () => {
    const modal = document.getElementById('gameEndModal');
    if (modal.classList.contains('active')) return;
    if (confirm('ゲームをリセットしますか？')) {
        resetGame();
    }
});

// Flick picker state
let currentFlickIndex = -1;

function showFlickPicker(buttonElement, operatorIndex) {
    currentFlickIndex = operatorIndex;
    const picker = document.getElementById('flickPicker');
    const rect = buttonElement.getBoundingClientRect();

    // Position picker centered on the button
    picker.style.left = (rect.left + rect.width / 2 - 100) + 'px';
    picker.style.top = (rect.top + rect.height / 2 - 100) + 'px';
    picker.style.display = 'block';
    picker.classList.add('active');
}

function hideFlickPicker() {
    const picker = document.getElementById('flickPicker');
    picker.classList.remove('active');
    picker.style.display = 'none';
    currentFlickIndex = -1;
}

function selectOperator(op) {
    if (currentFlickIndex === -1) return;

    gameState.operators[currentFlickIndex] = op;
    gameState.inputHistory.push({ type: 'operator', index: currentFlickIndex, value: op });
    updateDisplay();
    hideFlickPicker();
}

// Setup button click listeners
function setupButtonListeners() {
    // Operator buttons - show flick picker
    for (let i = 0; i < 3; i++) {
        document.getElementById(`opBtn${i}`).addEventListener('click', (e) => {
            const modal = document.getElementById('gameEndModal');
            if (modal.classList.contains('active')) return;

            showFlickPicker(e.currentTarget, i);
        });
    }

    // Paren buttons - select two to create/remove pair
    for (let i = 0; i < 4; i++) {
        document.getElementById(`parenBtn${i}`).addEventListener('click', () => {
            const modal = document.getElementById('gameEndModal');
            if (modal.classList.contains('active')) return;

            const numberIndex = i; // 0-3 for numbers 1-4

            // Toggle selection
            if (selectedParenIndices.includes(numberIndex)) {
                selectedParenIndices = selectedParenIndices.filter(idx => idx !== numberIndex);
            } else {
                selectedParenIndices.push(numberIndex);
            }

            // Update button visuals
            updateParenButtonVisuals();

            // If two selected, create/remove paren pair
            if (selectedParenIndices.length === 2) {
                const [num1, num2] = selectedParenIndices.sort((a, b) => a - b);
                const start = num1 * 2;  // Convert to paren index
                const end = num2 * 2 + 1;
                const parenKey = `${start}-${end}`;

                // Toggle paren pair
                if (gameState.parens.has(parenKey)) {
                    gameState.parens.delete(parenKey);
                    // Don't add to history when deleting
                } else {
                    gameState.parens.add(parenKey);
                    gameState.inputHistory.push({ type: 'paren', value: parenKey });
                }

                // Clear selection
                selectedParenIndices = [];
                updateParenButtonVisuals();
                updateDisplay();
            }
        });
    }
}

function updateParenButtonVisuals() {
    for (let i = 0; i < 4; i++) {
        const btn = document.getElementById(`parenBtn${i}`);
        if (selectedParenIndices.includes(i)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    }
}

function updateDisplay() {
    // Update problem display to show current expression
    const expression = buildDisplayExpression();
    const problemDisplay = document.getElementById('problemDisplay');
    problemDisplay.textContent = expression;

    // Auto-adjust font size to fit content
    adjustFontSize(problemDisplay);

    // Update operator button text
    for (let i = 0; i < 3; i++) {
        const btn = document.getElementById(`opBtn${i}`);
        btn.textContent = gameState.operators[i] || '　';
    }

    // Update paren button text
    updateParenButtonText();

    // DO NOT update result display in real-time (only on submit)
}

function adjustFontSize(element) {
    // Get default size from CSS class or set defaults
    let defaultSize = '2em';
    let defaultSpacing = '5px';

    if (element.classList.contains('subtitle')) {
        defaultSize = '1.1em';
        defaultSpacing = '0px';
    } else if (element.classList.contains('result-display')) {
        defaultSize = '1.0em';
        defaultSpacing = '0px';
    }

    // Reset to default size
    element.style.fontSize = defaultSize;
    element.style.letterSpacing = defaultSpacing;

    // Set minimum font size based on element type
    const minFontSize = element.classList.contains('result-display') ? 8 : 12;

    // Check if content overflows
    while (element.scrollWidth > element.clientWidth && parseFloat(getComputedStyle(element).fontSize) > minFontSize) {
        const currentSize = parseFloat(getComputedStyle(element).fontSize);
        element.style.fontSize = (currentSize - 2) + 'px';

        // Also reduce letter spacing proportionally
        const currentSpacing = parseFloat(getComputedStyle(element).letterSpacing);
        if (currentSpacing > 1) {
            element.style.letterSpacing = (currentSpacing - 0.5) + 'px';
        }
    }
}

function updateParenButtonText() {
    // Count opening and closing parens for each number position
    const openParens = [0, 0, 0, 0];
    const closeParens = [0, 0, 0, 0];

    gameState.parens.forEach(parenKey => {
        const [start, end] = parenKey.split('-').map(n => parseInt(n));
        const startNum = Math.floor(start / 2);  // 0-3 for numbers 1-4
        const endNum = Math.floor(end / 2);      // 0-3 for numbers 1-4
        openParens[startNum]++;
        closeParens[endNum]++;
    });

    // Update button text
    for (let i = 0; i < 4; i++) {
        const btn = document.getElementById(`parenBtn${i}`);
        let text = '';
        if (openParens[i] > 0) {
            text += '('.repeat(openParens[i]);
        }
        if (closeParens[i] > 0) {
            text += ')'.repeat(closeParens[i]);
        }
        btn.textContent = text || '　';

        if (text) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
}

function buildDisplayExpression() {
    let expr = '';
    let parenList = Array.from(gameState.parens).map(p => {
        const [start, end] = p.split('-').map(n => parseInt(n));
        return { start, end };
    });

    for (let i = 0; i < 4; i++) {
        // Add opening parens
        parenList.forEach(p => {
            if (p.start === i * 2) expr += '( ';
        });

        // Add number (no signs - all positive)
        expr += gameState.currentNumbers[i];

        // Add closing parens
        parenList.forEach(p => {
            if (p.end === i * 2 + 1) expr += ' )';
        });

        // Add operator
        if (i < 3) {
            if (gameState.operators[i]) {
                expr += ' ' + gameState.operators[i] + ' ';
            } else {
                expr += '   ';  // Three spaces for empty operator
            }
        }
    }

    return expr.trim();
}

// Copy result to clipboard
function copyResultToClipboard() {
    const message = document.getElementById('modalMessage');
    message.select();
    document.execCommand('copy');

    // Show toast notification
    showToast('コピーしました！');
}

// Show toast notification
function showToast(text) {
    const toast = document.getElementById('toast');
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Initialize on load
window.onload = () => {
    initGame();
    setupButtonListeners();

    // Adjust subtitle font size to fit container
    const subtitle = document.querySelector('.subtitle');
    adjustFontSize(subtitle);

    // Re-adjust on window resize
    window.addEventListener('resize', () => {
        adjustFontSize(subtitle);
    });

    // Restrict Ctrl+A to textarea only when modal is active
    const modalMessage = document.getElementById('modalMessage');
    modalMessage.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            e.stopPropagation();
            modalMessage.select();
        }
    });

    // Setup flick picker option clicks
    document.querySelectorAll('.flick-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const op = e.currentTarget.dataset.op;
            selectOperator(op);
        });
    });

    // Click outside flick picker to close
    document.addEventListener('click', (e) => {
        const picker = document.getElementById('flickPicker');
        const isOperatorButton = e.target.closest('.operator-button');
        const isFlickOption = e.target.closest('.flick-option');

        if (picker.classList.contains('active') && !isOperatorButton && !isFlickOption) {
            hideFlickPicker();
        }
    });
};
