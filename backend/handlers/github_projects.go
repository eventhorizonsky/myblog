package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

// GitHubRepo 置顶仓库的返回结构
type GitHubRepo struct {
	Name           string `json:"name"`
	Description    string `json:"description"`
	URL            string `json:"url"`
	Language       string `json:"language"`
	LanguageColor  string `json:"language_color"`
	Stars          int    `json:"stars"`
	Forks          int    `json:"forks"`
	HomepageURL    string `json:"homepage_url"`
	OpenGraphImage string `json:"og_image"`
}

// ====== 缓存 ======

type githubCacheEntry struct {
	data      []byte
	timestamp time.Time
}

var (
	githubCache   *githubCacheEntry
	githubCacheMu sync.RWMutex
	githubCacheTTL = 24 * time.Hour
)

// GithubProjectsHandler 返回 GitHub 置顶仓库列表
func GithubProjectsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// 读缓存
	githubCacheMu.RLock()
	if githubCache != nil && time.Since(githubCache.timestamp) < githubCacheTTL {
		data := githubCache.data
		githubCacheMu.RUnlock()
		w.Write(data)
		return
	}
	githubCacheMu.RUnlock()

	// 拉取最新数据
	data, err := fetchPinnedRepos()
	if err != nil {
		log.Printf("[github-projects] fetch error: %v", err)

		// 尝试返回过期缓存
		githubCacheMu.RLock()
		if githubCache != nil {
			stale := githubCache.data
			githubCacheMu.RUnlock()
			log.Printf("[github-projects] serving stale cache")
			w.Write(stale)
			return
		}
		githubCacheMu.RUnlock()

		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	// 更新缓存
	githubCacheMu.Lock()
	githubCache = &githubCacheEntry{data: data, timestamp: time.Now()}
	githubCacheMu.Unlock()

	w.Write(data)
}

func fetchPinnedRepos() ([]byte, error) {
	username := os.Getenv("GITHUB_USERNAME")
	if username == "" {
		return nil, fmt.Errorf("GITHUB_USERNAME not set")
	}

	token := os.Getenv("GITHUB_TOKEN")

	// GraphQL 查询
	gqlQuery := fmt.Sprintf(`query { user(login: "%s") { pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { name description url primaryLanguage { name color } stargazerCount forkCount homepageUrl openGraphImageUrl } } } } }`, username)

	reqBody, _ := json.Marshal(map[string]string{"query": gqlQuery})
	req, err := http.NewRequest("POST", "https://api.github.com/graphql", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "myblog/1.0")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	log.Printf("[github-projects] requesting pinned repos for %s", username)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read body failed: %w", err)
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("GitHub API returned status %d: %s", resp.StatusCode, string(body))
	}

	// 解析 GraphQL 响应
	var gqlResp struct {
		Data struct {
			User struct {
				PinnedItems struct {
					Nodes []struct {
						Name            string `json:"name"`
						Description     string `json:"description"`
						URL             string `json:"url"`
						PrimaryLanguage *struct {
							Name  string `json:"name"`
							Color string `json:"color"`
						} `json:"primaryLanguage"`
						StargazerCount   int    `json:"stargazerCount"`
						ForkCount        int    `json:"forkCount"`
						HomepageURL      string `json:"homepageUrl"`
						OpenGraphImageURL string `json:"openGraphImageUrl"`
					} `json:"nodes"`
				} `json:"pinnedItems"`
			} `json:"user"`
		} `json:"data"`
		Errors []struct {
			Message string `json:"message"`
		} `json:"errors"`
	}

	if err := json.Unmarshal(body, &gqlResp); err != nil {
		return nil, fmt.Errorf("parse response failed: %w", err)
	}

	if len(gqlResp.Errors) > 0 {
		return nil, fmt.Errorf("GraphQL error: %s", gqlResp.Errors[0].Message)
	}

	// 转换为输出结构
	repos := make([]GitHubRepo, 0, len(gqlResp.Data.User.PinnedItems.Nodes))
	for _, node := range gqlResp.Data.User.PinnedItems.Nodes {
		lang := ""
		langColor := ""
		if node.PrimaryLanguage != nil {
			lang = node.PrimaryLanguage.Name
			langColor = node.PrimaryLanguage.Color
		}
		desc := node.Description
		if desc == "" {
			desc = ""
		}
		repos = append(repos, GitHubRepo{
			Name:           node.Name,
			Description:    desc,
			URL:            node.URL,
			Language:       lang,
			LanguageColor:  langColor,
			Stars:          node.StargazerCount,
			Forks:          node.ForkCount,
			HomepageURL:    node.HomepageURL,
			OpenGraphImage: node.OpenGraphImageURL,
		})
	}

	result, err := json.Marshal(repos)
	if err != nil {
		return nil, fmt.Errorf("marshal result failed: %w", err)
	}

	return result, nil
}
