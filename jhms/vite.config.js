import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/yxyxy.github.io/', // 修改为GitHub Pages项目名称
  plugins: [vue()],
})
