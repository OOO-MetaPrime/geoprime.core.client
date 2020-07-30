<template>
  <div class="dt-footer">
    <div class="dt-info" :class="{ 'dt-info-offset': page === 1 }">
      Показаны записи с {{ from }} по {{ to }} из {{ count }}
    </div>
    <div class="dt-size">
      <label>Записей на странице</label>
      <select class="form-control" :value="size" @change="onSizeChange">
        <option v-for="size of sizes" :key="size" :value="size">{{ size }}</option>
      </select>
    </div>
    <div class="dt-paginate">
      <a class="paginate_button previous" :class="{ disabled: isFirst }" @click.stop="changePage(page - 1)">←</a>

      <a class="paginate_button" :class="{ current: p === page }" v-for="p in pageChunk" :key="p" @click.stop="changePage(p)">{{ p }}</a>

      <a class="paginate_button next" :class="{ disabled: isLast }" @click.stop="changePage(page + 1)">→</a>
    </div>
  </div>
</template>

<script>
const sizes = [10, 25, 50, 100]

export default {
  props: {
    count: Number,
    page: Number,
    pageSize: {
      type: Number,
      default: 10
    }
  },
  data () {
    return {
      sizes,
      size: this.pageSize
    }
  },
  computed: {
    from () {
      if (this.count === 0) {
        return 0
      }
      return (this.page - 1) * this.size + 1
    },
    to () {
      return this.from + this.size - 1 > this.count
        ? this.count
        : this.from + this.size - 1
    },
    pageChunk () {
      if (this.pages < 2) {
        return [1]
      }
      if (this.pages < 3) {
        return [1, 2]
      }

      if (this.page === 1) {
        return [this.page, this.page + 1, this.page + 2]
      }

      if (this.page < this.pages) {
        return [this.page - 1, this.page, this.page + 1]
      }

      return [this.page - 2, this.page - 1, this.page]
    },
    pages () {
      return Math.ceil(this.count / this.size)
    },
    isFirst () {
      return this.page === 1
    },
    isLast () {
      return this.page === this.pages
    }
  },
  watch: {
    pageSize () {
      this.size = this.pageSize
    }
  },
  methods: {
    onSizeChange (event) {
      this.size = parseInt(event.target.value)
      this.$emit('change', { page: 1, size: this.size })
    },
    changePage (page) {
      if (page < 1 || page > this.pages) {
        return
      }
      if (page === this.page) {
        return
      }
      this.$emit('change', { page, size: this.size })
    }
  }
}
</script>

<style scoped>
.dt-footer {
  padding: 5px 8px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
}
.dt-footer:after {
  content: "";
  display: table;
  clear: both;
}
.dt-size label {
  margin-right: 15px;
}
.dt-size .form-control {
  display: inline;
  width: auto;
}
.dt-info,
.dt-size,
.dt-paginate {
  float: none;
  margin-left: 0;
  margin-right: 5px;
}
.dt-info-offset {
  margin-right: 12px;
}
.dt-size {
  padding: 0px 0;
}
.dt-footer {
  justify-content: center;
}

.dt-paginate .paginate_button {
  display: inline-block;
  padding: 7px 12px;
  min-width: 36px;
  margin-left: 2px;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  color: #333;
  border: 1px solid transparent;
  border-radius: 3px;
}
.dt-paginate .paginate_button:first-child {
  margin-left: 0;
}
.dt-paginate .paginate_button:hover,
.dt-paginate .paginate_button:focus {
  background-color: #f5f5f5;
}
.dt-paginate .paginate_button.current,
.dt-paginate .paginate_button.current:hover,
.dt-paginate .paginate_button.current:focus {
  color: #fff;
  background-color: #0766A6;
  cursor: initial;
}
.dt-paginate .paginate_button.disabled,
.dt-paginate .paginate_button.disabled:hover,
.dt-paginate .paginate_button.disabled:focus {
  cursor: default;
  background-color: transparent;
  color: #bbb;
}
</style>
