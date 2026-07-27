package internal

import (
	"crypto/md5"
	"fmt"
	"strings"
)

// MobileSign 手机端 hkey 签名（版本 v1.3.92）
// hkey = MD5(MD5(path + "/bfhdkud_time=" + time).replace("a","app").replace("0","app"))[0:10]
func MobileSign(path string, timestamp string) string {
	// 去掉末尾 /
	p := strings.TrimSuffix(path, "/")
	// 第一轮
	seed := p + "/bfhdkud_time=" + timestamp
	h1 := fmt.Sprintf("%x", md5.Sum([]byte(seed)))
	// 替换 a→app, 0→app
	h1 = strings.ReplaceAll(h1, "a", "app")
	h1 = strings.ReplaceAll(h1, "0", "app")
	// 第二轮
	h2 := fmt.Sprintf("%x", md5.Sum([]byte(h1)))
	if len(h2) > 10 {
		h2 = h2[:10]
	}
	return h2
}
