<template>
<span
    class="game__tile"
    :class="tileClass"
    :style="tileStyle"
>
    {{ formattedValue }}
  </span>
</template>

<script>
export default {
  name: 'GameTile',
  props: {
    tile: {
      type: Number,
      required: true,
    },
    formattedValue: {
      type: String,
      required: true,
    },
    fromRow: Number,
    fromCol: Number,
    toRow: Number,
    toCol: Number,
    animate: Boolean,
    isNew: Boolean
  },
  computed: {
    tileClass() {
      if (this.tile === 0) return 'game__tile--0';
      let baseValue = this.tile;
      while (baseValue > 2048) baseValue /= 1024;
      const powersOfTwo = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
      const closestPowerOfTwo = powersOfTwo.find((power) => power >= baseValue) || 2048;
      return `game__tile--${closestPowerOfTwo}`;
    },
    tileStyle() {
      const style = {};
      if (this.animate && this.fromRow !== undefined) {
        style.transform = `translate(${(this.toCol - this.fromCol) * 100}%, ${(this.toRow - this.fromRow) * 100}%)`;
        style.transition = 'transform 0.1s ease-out';
        style.zIndex = 1;
      }
      if (this.isNew) {
        style.animation = 'appear 0.15s ease-out forwards';
        style.opacity = '0';
        style.transform = 'scale(0.8)';
      }
      return style;
    },
  },
  //попробовать заменить watch
  watch: {
    toRow() {
      setTimeout(() => {
        this.$emit('animation-end');
      }, 150);
    }
  }
};
</script>

<style lang="less" scoped>
.game__tile {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #cecdcd;
  border-radius: 5px;
  aspect-ratio: 1;
  font-weight: bold;
  transition: transform 0.07s ease, background-color 0.3s ease;
  text-align: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  font-size: 14px;
  will-change: transform;


  &:hover {
    transform: scale(1.05);
  }

  @media (max-width: 400px) {
    font-size: clamp(10px, 3vw, 18px);
  }
  @keyframes appear {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  &--0 {
    background-color: #cec0b3;
  }

  &--2 {
    background-color: #eee4da;
  }

  &--4 {
    background-color: #ece0ca;
  }

  &--8 {
    background-color: #f3b07a;
  }

  &--16 {
    background-color: #f59462;
  }

  &--32 {
    background-color: #f57b5f;
  }

  &--64 {
    background-color: #f55d3b;
  }

  &--128 {
    background-color: #eccd71;
  }

  &--256 {
    background-color: #eccb61;
  }

  &--512 {
    background-color: #edc53f;
  }

  &--1024 {
    background-color: #edc52f;
  }

  &--2048 {
    background-color: #edc12e;
  }

  &--default {
    background-color: #3c3a32;
  }
}
</style>
