package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
)

// ArticleMeta 文章元数据
type ArticleMeta struct {
	ID       string   `json:"id"`
	Title    string   `json:"title"`
	Date     string   `json:"date"`
	Category string   `json:"category"`
	Excerpt  string   `json:"excerpt"`
	Type     string   `json:"type,omitempty"`
	Cover    string   `json:"cover,omitempty"`
	Images   []string `json:"images,omitempty"`
	LinkID   int      `json:"linkid,omitempty"`
	LinkTag  int      `json:"link_tag,omitempty"`
	Source   string   `json:"source,omitempty"`
}

// ArticleDetail 文章详情（元数据 + 原始 Markdown）
type ArticleDetail struct {
	ArticleMeta
	Content string `json:"content"`
}

// 内存索引
var (
	articlesMeta   []ArticleMeta   // 按日期倒序排列
	articlesDetail map[string]*ArticleDetail // id → detail
	articlesMu     sync.RWMutex
)

// LoadArticles 扫描并解析所有 Markdown 文章（启动时调用）
func LoadArticles(contentDir string) error {
	articlesMu.Lock()
	defer articlesMu.Unlock()

	articlesMeta = nil
	articlesDetail = make(map[string]*ArticleDetail)

	// 扫描 content/articles/**/*.md 和 doc/*.md
	dirs := []string{
		filepath.Join(contentDir, "articles"),
		filepath.Join(contentDir, "..", "doc"), // frontend/doc/
	}

	for _, dir := range dirs {
		_ = filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() || !strings.HasSuffix(info.Name(), ".md") {
				return nil
			}
			raw, err := os.ReadFile(path)
			if err != nil {
				return nil
			}
			meta, content := parseFrontmatter(string(raw))

			// 从路径提取文件名 id（用于兼容旧链接）
			fileID := filepath.Base(path)
			fileID = strings.TrimSuffix(fileID, ".md")

			// 对外 id 优先用 linkid：纯 ASCII（URL 不出现中文/百分号编码），
			// 且不随标题/日期变更而变（giscus 等按 pathname 关联的评论不会丢）
			id := fileID
			if meta.LinkID > 0 {
				id = strconv.FormatInt(int64(meta.LinkID), 10)
			}
			meta.ID = id

			// 计算摘要
			if meta.Excerpt == "" {
				meta.Excerpt = extractExcerpt(content, 120)
			}

			articlesMeta = append(articlesMeta, meta)
			articlesDetail[id] = &ArticleDetail{ArticleMeta: meta, Content: content}
			// 保留旧文件名 id 别名，旧链接（如 /api/articles/2026-08-29-3-6简评）不失效
			if fileID != id {
				articlesDetail[fileID] = articlesDetail[id]
			}

			return nil
		})
	}

	// 按日期倒序
	sort.Slice(articlesMeta, func(i, j int) bool {
		return articlesMeta[i].Date > articlesMeta[j].Date
	})

	log.Printf("[articles] loaded %d articles", len(articlesMeta))
	return nil
}

// ====== API Handlers ======

// ArticlesListHandler 返回文章元数据列表
func ArticlesListHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	articlesMu.RLock()
	meta := articlesMeta
	articlesMu.RUnlock()

	if meta == nil {
		meta = []ArticleMeta{}
	}
	json.NewEncoder(w).Encode(meta)
}

// ArticleDetailHandler 返回单篇文章详情（元数据 + 原始 Markdown）
func ArticleDetailHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// 从 URL 提取 id: /api/articles/:id
	id := strings.TrimPrefix(r.URL.Path, "/api/articles/")
	if id == "" {
		http.Error(w, `{"error":"missing id"}`, http.StatusBadRequest)
		return
	}

	articlesMu.RLock()
	detail, ok := articlesDetail[id]
	articlesMu.RUnlock()

	if !ok {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "article not found"})
		return
	}

	json.NewEncoder(w).Encode(detail)
}

// SearchHandler 搜索文章
func SearchHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if q == "" {
		json.NewEncoder(w).Encode([]ArticleMeta{})
		return
	}

	query := strings.ToLower(q)

	articlesMu.RLock()
	defer articlesMu.RUnlock()

	var results []ArticleMeta
	for _, meta := range articlesMeta {
		// 搜索标题 + 摘要 + 分类
		haystack := strings.ToLower(meta.Title + " " + meta.Excerpt + " " + meta.Category)
		if strings.Contains(haystack, query) {
			results = append(results, meta)
			continue
		}
		// 也搜索正文（如果已加载）
		if detail, ok := articlesDetail[meta.ID]; ok {
			contentLow := strings.ToLower(stripMarkdown(detail.Content))
			if strings.Contains(contentLow, query) {
				results = append(results, meta)
			}
		}
	}

	if results == nil {
		results = []ArticleMeta{}
	}

	json.NewEncoder(w).Encode(results)
}

// ====== 内部工具函数 ======

var frontmatterRe = regexp.MustCompile(`^---\n([\s\S]*?)\n---\n([\s\S]*)$`)

func parseFrontmatter(raw string) (ArticleMeta, string) {
	meta := ArticleMeta{Category: "general"}
	content := raw

	matches := frontmatterRe.FindStringSubmatch(raw)
	if matches == nil {
		// 无 frontmatter，全文作为内容
		return meta, raw
	}

	fmText := matches[1]
	content = matches[2]

	// 解析 YAML-like frontmatter
	var arrayKey string
	var arrayValues []string

	for _, line := range strings.Split(fmText, "\n") {
		// 数组项:   - "value"
		if strings.HasPrefix(line, "  - ") || strings.HasPrefix(line, "\t- ") {
			if arrayKey != "" {
				v := strings.TrimSpace(line[strings.Index(line, "- ")+2:])
				v = strings.Trim(v, `"'`)
				arrayValues = append(arrayValues, v)
			}
			continue
		}

		// 保存上一个数组
		if arrayKey != "" && len(arrayValues) > 0 {
			setMetaField(&meta, arrayKey, arrayValues)
			arrayValues = nil
			arrayKey = ""
		}

		// key: value
		ci := strings.Index(line, ":")
		if ci <= 0 {
			continue
		}
		k := strings.TrimSpace(line[:ci])
		v := strings.TrimSpace(line[ci+1:])

		if v == "" {
			arrayKey = k // 可能开始数组
		} else {
			v = strings.Trim(v, `"'`)
			setMetaField(&meta, k, v)
		}
	}
	// 最后一个数组
	if arrayKey != "" && len(arrayValues) > 0 {
		setMetaField(&meta, arrayKey, arrayValues)
	}

	return meta, content
}

func setMetaField(meta *ArticleMeta, key string, value interface{}) {
	switch key {
	case "title":
		meta.Title = value.(string)
	case "date":
		meta.Date = value.(string)
	case "category":
		meta.Category = value.(string)
	case "excerpt":
		meta.Excerpt = value.(string)
	case "type":
		meta.Type = value.(string)
	case "cover":
		meta.Cover = value.(string)
	case "source":
		meta.Source = value.(string)
	case "linkid":
		if v, ok := value.(string); ok {
			fmt.Sscanf(v, "%d", &meta.LinkID)
		}
	case "link_tag":
		if v, ok := value.(string); ok {
			fmt.Sscanf(v, "%d", &meta.LinkTag)
		}
	case "images":
		if arr, ok := value.([]string); ok {
			meta.Images = arr
		}
	}
}

func extractExcerpt(content string, maxLen int) string {
	// 去掉 markdown 语法后取纯文本
	text := stripMarkdown(content)
	text = strings.TrimSpace(text)
	runes := []rune(text)
	if len(runes) > maxLen {
		return string(runes[:maxLen]) + "..."
	}
	return text
}

func stripMarkdown(content string) string {
	// 简单去掉常见 markdown 标记
	re := regexp.MustCompile(`[#*` + "`" + `>\[\]()!\-\n\r|]+`)
	return re.ReplaceAllString(content, " ")
}

// ArticleCount 返回已加载文章数（用于健康检查）
func ArticleCount() int {
	articlesMu.RLock()
	defer articlesMu.RUnlock()
	return len(articlesMeta)
}
