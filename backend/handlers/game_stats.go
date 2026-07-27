package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"myblog-backend/internal"
)

type cacheEntry struct {
	Data      json.RawMessage `json:"data"`
	FetchedAt time.Time       `json:"fetched_at"`
}

var (
	gameStatsCache   *cacheEntry
	gameStatsCacheMu sync.RWMutex
	cacheTTL         = 24 * time.Hour
)

func GameStatsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// 检查缓存
	gameStatsCacheMu.RLock()
	if gameStatsCache != nil && time.Since(gameStatsCache.FetchedAt) < cacheTTL {
		data := gameStatsCache.Data
		gameStatsCacheMu.RUnlock()
		w.Write(data)
		return
	}
	gameStatsCacheMu.RUnlock()

	// 拉取新数据
	cookie := os.Getenv("HEIBOX_MOBILE_COOKIE")
	if cookie == "" {
		serveCached(w, "HEIBOX_MOBILE_COOKIE not set")
		return
	}

	data, err := fetchMobileHome(cookie)
	if err != nil {
		log.Printf("[game-stats] fetch error: %v", err)
		serveCached(w, "fetch failed, serving cache")
		return
	}

	// 更新缓存
	gameStatsCacheMu.Lock()
	gameStatsCache = &cacheEntry{Data: data, FetchedAt: time.Now()}
	gameStatsCacheMu.Unlock()

	w.Write(data)
}

func serveCached(w http.ResponseWriter, reason string) {
	gameStatsCacheMu.RLock()
	defer gameStatsCacheMu.RUnlock()
	if gameStatsCache != nil {
		w.Write(gameStatsCache.Data)
		return
	}
	w.WriteHeader(http.StatusServiceUnavailable)
	json.NewEncoder(w).Encode(map[string]string{"error": reason})
}

func fetchMobileHome(cookie string) (json.RawMessage, error) {
	ts := fmt.Sprintf("%d", time.Now().Unix())
	path := "/account/home_v2/"
	heyboxID := os.Getenv("HEIBOX_USER_ID")
	osVersion := os.Getenv("HEIBOX_OS_VERSION")
	if osVersion == "" {
		osVersion = "12"
	}
	url := fmt.Sprintf(
		"https://api.xiaoheihe.cn%s?heybox_id=%s&os_type=Android&os_version=%s&version=1.3.92&_time=%s&hkey=%s",
		path, heyboxID, osVersion, ts, internal.MobileSign(path, ts),
	)

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Referer", "http://api.maxjia.com/")
	req.Header.Set("User-Agent", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36 ApiMaxJia/1.0")
	req.Header.Set("Cookie", cookie)
	log.Printf("[game-stats] requesting heybox_id=%s", heyboxID)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct{ Status string }
	json.Unmarshal(body, &result)
	if result.Status != "ok" {
		return nil, fmt.Errorf("api status: %s", result.Status)
	}

	return body, nil
}
