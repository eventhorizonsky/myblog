import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: () => import("@/pages/HomePage.vue"),
    },
    {
      path: "/articles",
      component: () => import("@/pages/ArticlesPage.vue"),
    },
    {
      path: "/articles/:id",
      component: () => import("@/pages/ArticleDetail.vue"),
      props: true,
    },
    {
      path: "/games",
      component: () => import("@/pages/GamesPage.vue"),
    },
    {
      path: "/anime",
      component: () => import("@/pages/AnimePage.vue"),
    },
    {
      path: "/projects",
      component: () => import("@/pages/ProjectsPage.vue"),
    },
  ],
});

export default router;
