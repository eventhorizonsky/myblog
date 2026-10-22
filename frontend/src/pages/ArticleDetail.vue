<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { fetchArticle, fetchArticles, renderMarkdown } from "@/utils/markdown";
import type { ArticleMeta } from "@/types";
import Card from "@/components/ui/Card.vue";
import Badge from "@/components/ui/Badge.vue";
import Lightbox, { type LightboxImage } from "@/components/ui/Lightbox.vue";
import { CATEGORY_CONFIG } from "@/types";
import { ArrowLeft, ExternalLink, Calendar, ChevronLeft, ChevronRight, Loader2, AlertCircle, ImageIcon } from "lucide-vue-next";
import GiscusComments from "@/components/GiscusComments.vue";
import { GISCUS_CONFIG } from "@/config/giscus";

const props = defineProps<{ id: string }>();
const router = useRouter();

const meta = ref<ArticleMeta | null>(null);
const html = ref("");
const loading = ref(false);
const error = ref(false);

async function load() {
  loading.value = true;
  error.value = false;
  try {
    const result = await fetchArticle(props.id);
    meta.value = result.meta;
    html.value = renderMarkdown(result.content);
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

// 路由参数变化时重新加载
watch(() => props.id, () => { load(); });
onMounted(() => { load(); });

// 画廊模式
const showGallery = computed(() => meta.value?.type === "blocks" && (meta.value?.images?.length || 0) > 0);
const galleryImages = computed(() => meta.value?.images || []);
// 文章页展示用缩略图；与 images 一一对应，缺失时退回原图
const galleryThumbs = computed(() => {
  const origin = meta.value?.images || [];
  const thumb = meta.value?.thumbs || [];
  return origin.map((u, i) => thumb[i] || u);
});
const currentImg = ref(0);

function prevImg() {
  currentImg.value = (currentImg.value - 1 + galleryImages.value.length) % galleryImages.value.length;
}
function nextImg() {
  currentImg.value = (currentImg.value + 1) % galleryImages.value.length;
}

// 灯箱
const lightboxOpen = ref(false);
const lightboxImages = ref<LightboxImage[]>([]);
const lightboxIndex = ref(0);

function openLightbox(images: LightboxImage[], index: number) {
  lightboxImages.value = images;
  lightboxIndex.value = index;
  lightboxOpen.value = true;
}

function openGalleryLightbox(index: number) {
  currentImg.value = index;
  // 灯箱用原图，缩略图作为占位
  openLightbox(
    galleryImages.value.map((src, i) => ({ src, thumb: galleryThumbs.value[i] })),
    index,
  );
}

const articleRef = ref<HTMLElement | null>(null);

// 封面展示用缩略图：cover 与 images[0] 通常是同一张，优先取 thumbs 里对应那张
const coverThumb = computed(() => {
  const origin = meta.value?.images || [];
  const thumb = meta.value?.thumbs || [];
  const cover = meta.value?.cover || "";
  const i = origin.indexOf(cover);
  if (i >= 0 && thumb[i]) return thumb[i];
  // 没有对应 thumbs 时，用原图地址拼压缩参数（仅小黑盒 CDN 生效）
  return cover;
});

// 收集正文中的图片（排除 emoji 图标）
// 展示用缩略图，灯箱要原图：优先取 data-origin（脚本写入的原图地址）
function collectContentImages(): LightboxImage[] {
  const el = articleRef.value;
  if (!el) return [];
  return Array.from(el.querySelectorAll<HTMLImageElement>("img"))
    .filter((img) => !img.classList.contains("emoji-inline"))
    .map((img) => ({
      // 灯箱加载原图；没有 data-origin 的（如外部图片）退回当前地址
      src: img.dataset.origin || img.currentSrc || img.src,
      // 正文里显示的是缩略图，作为灯箱加载原图时的占位
      thumb: img.currentSrc || img.src,
      alt: img.alt || "",
    }));
}

function openContentLightbox(target: HTMLImageElement) {
  const images = collectContentImages();
  const current = target.currentSrc || target.src;
  const index = images.findIndex((im) => im.thumb === current || im.src === current);
  if (index >= 0) openLightbox(images, index);
}

function onArticleClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.tagName !== "IMG" || target.classList.contains("emoji-inline")) return;
  // 图片被链接包裹时保留链接行为
  if (target.closest("a")) return;
  openContentLightbox(target as HTMLImageElement);
}

// ====== 侧栏：正文图片导航 ======
// 长文常有几十张图，侧栏给个可点击的小索引，点一条跳转到对应图片
const contentImageCount = ref(0);
// 图片在正文中的序号（1-based），点「第 N 张」滚到第 N 张图
function scrollToContentImage(n: number) {
  const el = articleRef.value;
  if (!el) return;
  const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"))
    .filter((img) => !img.classList.contains("emoji-inline"));
  const target = imgs[n - 1];
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// 正文渲染后统计图片数量
watch(html, async () => {
  await nextTick();
  const el = articleRef.value;
  if (!el) { contentImageCount.value = 0; return; }
  contentImageCount.value = Array.from(el.querySelectorAll("img"))
    .filter((img) => !img.classList.contains("emoji-inline")).length;
});

// ====== 侧栏：同分类相关文章 ======
const related = ref<ArticleMeta[]>([]);

async function loadRelated() {
  try {
    const all = await fetchArticles();
    const cat = meta.value?.category;
    related.value = all
      .filter((a) => a.id !== meta.value?.id && a.category === cat)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 6);
  } catch {
    related.value = [];
  }
}

watch(meta, () => { loadRelated(); });

// 移动端侧栏折叠
const metaOpen = ref(false);
const relatedOpen = ref(false);
</script>

<template>
  <!-- 宽屏给三栏留出空间（15rem + 56rem + 15rem + 间距 ≈ 90rem），窄屏由内部 max-w 收窄 -->
  <div class="max-w-[92rem] mx-auto px-4 sm:px-6 py-8">
    <button
      @click="router.push('/articles')"
      class="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
    >
      <ArrowLeft class="h-4 w-4" />
      返回文章列表
    </button>

    <!-- 加载态 -->
    <div v-if="loading" class="flex items-center gap-2 text-sm text-muted-foreground py-16">
      <Loader2 class="h-4 w-4 animate-spin" /> 正在加载...
    </div>

    <!-- 错误/未找到 -->
    <div v-else-if="error || !meta" class="text-center py-16 text-muted-foreground">
      <AlertCircle class="h-12 w-12 mx-auto mb-3 opacity-30" />
      <p class="text-lg mb-2">文章未找到</p>
      <p class="text-sm">ID: {{ id }}</p>
      <button @click="load()" class="mt-4 text-primary hover:underline text-sm">重新加载</button>
      <br />
      <button @click="router.push('/articles')" class="mt-2 text-muted-foreground hover:underline text-sm">返回文章列表</button>
    </div>

    <template v-else>
      <!-- 三栏布局：左（元信息/图片导航） · 中（正文） · 右（相关文章）
           宽屏 xl 以上才并排显示侧栏；窄屏自动堆叠为单列，正文单独收窄以保证可读性 -->
      <div class="mx-auto w-full max-w-[52rem] xl:max-w-none
                  xl:grid xl:grid-cols-[15rem_minmax(0,56rem)_15rem] xl:gap-8
                  xl:justify-center items-start">

        <!-- ===== 左栏 ===== -->
        <aside class="xl:sticky xl:top-6 order-2 xl:order-1">
          <!-- 元信息卡片 -->
          <Card class="overflow-hidden">
            <div class="p-4">
              <p class="text-xs font-medium text-muted-foreground mb-2">文章信息</p>
              <dl class="space-y-2 text-sm">
                <div class="flex items-center justify-between gap-2">
                  <dt class="text-muted-foreground">分类</dt>
                  <dd>
                    <Badge variant="outline" :class="['text-xs px-1.5 py-0', CATEGORY_CONFIG[meta.category]?.color || '']">
                      {{ CATEGORY_CONFIG[meta.category]?.label || meta.category }}
                    </Badge>
                  </dd>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <dt class="text-muted-foreground">发布</dt>
                  <dd class="flex items-center gap-1 text-xs">
                    <Calendar class="h-3 w-3" />{{ meta.date }}
                  </dd>
                </div>
                <div v-if="contentImageCount > 0" class="flex items-center justify-between gap-2">
                  <dt class="text-muted-foreground">图片</dt>
                  <dd class="text-xs flex items-center gap-1">
                    <ImageIcon class="h-3 w-3" />{{ contentImageCount }} 张
                  </dd>
                </div>
              </dl>
              <a
                v-if="meta.source"
                :href="meta.source"
                target="_blank"
                rel="noopener"
                class="mt-3 pt-3 border-t flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink class="h-3 w-3" />查看小黑盒原文
              </a>
            </div>
          </Card>

          <!-- 图片导航：长文几十张图时，点序号直接跳转 -->
          <Card v-if="contentImageCount > 1" class="mt-4 overflow-hidden">
            <div class="p-4">
              <p class="text-xs font-medium text-muted-foreground mb-2">
                图片导航 <span class="text-muted-foreground/60">({{ contentImageCount }})</span>
              </p>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="n in contentImageCount"
                  :key="n"
                  @click="scrollToContentImage(n)"
                  class="h-6 min-w-6 px-1.5 rounded text-[11px] tabular-nums
                         bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground
                         transition-colors"
                  :title="`跳到第 ${n} 张`"
                >
                  {{ n }}
                </button>
              </div>
            </div>
          </Card>
        </aside>

        <!-- ===== 中栏：正文 ===== -->
        <div class="order-1 xl:order-2 min-w-0">
          <!-- Header -->
          <div class="mb-8">
            <div class="flex items-center gap-2 mb-3">
              <Badge variant="outline" :class="['text-xs px-1.5 py-0', CATEGORY_CONFIG[meta.category]?.color || '']">
                {{ CATEGORY_CONFIG[meta.category]?.label || meta.category }}
              </Badge>
              <span class="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar class="h-3.5 w-3.5" />
                {{ meta.date }}
              </span>
              <a
                v-if="meta.source"
                :href="meta.source"
                target="_blank"
                rel="noopener"
                class="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 ml-auto"
              >
                <ExternalLink class="h-3 w-3" />
                原文
              </a>
            </div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight" v-html="meta.title" />
          </div>

      <!-- 画廊模式：图文分开（blocks 类型） -->
      <div v-if="showGallery" class="space-y-6">
        <Card class="overflow-hidden">
          <div class="relative bg-muted/50">
            <img
              :src="galleryThumbs[currentImg]"
              class="w-full max-h-[70vh] object-contain mx-auto cursor-zoom-in"
              loading="lazy"
              decoding="async"
              style="min-height: 300px"
              @click="openGalleryLightbox(currentImg)"
            />            <button
              v-if="galleryImages.length > 1"
              @click.stop="prevImg"
              class="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow transition-colors"
            >
              <ChevronLeft class="h-5 w-5" />
            </button>
            <button
              v-if="galleryImages.length > 1"
              @click.stop="nextImg"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow transition-colors"
            >
              <ChevronRight class="h-5 w-5" />
            </button>
            <div class="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/80 text-xs">
              {{ currentImg + 1 }} / {{ galleryImages.length }}
            </div>
          </div>
          <div v-if="galleryImages.length > 1" class="flex gap-1 p-2 overflow-x-auto">
            <div
              v-for="(img, i) in galleryThumbs"
              :key="i"
              @click="openGalleryLightbox(i)"
              :class="[
                'h-14 w-14 shrink-0 rounded cursor-pointer overflow-hidden border-2 transition-colors',
                i === currentImg ? 'border-primary' : 'border-transparent hover:border-border',
              ]"
            >
              <img :src="img" class="h-full w-full object-cover" loading="lazy" />
            </div>
          </div>
        </Card>

        <Card v-if="html">
          <div class="p-6 sm:p-8">
            <article
              ref="articleRef"
              class="prose prose-neutral dark:prose-invert max-w-none
                prose-headings:font-semibold prose-a:text-primary
                prose-img:rounded-lg prose-pre:bg-muted prose-code:text-sm
                [&_br]:block [&_br]:content-[''] [&_br]:mt-3"
              v-html="html"
              @click="onArticleClick"
            />
          </div>
        </Card>
      </div>

      <!-- 普通模式：顶部封面区 -->
      <template v-else>
        <div
          v-if="meta.cover"
          class="relative w-full overflow-hidden rounded-xl border bg-muted mb-6 cursor-zoom-in"
          style="aspect-ratio: 16/9"
        >
          <img
            :src="coverThumb"
            :alt="meta.title"
            class="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
            @click="openLightbox([{ src: meta.cover as string, thumb: coverThumb, alt: meta.title }], 0)"
          />
        </div>

        <Card>
          <div class="p-6 sm:p-8">
            <article
              ref="articleRef"
              class="prose prose-neutral dark:prose-invert max-w-none
                prose-headings:font-semibold prose-a:text-primary
                prose-img:rounded-lg prose-pre:bg-muted prose-code:text-sm
                prose-img:cursor-zoom-in"
              v-html="html"
              @click="onArticleClick"
            />
          </div>
        </Card>
      </template>

      <!-- GitHub Discussions 评论 -->
      <GiscusComments :config="GISCUS_CONFIG" :article-id="meta.id" />
        </div>

        <!-- ===== 右栏：同分类相关文章 ===== -->
        <aside class="xl:sticky xl:top-6 order-3">
          <Card v-if="related.length" class="overflow-hidden">
            <div class="p-4">
              <p class="text-xs font-medium text-muted-foreground mb-3">同类文章</p>
              <ul class="space-y-3">
                <li v-for="a in related" :key="a.id">
                  <router-link
                    :to="`/articles/${a.id}`"
                    class="group block"
                  >
                    <p class="text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {{ a.title }}
                    </p>
                    <p class="mt-0.5 text-[11px] text-muted-foreground">{{ a.date }}</p>
                  </router-link>
                </li>
              </ul>
              <router-link
                to="/articles"
                class="mt-3 pt-3 border-t flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft class="h-3 w-3" />全部文章
              </router-link>
            </div>
          </Card>
        </aside>
      </div>
    </template>

    <Lightbox
      :open="lightboxOpen"
      :images="lightboxImages"
      :initial-index="lightboxIndex"
      @close="lightboxOpen = false"
    />
  </div>
</template>
