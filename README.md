# TagForge

Minecraft sunucuları için profesyonel tag/badge/rank PNG görselleri oluşturan tarayıcı tabanlı araç.

## Özellikler

- Pixel-perfect rendering (küçük tag'ler için ideal)
- Transparent PNG export (alpha channel desteği)
- Minecraft renk kodları desteği (§0 - §f)
- Gradient text efektleri
- Glow, shadow ve outline efektleri
- Özel ikon ekleme desteği
- ItemsAdder uyumlu export
- localStorage ile proje kaydetme
- JSON ile import/export
- Mobil uyumlu tasarım

## Nasıl Çalıştırılır

### Yerelde Çalıştırma

Herhangi bir HTTP sunucusu ile:

```bash
# Python ile
python -m http.server 8000

# Node.js ile
npx http-server

# VS Code Live Server eklentisi ile
```

Tarayıcıda `http://localhost:8000` adresine gidin.

### GitHub Pages'e Deploy

1. Projenizi GitHub'a push edin
2. Repository Settings > Pages bölümüne gidin
3. Source olarak `main` branch'ini seçin
4. Kaydedin ve sitenizin yayına girmesini bekleyin

URL formatı: `https://kullaniciadi.github.io/depo-adi/`

## PNG Nasıl Oluşturulur

1. Editor bölümünde tag metnini ve stilini düzenleyin
2. Sağ taraftaki preview'dan sonucu kontrol edin
3. Canvas boyutunu seçin (varsayılan: 122x15)
4. Export bölümünden ölçek seçin (1x, 2x, 4x)
5. Dosya adını girin
6. "DOWNLOAD PNG" butonuna tıklayın

## ItemsAdder'da Kullanım

1. Export ettiğiniz PNG dosyasını resource pack'inize ekleyin
2. "Generate ItemsAdder Config" butonuna tıklayın
3. Namespace ve texture name girin
4. Oluşturulan YAML config'i kopyalayın
5. ItemsAdder config dosyanıza ekleyin

Örnek ItemsAdder yapılandırması:

```yaml
items:
  tag_admin:
    display_name: "Yönetici"
    resource:
      material: PAPER
      generate: false
      textures:
        - myplugin/tag_admin
```

## Yeni Preset Nasıl Eklenir

`js/presets.js` dosyasında `TagPresets` nesnesine yeni bir entry ekleyin:

```javascript
YENI_PRESET: {
  text: 'YENİ ETİKET',
  fontSize: 8,
  textColor: '#FFFFFF',
  textOutline: true,
  outlineColor: '#000000',
  outlineSize: 1,
  bgType: 'solid',
  bgColor: '#9B5CFF',
  bgOpacity: 100,
  paddingL: 4,
  paddingR: 4,
  paddingT: 1,
  paddingB: 1,
  bold: true,
  italic: false,
  underline: false,
  shadow: false,
  glow: false,
  glowColor: '#9B5CFF',
  glowStrength: 3,
  glowOpacity: 50,
  gradient: false,
  gradientColor1: '#FFFFFF',
  gradientColor2: '#9B5CFF',
  gradientDir: 'horizontal',
  borderEnabled: false,
  borderColor: '#000000',
  borderWidth: 1,
  borderRadius: 0,
  shape: 'rectangle',
  iconPosition: 'left',
  iconSpacing: 2
}
```

## Yeni Font Nasıl Eklenir

1. Font dosyasını (`.woff2`, `.woff`, veya `.ttf`) `assets/fonts/` klasörüne koyun
2. `index.html` dosyasındaki `<style>` bölümüne `@font-face` kuralı ekleyin:

```css
@font-face {
  font-family: 'YeniFont';
  src: url('assets/fonts/yenifont.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
}
```

3. `js/editor.js` dosyasındaki `FONTS` dizisine font adını ekleyin:

```javascript
FONTS: ['Minecraft', 'YeniFont', 'Pixel', ...]
```

4. `js/canvas.js` dosyasındaki `getFontFamily` fonksiyonunda yeni font için mapping ekleyin:

```javascript
'YeniFont': "'YeniFont', monospace"
```

## Teknolojiler

- HTML5
- CSS3 (Dark theme, glassmorphism)
- Vanilla JavaScript (ES6+)
- Canvas API
- localStorage
- Google Fonts (Press Start 2P, Inter)

## Lisans

MIT License

## Gizlilik

Tüm işlemler tarayıcınızda gerçekleşir. Hiçbir görsel veya veri sunucuya gönderilmez.
