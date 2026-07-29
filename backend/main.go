package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"

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

	// API
	r.Get("/api/game-stats", handlers.GameStatsHandler)
	r.Get("/api/anime-collections", handlers.AnimeCollectionsHandler)
	r.Get("/api/site-config", siteConfigHandler)
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
	Title    string `json:"title"`
	IcpBeian string `json:"icp_beian,omitempty"`
}

func siteConfigHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	title := os.Getenv("SITE_TITLE")
	if title == "" {
		title = "EventHorizon Blog"
	}
	json.NewEncoder(w).Encode(siteConfig{
		Title:    title,
		IcpBeian: os.Getenv("ICP_BEIAN"),
	})
}

func getDistDir() string {
	if d := os.Getenv("DIST_DIR"); d != "" {
		return d
	}
	return filepath.Join("..", "frontend", "dist")
}
