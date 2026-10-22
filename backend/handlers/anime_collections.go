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

// 抓取失败后的冷却时间：这段时间内直接返回错误，不再频繁打 Bangumi；
// 超过后允许立即重试，避免上游抖一下就整天没有数据。
const animeFailureCooldown = 60 * time.Second

type animeCacheEntry struct {
	data      []byte
	timestamp time.Time
}

var (
	animeCache   = map[string]*animeCacheEntry{}
	animeCacheMu sync.RWMutex

	// 每个 cacheKey 最近一次失败的时间，用于失败冷却
	animeLastFailure   = map[string]time.Time{}
	animeLastFailureMu sync.RWMutex
)

func AnimeCollectionsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

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

	// 读缓存（仅新鲜数据）
	animeCacheMu.RLock()
	if e, ok := animeCache[cacheKey]; ok && time.Since(e.timestamp) < animeCacheTTL {
		data := e.data
		animeCacheMu.RUnlock()
		// 只有成功数据才带长缓存头，浏览器可以放心缓存
		w.Header().Set("Cache-Control", "public, max-age=86400")
		w.Write(data)
		return
	}
	animeCacheMu.RUnlock()

	// 失败冷却：刚失败过就不要再打上游，直接报错且不缓存
	animeLastFailureMu.RLock()
	lastFail, failed := animeLastFailure[cacheKey]
	animeLastFailureMu.RUnlock()
	if failed && time.Since(lastFail) < animeFailureCooldown {
		serveStaleOrFail(w, cacheKey, "recently failed (cooldown)")
		return
	}

	data, err := fetchAnimeCollections(apiURL, username, typeFilter, limit, offset)
	if err != nil {
		log.Printf("[anime-collections] fetch error: %v", err)

		animeLastFailureMu.Lock()
		animeLastFailure[cacheKey] = time.Now()
		animeLastFailureMu.Unlock()

		serveStaleOrFail(w, cacheKey, "fetch failed")
		return
	}

	// 成功后清掉失败标记并更新缓存
	animeLastFailureMu.Lock()
	delete(animeLastFailure, cacheKey)
	animeLastFailureMu.Unlock()

	animeCacheMu.Lock()
	animeCache[cacheKey] = &animeCacheEntry{data: data, timestamp: time.Now()}
	animeCacheMu.Unlock()

	// 成功才允许浏览器长缓存；no-store 绝不能出现在成功响应上
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.Write(data)
}

// serveStaleOrFail 上游失败时的统一出口。
// 关键：任何失败响应都必须带 no-store（或尽量的短缓存），
// 否则浏览器会把「失败」本身缓存一整天——换个浏览器才好，正是这个原因。
func serveStaleOrFail(w http.ResponseWriter, cacheKey string, reason string) {
	animeCacheMu.RLock()
	e, ok := animeCache[cacheKey]
	animeCacheMu.RUnlock()

	w.Header().Set("Cache-Control", "no-store, must-revalidate")

	if ok {
		// 有过期数据就先用着，但不写入新鲜缓存
		log.Printf("[anime-collections] serving stale cache (%s)", reason)
		w.Write(e.data)
		return
	}

	log.Printf("[anime-collections] no cache available (%s)", reason)
	w.WriteHeader(http.StatusServiceUnavailable)
	json.NewEncoder(w).Encode(map[string]string{"error": "fetch failed"})
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
