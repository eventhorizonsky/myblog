package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// ====== 缓存 ======

const animeCacheTTL = 24 * time.Hour

type animeCacheEntry struct {
	data      []byte
	timestamp time.Time
}

var (
	animeCache   = map[string]*animeCacheEntry{}
	animeCacheMu sync.RWMutex
)

func AnimeCollectionsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Cache-Control", "public, max-age=86400")

	apiURL := os.Getenv("BANGUMI_API_URL")
	if apiURL == "" {
		apiURL = "https://api.bgm.tv"
	}
	username := os.Getenv("BANGUMI_USERNAME")
	if username == "" {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{"error": "BANGUMI_USERNAME not set"})
		return
	}

	limit := r.URL.Query().Get("limit")
	if limit == "" {
		limit = "30"
	}
	offset := r.URL.Query().Get("offset")
	if offset == "" {
		offset = "0"
	}
	typeFilter := r.URL.Query().Get("type")

	cacheKey := strings.Join([]string{username, typeFilter, limit, offset}, "|")

	// 读缓存
	animeCacheMu.RLock()
	if e, ok := animeCache[cacheKey]; ok && time.Since(e.timestamp) < animeCacheTTL {
		data := e.data
		animeCacheMu.RUnlock()
		w.Write(data)
		return
	}
	animeCacheMu.RUnlock()

	data, err := fetchAnimeCollections(apiURL, username, typeFilter, limit, offset)
	if err != nil {
		log.Printf("[anime-collections] fetch error: %v", err)

		// 尝试返回过期缓存
		animeCacheMu.RLock()
		if e, ok := animeCache[cacheKey]; ok {
			stale := e.data
			animeCacheMu.RUnlock()
			log.Printf("[anime-collections] serving stale cache")
			w.Write(stale)
			return
		}
		animeCacheMu.RUnlock()

		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{"error": "fetch failed"})
		return
	}

	// 更新缓存
	animeCacheMu.Lock()
	animeCache[cacheKey] = &animeCacheEntry{data: data, timestamp: time.Now()}
	animeCacheMu.Unlock()

	w.Write(data)
}

func fetchAnimeCollections(apiURL, username, typeFilter, limit, offset string) (json.RawMessage, error) {
	url := fmt.Sprintf("%s/v0/users/%s/collections?subject_type=2&limit=%s&offset=%s",
		apiURL, username, limit, offset)
	if typeFilter != "" {
		url += "&type=" + typeFilter
	}

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "myblog/1.0 (https://github.com/eventhorizonsky/myblog)")

	log.Printf("[anime-collections] requesting %s", url)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("api returned status %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}
