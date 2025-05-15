<template>
  <div
      class="game"
      tabindex="0"
      ref="gameField"
      @focus="() => handleFocus()"
      @blur="() => handleBlur()"
      @keydown="(event) => handleKeyDown(event)"
  >
    <div class="game__header">
      <div class="game__header__content">
        <h1 class="game__title">2048</h1>
        <div class="game__score-box">
          <span class="game__score-box__label">Счет:</span>
          <span class="game__score-box__value">{{ getScore }}</span>
        </div>
        <div class="game__score-box">
          <span class="game__score-box__label">Рекорд:</span>
          <span class="game__score-box__value">{{ getHighScore }}</span>
        </div>
        <button
            class="game__undo-button"
            :disabled="!canUndo"
            @click="() => handleUndoMove()"
        >
          <img src="@/utils/restartbtn.png" />
        </button>
        <button
            @click="() => addSpecificTiles()"
        >
          Add 1024 Tiles
        </button>
      </div>
    </div>
    <div class="game__grid-size-selector">
      <label v-for="size in gridSizes" :key="size" class="game__grid-size-selector__item">
        <input
            v-model="selectedGridSize"
            class="game__grid-size-selector__radio"
            type="radio"
            :value="size"
            @change="()=>updateGridSize()"
        />
        <span
            class="game__grid-size-selector__button"
            :class="{ 'game__grid-size-selector__button--active': selectedGridSize === size }"
        >
      {{ size }}
    </span>
      </label>
    </div>
    <div class="game__board">
      <div class="game__grid" :style="gridStyle">
        <GameTile
            v-for="(cell, index) in getFormattedCells"
            :key="`tile-${index}-${getCells[index]}-${animationData[index] ? 'moving' : 'static'}`"
            :tile="getCells[index]"
            :formattedValue="cell"
            :style="tilePositions[index]"
            :from-row="animationData[index]?.fromRow"
            :from-col="animationData[index]?.fromCol"
            :to-row="Math.floor(index / getGridSize)"
            :to-col="index % getGridSize"
            :animate="!!getTileAnimationData(index)"
            @animation-end="()=>handleAnimationEnd()"
        />
      </div>
    </div>
  </div>
</template>

<script>
import {mapGetters, mapActions} from 'vuex';
import GameTile from '@/components/Tile.vue';
import {KEY_MAP} from "@/utils/keyMap";

export default {
  name: 'HomePage',
  components: { GameTile },
  computed: {
    ...mapGetters('game', [
      'getCells',
      'getScore',
      'getHighScore',
      'isGameOver',
      'isVictory',
      'canUndo',
      'getFormattedCells',
      'getGridSize',
      'getTileAnimationData',
    ]),
    gridStyle() {
      const gridSize = this.getGridSize;
      return {
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      };
    },
    tilePositions() {
      const gridSize = this.getGridSize;
      return this.getCells.map((_, index) => ({
        gridRow: Math.floor(index / gridSize) + 1,
        gridColumn: (index % gridSize) + 1
      }));
    },
  },
  mounted() {
    this.restartGame();
    this.$refs.gameField.focus();
    this.setFocus(true);
  },
  methods: {
    ...mapActions('game', [
      'moveByKeyEvent',
      'restartGame',
      'setFocus',
      'addSpecificTiles',
      'undoMove',
      'setGridSize',
      'restartGameWithGridSize'
    ]),
    updateGridSize() {
      this.restartGameWithGridSize(this.selectedGridSize);
      this.restartGame();
    },
    handleFocus() {
      this.setFocus(true);
    },
    handleBlur() {
      setTimeout(() => {
        this.$refs.gameField.focus();
        this.setFocus(false);
      }, 0);
    },
    handleUndoMove() {
      if (this.canUndo) {
        this.undoMove();
      }
    },
    handleAnimationEnd() {
      this.animationData = {};
      this.animating = false;
      this.$forceUpdate();
    },
    //сырой, переделать в будущем
    async handleKeyDown(event) {
      if (this.isAnimating) {
        event.preventDefault();
        return;
      }
      const direction = KEY_MAP[event.key];
      if (!direction) return;
      await this.moveByKeyEvent(event);
    },
  },
  data() {
    return {
      selectedGridSize: 4,
      gridSizes: [4, 5, 6, 7, 8, 9, 10],
      animationData: {},
      animating: false
    };
  },
};
</script>

<style scoped lang="less">
.game {
  outline: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #eee4da;

  &__header {
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 620px;
    margin-bottom: 20px;

    &__content {
      display: flex;
      align-items: center;
      gap: 20px;
    }
  }

  &__title {
    color: #bb8213;
    font-weight: 900;
    font-size: clamp(24px, 5vw, 48px);
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);

    @media (max-width: 400px) {
      font-size: clamp(18px, 6vw, 36px);
    }
  }

  &__score-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #f3bb4c;
    border-radius: 10px;
    width: clamp(100px, 20vw, 150px);
    height: clamp(50px, 10vw, 80px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

    &__label {
      font-size: clamp(12px, 2vw, 16px);
      margin-bottom: 4px;
    }

    &__value {
      font-size: clamp(16px, 3vw, 24px);
      font-weight: bold;
    }
  }

  &__board {

    --cell-size: clamp(60px, 8vw, 100px);
    --gap-size: clamp(5px, 1vw, 10px);

    width: clamp(200px, 80vw, 600px);
    padding: clamp(8px, 1vw, 15px);
    display: grid;
    gap: var(--gap-size);
    background-color: #d0d6da;
    border-radius: 8px;
    position: relative;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    @media (max-width: 600px) {
      width: 100%;
      padding: 5px;
      --cell-size: clamp(40px, 10vw, 80px);
      --gap-size: 5px;
    }
  }

  &__grid {
    display: grid;
    gap: clamp(5px, 1vw, 10px);
    width: 100%;
    max-width: 100%;
    max-height: calc(100%);
    height: auto;
    background-color: #d0d6da;
    border-radius: 8px;
    position: relative;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  }

  &__undo-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    outline: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    position: relative;

    & img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .game__grid-size-selector {
    display: flex;
    gap: 10px;
    align-items: center;

    &__item {
      position: relative;
      cursor: pointer;
    }

    &__radio {
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      margin: 0;
      cursor: pointer;
    }

    &__button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #d9d9d9;
      color: #333;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      z-index: 0;

      &:hover {
        background-color: #cfcfcf;
      }
    }

    &__button--active {
      background-color: #edc12e;
      color: #3f3b3b;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
    }
  }

}
@keyframes pop-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
