import { KEY_MAP } from '@/utils/keyMap.js';

const initialState = (gridSize = 4) => ({
    cells: Array(gridSize * gridSize).fill(0),
    gridSize,
    score: 0,
    highScore: parseInt(localStorage.getItem('highScore')) || 0,
    gameOver: false,
    victory: false,
    previousState: null,
    victoryModalShown: false,
    isAnimating: false,
    movedTiles: []
});

export default {
    namespaced: true,
    state: initialState(),
    getters: {
        getCells: (state) => state.cells,
        getScore: (state) => state.score,
        getHighScore: (state) => state.highScore,
        isGameOver: (state) => state.gameOver,
        isVictory: (state) => state.victory,
        canUndo: (state) => !!state.previousState,
        getGridSize: (state) => state.gridSize,
        hasPossibleMoves: (state) => {
            const gridSize = state.gridSize;
            return state.cells.some((cell, index) => {
                return (
                    (index % gridSize < gridSize - 1 && cell === state.cells[index + 1]) ||
                    (index < gridSize * (gridSize - 1) && cell === state.cells[index + gridSize])
                );
            });
        },
        getFormattedCells: (state) => {
            const formatCellValue = (value) => {
                if (value === 0) {
                    return '';
                }
                if (value < 2049) {
                    return value.toString();
                }
                const suffixes = ['', 'k', 'kk', 'kkk'];
                let suffixIndex = 0;
                let formattedValue = value;
                while (formattedValue >= 2049 && suffixIndex < suffixes.length - 1) {
                    formattedValue /= 1000;
                    suffixIndex++;
                }
                return `${Math.floor(formattedValue)}${suffixes[suffixIndex]}`.slice(0, 6);
            };
            return state.cells.map((cell) => formatCellValue(cell));
        },
        getTileAnimationData: (state) => (index) => {
            if (!state.movedTiles) {
                return null;
            }
            const move = state.movedTiles.find(m => m.from === index);
            if (!move) {
                return null;
            }
            const gridSize = state.gridSize;
            return {
                fromRow: Math.floor(move.from / gridSize),
                fromCol: move.from % gridSize,
                newIndex: move.to
            };
        },
    },
    mutations: {
        SET_ANIMATING(state, status) {
            state.isAnimating = status;
        },
        SET_MOVED_TILES(state, tiles) {
            state.movedTiles = tiles;
        },
        SET_LAST_ACTION(state, action) {
            state.lastAction = action;
        },
        SET_GRID_SIZE: (state, size) => {
            state.gridSize = size;
            state.cells = Array(size * size).fill(0);
        },
        RESET_STATE: (state, gridSize = state.gridSize) => {
            const { highScore } = state;
            Object.assign(state, initialState(gridSize));
            state.highScore = highScore;
            state.victoryModalShown = false;
        },
        ADD_SCORE: (state, value) => {
            if (typeof value === 'number') {
                state.score += value;
                if (state.score > state.highScore) {
                    state.highScore = state.score;
                    localStorage.setItem('highScore', state.highScore);
                }
            }
        },
        SET_HIGH_SCORE: (state, value) => {
            if (typeof value === 'number' && value > state.highScore) {
                state.highScore = value;
            }
        },
        SET_CELLS: (state, cells) => {
            state.cells = cells.map((cell) => (typeof cell === 'number' ? cell : 0));
        },
        SET_GAME_OVER: (state, status) => {
            state.gameOver = status;
        },
        SET_VICTORY: (state, status) => {
            state.victory = status;
        },
        SET_VICTORY_MODAL_SHOWN: (state, status) => {
            state.victoryModalShown = status;
        },
        SAVE_PREVIOUS_STATE: (state) => {
            const currentState = {
                cells: [...state.cells],
                score: state.score,
            };
            if (!state.previousState || JSON.stringify(state.previousState) !== JSON.stringify(currentState)) {
                state.previousState = currentState;
            }
        },
        SET_FOCUS: (state, status) => {
            state.isFocused = status;
        },
        UNDO_MOVE: (state) => {
            if (state.previousState) {
                state.cells = state.previousState.cells;
                state.score = state.previousState.score;
                state.previousState = null;
            }
        },
    },
    actions: {
        setGridSize: ({ commit }, size) => {
            return new Promise((resolve) => {
                commit('SET_GRID_SIZE', size);
                commit('RESET_STATE');
                resolve();
            });
        },
        restartGameWithGridSize: ({ commit }, gridSize) => {
            commit('RESET_STATE', gridSize);
            commit('SET_GRID_SIZE', gridSize);
        },
        restartGame: ({ dispatch, state }) => {
            dispatch('restartGameWithGridSize', state.gridSize)
                .then(() => dispatch('addRandomTile'))
                .then(() => dispatch('addRandomTile'))
                .catch(error => {
                    console.error('Ошибка при перезапуске игры:', error);
                });
        },
        checkGameState: ({ state, commit, dispatch }) => {
            const gridSize = state.gridSize;
            if (!state.cells.includes(0)) {
                const hasMoves = state.cells.some((cell, index) => {
                    return (
                        (index % gridSize < gridSize - 1 && cell === state.cells[index + 1]) ||
                        (index < gridSize * (gridSize - 1) && cell === state.cells[index + gridSize])
                    );
                });
                if (!hasMoves) {
                    commit('SET_GAME_OVER', true);
                    dispatch('openGameEndModal', {
                        title: 'Конец игры',
                        message: 'Вы проиграли. Попробуйте снова!',
                        buttons: [
                            {
                                text: 'Новая игра',
                                click: () => dispatch('restartGame'),
                            },
                        ],
                    });
                }
            }
            if (state.cells.includes(2048) && !state.victoryModalShown) {
                commit('SET_VICTORY', true);
                commit('SET_VICTORY_MODAL_SHOWN', true);
                dispatch('openGameEndModal', {
                    title: 'Победа!',
                    message: 'Вы выиграли! Поздравляем!',
                    buttons: [
                        {
                            text: 'Продолжить',
                            click: () => {}
                        },
                        {
                            text: 'Новая игра',
                            click: () => dispatch('restartGame'),
                        },
                    ],
                });
            }
        },
        openGameEndModal: ({ commit }, { title, message, buttons }) => {
            commit('modals/openModal', {
                    component: 'GameEndModal',
                    params: { title, message, buttons },
                },
                { root: true }
            );
        },
        async addRandomTile({ state, commit }) {
            const emptyCells = state.cells
                .map((value, index) => (value === 0 ? index : -1))
                .filter(index => index !== -1);
            if (emptyCells.length > 0) {
                const index = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                const newValue = [2, 4][Math.floor(Math.random() * 2)];
                const newCells = [...state.cells];
                newCells[index] = newValue;
                commit('SET_CELLS', newCells);
                commit('SET_LAST_ACTION', { type: 'ADD_TILE', index });
            }
        },
        addSpecificTiles: ({ state, commit }) => { //отладочный элемент (снесётся в дальнейшем)
            const cells = [...state.cells];
            const emptyCells = cells
                .map((value, index) => (value === 0 ? index : -1))
                .filter((index) => index !== -1);
            if (emptyCells.length >= 2) {
                const [index1, index2] = emptyCells.slice(0, 2);
                cells[index1] = 1024;
                cells[index2] = 1024;
                commit('SET_CELLS', cells);
            }
        },

        async move({ dispatch, state, commit }, direction) {
            commit('SET_ANIMATING', true);

            const previousCells = [...state.cells];
            const previousScore = state.score;
            const gridSize = state.gridSize;

            let cells = [...state.cells];
            let scoreIncrease = 0;
            let movedTiles = [];

            switch (direction) {
                case KEY_MAP.ArrowLeft:
                    ({ cells, scoreIncrease, movedTiles } = processMove(cells, 'left', moveRow, gridSize));
                    break;
                case KEY_MAP.ArrowRight:
                    ({ cells, scoreIncrease, movedTiles } = processMove(cells, 'right', moveRow, gridSize));
                    break;
                case KEY_MAP.ArrowUp:
                    ({ cells, scoreIncrease, movedTiles } = processMove(cells, 'up', moveColumn, gridSize));
                    break;
                case KEY_MAP.ArrowDown:
                    ({ cells, scoreIncrease, movedTiles } = processMove(cells, 'down', moveColumn, gridSize));
                    break;
                default:
                    commit('SET_ANIMATING', false);
                    return;
            }
            if (JSON.stringify(previousCells) !== JSON.stringify(cells)) {
                commit('SAVE_PREVIOUS_STATE', {
                    cells: previousCells,
                    score: previousScore
                });
                commit('SET_CELLS', cells);
                if (scoreIncrease > 0) {
                    commit('ADD_SCORE', scoreIncrease);
                }

                await Promise.all([
                    dispatch('animateMovement', { movedTiles }),
                    new Promise(resolve => setTimeout(() => {
                        dispatch('addRandomTile').then(resolve);
                    }, 30))
                ]);
                dispatch('checkGameState');
            }
            commit('SET_ANIMATING', false);
        },

        async animateMovement({ commit }, { movedTiles }) {
            commit('SET_MOVED_TILES', movedTiles);
            return new Promise(resolve => setTimeout(resolve, 100));
        },
        setFocus: ({ commit }, status) => {
            commit('SET_FOCUS', status);
        },
        undoMove: ({ commit }) => {
            commit('UNDO_MOVE');
        },
        moveByKeyEvent: ({ dispatch }, event) => {
            const direction = KEY_MAP[event.key];
            if (direction) {
                dispatch('move', direction);
            }
        },
    },
};

const compressAndMerge = (array, direction, gridSize) => {
    const sanitizedArray = array.map(cell => (typeof cell === 'number' ? cell : 0));
    const compressed = sanitizedArray.filter(cell => cell !== 0);
    let scoreIncrease = 0;
    const movements = [];

    if (direction === 'right' || direction === 'down') {
        compressed.reverse();
    }
    for (let i = 0; i < compressed.length - 1; i++) {
        if (compressed[i] === compressed[i + 1]) {
            compressed[i] *= 2;
            scoreIncrease += compressed[i];
            movements.push({
                from: i + 1,
                to: i,
                value: compressed[i]
            });
            compressed.splice(i + 1, 1);
            i--;
        }
    }
    while (compressed.length < gridSize) {
        compressed.push(0);
    }
    if (direction === 'right' || direction === 'down') {
        compressed.reverse();
        movements.forEach(move => {
            move.from = gridSize - 1 - move.from;
            move.to = gridSize - 1 - move.to;
        });
    }
    const nonZeroIndices = [];
    array.forEach((cell, index) => {
        if (cell !== 0) nonZeroIndices.push(index);
    });
    compressed.forEach((cell, newIndex) => {
        if (cell !== 0) {
            const originalIndex = array.indexOf(cell, nonZeroIndices[newIndex] || 0);
            if (originalIndex !== -1 && originalIndex !== newIndex) {
                movements.push({
                    from: originalIndex,
                    to: newIndex,
                    value: cell
                });
            }
        }
    });
    return {
        compressed,
        scoreIncrease,
        movements
    };
};
const moveRow = (cells, direction, gridSize) => {
    let moved = false;
    let totalScoreIncrease = 0;
    const movedTiles = [];

    for (let row = 0; row < gridSize; row++) {
        const start = row * gridSize;
        const end = start + gridSize;
        const currentRow = cells.slice(start, end);
        const { compressed, scoreIncrease, movements } = compressAndMerge(currentRow, direction, gridSize);

        if (JSON.stringify(currentRow) !== JSON.stringify(compressed)) {
            cells.splice(start, gridSize, ...compressed);
            moved = true;
            totalScoreIncrease += scoreIncrease;
            movements.forEach(movement => {
                movedTiles.push({
                    from: start + movement.from,
                    to: start + movement.to,
                    value: movement.value
                });
            });
        }
    }
    return { cells, moved, scoreIncrease: totalScoreIncrease, movedTiles };
};
const moveColumn = (cells, direction, gridSize) => {
    let moved = false;
    let totalScoreIncrease = 0;
    const movedTiles = [];

    for (let col = 0; col < gridSize; col++) {
        const column = [];
        // Собираем колонку
        for (let i = 0; i < gridSize; i++) {
            column.push(cells[col + i * gridSize]);
        }
        const { compressed, scoreIncrease, movements } = compressAndMerge(column, direction, gridSize);
        if (JSON.stringify(column) !== JSON.stringify(compressed)) {
            for (let i = 0; i < gridSize; i++) {
                cells[col + i * gridSize] = compressed[i];
            }
            moved = true;
            totalScoreIncrease += scoreIncrease;
            movements.forEach(movement => {
                movedTiles.push({
                    from: col + movement.from * gridSize,
                    to: col + movement.to * gridSize,
                    value: movement.value
                });
            });
        }
    }
    return {
        cells,
        moved,
        scoreIncrease: totalScoreIncrease,
        movedTiles
    };
};
const processMove = (cells, direction, moveFunction, gridSize) => {
    const result = moveFunction(cells, direction, gridSize);
    return {
        cells: result.cells,
        moved: result.moved,
        scoreIncrease: result.scoreIncrease,
    };
};
