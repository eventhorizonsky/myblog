package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"myblog-backend/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "OPTIONS"},
	}))

	// 加载文章索引
	contentDir := getContentDir()
	if err := handlers.LoadArticles(contentDir); err != nil {
		log.Printf("[articles] WARNING: failed to load articles: %v", err)
	}

	// API
	r.Get("/api/game-stats", handlers.GameStatsHandler)
	r.Get("/api/anime-collections", handlers.AnimeCollectionsHandler)
	r.Get("/api/site-config", siteConfigHandler)
	r.Get("/api/github-projects", handlers.GithubProjectsHandler)
	r.Get("/api/search", handlers.SearchHandler)
	r.Get("/api/articles", handlers.ArticlesListHandler)
	r.Get("/api/articles/*", handlers.ArticleDetailHandler)
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

			// 静态文件 + SPA fallback
	distDir := getDistDir()
	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		p := filepath.Join(distDir, r.URL.Path)
		if _, err := os.Stat(p); err == nil {
			http.ServeFile(w, r, p)
			return
		}
		http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
	})
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on :%s (dist: %s)", port, distDir)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

type siteConfig struct {
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	IcpBeian    string `json:"icp_beian,omitempty"`
}

func siteConfigHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	title := os.Getenv("SITE_TITLE")
	if title == "" {
		title = "EventHorizon Blog"
	}
	json.NewEncoder(w).Encode(siteConfig{
		Title:       title,
		Description: os.Getenv("SITE_DESCRIPTION"),
		IcpBeian:    os.Getenv("ICP_BEIAN"),
	})
}

func getDistDir() string {
	if d := os.Getenv("DIST_DIR"); d != "" {
		return d
	}
	return resolveLocalPath("frontend", "dist")
}

func getContentDir() string {
	if d := os.Getenv("CONTENT_DIR"); d != "" {
		return d
	}
	return resolveLocalPath("frontend", "content")
}

// resolveLocalPath 相对于二进制所在目录解析路径（兼容 go run 和打包后运行）
func resolveLocalPath(parts ...string) string {
	// 优先用二进制路径
	if exe, err := os.Executable(); err == nil {
		dir := filepath.Dir(exe)
		// go run 的二进制位于 Temp 或 GOCACHE(go-build) 缓存目录，需要回退到 CWD
		if isGoRunCache(dir) {
			return filepath.Join(append([]string{".."}, parts...)...)
		}
		// 打包后的二进制放在 backend/ 下，其父目录即项目根
		return filepath.Join(append([]string{filepath.Dir(dir)}, parts...)...)
	}
	// 回退：相对于当前工作目录
	return filepath.Join(append([]string{".."}, parts...)...)
}

// isGoRunCache 判断二进制是否位于 go run 的临时/缓存目录
func isGoRunCache(dir string) bool {
	candidates := []string{os.TempDir()}
	if gc := os.Getenv("GOCACHE"); gc != "" {
		candidates = append(candidates, gc)
	} else if home, err := os.UserHomeDir(); err == nil {
		candidates = append(candidates, filepath.Join(home, "AppData", "Local", "go-build"))
	}
	for _, c := range candidates {
		if c != "" && strings.Contains(dir, c) {
			return true
		}
	}
	return false
}
