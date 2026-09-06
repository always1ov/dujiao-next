package settingsapp

import (
	"testing"

	"github.com/dujiao-next/internal/constants"
)

// 店面模板归一化：只接受已注册的三套模板名，其余一律回退 classic。
// 前端 registry.ts 的 STOREFRONT_TEMPLATES 与这里必须保持一致。
func TestNormalizeStorefrontTemplate(t *testing.T) {
	cases := []struct {
		name string
		raw  interface{}
		want string
	}{
		{"classic", "classic", constants.StorefrontTemplateClassic},
		{"vault", "vault", constants.StorefrontTemplateVault},
		{"md3", "md3", constants.StorefrontTemplateMd3},
		{"md3 with surrounding spaces", "  md3  ", constants.StorefrontTemplateMd3},
		{"unknown template falls back", "material", constants.StorefrontTemplateDefault},
		{"upper case is not accepted", "MD3", constants.StorefrontTemplateDefault},
		{"empty string", "", constants.StorefrontTemplateDefault},
		{"nil", nil, constants.StorefrontTemplateDefault},
		{"non-string", 3, constants.StorefrontTemplateDefault},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := normalizeStorefrontTemplate(tc.raw); got != tc.want {
				t.Fatalf("normalizeStorefrontTemplate(%#v) = %q, want %q", tc.raw, got, tc.want)
			}
		})
	}
}

// 导航内置开关：四个键都默认开启；personal_center 关闭后只影响未登录访客看到的账户入口。
func TestNormalizeNavConfigBuiltinPersonalCenter(t *testing.T) {
	builtinOf := func(t *testing.T, value map[string]interface{}) map[string]interface{} {
		t.Helper()
		got := normalizeNavConfig(value)
		builtin, ok := got["builtin"].(map[string]interface{})
		if !ok {
			t.Fatalf("builtin missing or wrong type: %#v", got["builtin"])
		}
		return builtin
	}

	t.Run("defaults to enabled when absent", func(t *testing.T) {
		builtin := builtinOf(t, map[string]interface{}{})
		for _, key := range []string{"blog", "notice", "about", "personal_center"} {
			if builtin[key] != true {
				t.Fatalf("builtin[%q] = %#v, want true", key, builtin[key])
			}
		}
	})

	t.Run("personal_center can be switched off without touching the others", func(t *testing.T) {
		builtin := builtinOf(t, map[string]interface{}{
			"builtin": map[string]interface{}{"personal_center": false},
		})
		if builtin["personal_center"] != false {
			t.Fatalf("personal_center = %#v, want false", builtin["personal_center"])
		}
		for _, key := range []string{"blog", "notice", "about"} {
			if builtin[key] != true {
				t.Fatalf("builtin[%q] = %#v, want true", key, builtin[key])
			}
		}
	})

	t.Run("string and numeric flags are coerced", func(t *testing.T) {
		builtin := builtinOf(t, map[string]interface{}{
			"builtin": map[string]interface{}{"personal_center": "off", "about": 0, "blog": "yes"},
		})
		if builtin["personal_center"] != false || builtin["about"] != false || builtin["blog"] != true {
			t.Fatalf("unexpected coercion: %#v", builtin)
		}
	})

	t.Run("unknown builtin keys are dropped", func(t *testing.T) {
		builtin := builtinOf(t, map[string]interface{}{
			"builtin": map[string]interface{}{"wallet": true},
		})
		if _, exists := builtin["wallet"]; exists {
			t.Fatalf("unknown key should be dropped: %#v", builtin)
		}
	})
}
