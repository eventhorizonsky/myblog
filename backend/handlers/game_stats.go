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

// ---- 对外输出结构（仅包含前端需要的数据）----

type GameStatCard struct {
	GameStat   string `json:"game_stat"`
	BgImage    string `json:"bg_image"`
	LogoImage  string `json:"logo_image"`
	Image      string `json:"image"`
	Nickname   string `json:"nickname"`
	Key1       string `json:"key1"`
	Value1     string `json:"value1"`
	Key2       string `json:"key2"`
	Value2     string `json:"value2"`
	Key3       string `json:"key3"`
	Value3     string `json:"value3"`
	Key4       string `json:"key4,omitempty"`
	Value4     string `json:"value4,omitempty"`
	DataCount  int    `json:"data_count"`
}

type GameOverviewItem struct {
	Key   string `json:"key"`
	Desc  string `json:"desc"`
	Value string `json:"value"`
	Color string `json:"color"`
}

type SteamInfo struct {
	Nickname        string `json:"nickname"`
	Avatar          string `json:"avatar"`
	Level           int    `json:"level"`
	TotalGameCount  int    `json:"total_game_count"`
	TotalPlayerTime int    `json:"total_player_time"`
	TotalGamePrice  string `json:"total_game_price"`
}

type HardwareInfo struct {
	CPU       string `json:"cpu"`
	GPU       string `json:"gpu"`
	Board     string `json:"board"`
	PerfLevel string `json:"perf_level"`
}

type GameStatsResponse struct {
	GameOverview   []GameOverviewItem `json:"game_overview"`
	SteamInfo      *SteamInfo         `json:"steam_info"`
	HardwareInfo   *HardwareInfo      `json:"hardware_info"`
	FollowingCount int                `json:"following_count"`
	GameCount      int                `json:"game_count"`
	GameCards      []GameStatCard     `json:"game_cards"`
}

// ---- 缓存 ----

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

	gameStatsCacheMu.RLock()
	if gameStatsCache != nil && time.Since(gameStatsCache.FetchedAt) < cacheTTL {
		data := gameStatsCache.Data
		gameStatsCacheMu.RUnlock()
		w.Write(data)
		return
	}
	gameStatsCacheMu.RUnlock()

	data, err := fetchAndTransform()
	if err != nil {
		log.Printf("[game-stats] error: %v", err)
		gameStatsCacheMu.RLock()
		defer gameStatsCacheMu.RUnlock()
		if gameStatsCache != nil {
			w.Write(gameStatsCache.Data)
			return
		}
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{"error": "fetch failed"})
		return
	}

	gameStatsCacheMu.Lock()
	gameStatsCache = &cacheEntry{Data: data, FetchedAt: time.Now()}
	gameStatsCacheMu.Unlock()

	w.Write(data)
}

// ---- 拉取上游并提取字段 ----

func fetchAndTransform() (json.RawMessage, error) {
	raw, err := fetchMobileHome()
	if err != nil {
		return nil, err
	}

	// 解析上游原始响应
	var upstream struct {
		Result struct {
			GameCount      int `json:"game_count"`
			FollowingCount int `json:"following_count"`

			GameOverview []struct {
				Key   string `json:"key"`
				Desc  string `json:"desc"`
				Value string `json:"value"`
				Color string `json:"color"`
			} `json:"game_overview"`

			SteamIDInfo struct {
				Nickname        string `json:"nickname"`
				Avatar          string `json:"avatar"`
				Level           int    `json:"level"`
				TotalGameCount  int    `json:"total_game_count"`
				TotalPlayerTime int    `json:"total_player_time"`
				TotalGamePrice  string `json:"total_game_price"`
			} `json:"steam_id_info"`

			HardwareInfo struct {
				CPU       string `json:"cpu"`
				GPU       string `json:"gpu"`
				Board     string `json:"board"`
				PerfLevel string `json:"perf_level"`
			} `json:"hardware_info"`

			BMWAccountInfo *GameStatCard   `json:"bmw_account_info"`
			BindGameInfos  []GameStatCard  `json:"bind_game_infos"`
		} `json:"result"`
	}
	if err := json.Unmarshal(raw, &upstream); err != nil {
		return nil, fmt.Errorf("parse upstream: %w", err)
	}

	r := upstream.Result

	// 去重游戏卡
	seen := map[string]bool{}
	cards := make([]GameStatCard, 0, len(r.BindGameInfos)+1)
	addCard := func(c *GameStatCard) {
		if c == nil || c.GameStat == "" || seen[c.GameStat] {
			return
		}
		seen[c.GameStat] = true
		cards = append(cards, *c)
	}
	addCard(r.BMWAccountInfo)
	for i := range r.BindGameInfos {
		addCard(&r.BindGameInfos[i])
	}

	// 构建输出
	out := GameStatsResponse{
		GameOverview:   nil, // 下面处理
		SteamInfo:      nil, // 下面处理
		HardwareInfo:   nil,
		FollowingCount: r.FollowingCount,
		GameCount:      r.GameCount,
		GameCards:      cards,
	}

	// 账号概览
	if len(r.GameOverview) > 0 {
		items := make([]GameOverviewItem, len(r.GameOverview))
		for i, v := range r.GameOverview {
			items[i] = GameOverviewItem{
				Key: v.Key, Desc: v.Desc, Value: v.Value, Color: v.Color,
			}
		}
		out.GameOverview = items
	}

	// Steam 信息
	if r.SteamIDInfo.Nickname != "" {
		out.SteamInfo = &SteamInfo{
			Nickname:        r.SteamIDInfo.Nickname,
			Avatar:          r.SteamIDInfo.Avatar,
			Level:           r.SteamIDInfo.Level,
			TotalGameCount:  r.SteamIDInfo.TotalGameCount,
			TotalPlayerTime: r.SteamIDInfo.TotalPlayerTime,
			TotalGamePrice:  r.SteamIDInfo.TotalGamePrice,
		}
	}

	// 硬件
	if r.HardwareInfo.CPU != "" {
		out.HardwareInfo = &HardwareInfo{
			CPU:       r.HardwareInfo.CPU,
			GPU:       r.HardwareInfo.GPU,
			Board:     r.HardwareInfo.Board,
			PerfLevel: r.HardwareInfo.PerfLevel,
		}
	}

	result, err := json.Marshal(out)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// ---- 拉取上游原始数据 ----

func fetchMobileHome() (json.RawMessage, error) {
	ts := fmt.Sprintf("%d", time.Now().Unix())
	path := "/account/heybox_home_v2/"
	heyboxID := os.Getenv("HEIBOX_USER_ID")
	osVersion := os.Getenv("HEIBOX_OS_VERSION")
	if osVersion == "" {
		osVersion = "12"
	}
	url := fmt.Sprintf(
		"https://api.xiaoheihe.cn%s?userid=%s&heybox_id=%s&imei=f4c25853436d2cf0&device_info=V2199GA&nonce=etq0Vaj8q6UMu1qP5axGexTuGxlZAp9g&hkey=%s&os_type=Android&x_os_type=Android&x_client_type=mobile&os_version=%s&version=1.3.92&_time=%s&dw=640&channel=heybox&x_app=heybox",
		path, heyboxID, heyboxID, internal.MobileSign(path, ts), osVersion, ts,
	)

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Referer", "http://api.maxjia.com/")
	req.Header.Set("User-Agent", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36 ApiMaxJia/1.0")
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

	var statusCheck struct{ Status string }
	json.Unmarshal(body, &statusCheck)
	if statusCheck.Status != "ok" {
		return nil, fmt.Errorf("upstream status: %s", statusCheck.Status)
	}

	return body, nil
}
