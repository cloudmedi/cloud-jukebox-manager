# Cloudflare Kurulum Kılavuzu

Bu kılavuz, Cloud Media Player uygulamasının backend ve frontend bileşenlerini Cloudflare üzerinde nasıl deploy edeceğinizi açıklar.

## Backend Kurulumu (Cloudflare Workers)

1. Cloudflare hesabı oluşturun: [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)

2. Wrangler CLI'ı yükleyin:
```bash
npm install -g wrangler
```

3. Wrangler ile giriş yapın:
```bash
wrangler login
```

4. Backend dizinine gidin:
```bash
cd cloud-media-backend
```

5. wrangler.toml dosyasını kontrol edin (zaten mevcut):
```toml
[build]
command = "npm install --legacy-peer-deps && npm run build"
publish = "dist"
```

6. Deploy edin:
```bash
wrangler deploy
```

## Frontend Kurulumu (Cloudflare Pages)

1. Frontend dizinine gidin:
```bash
cd cloud-web-player
```

2. Build komutunu çalıştırın:
```bash
npm run build
```

3. Cloudflare Dashboard'a gidin:
   - Pages sekmesini açın
   - "Create a project" butonuna tıklayın
   - GitHub repository'nizi bağlayın
   - Build ayarlarını yapılandırın:
     - Framework preset: Vite
     - Build command: `npm run build`
     - Build output directory: `dist`
     - Environment variables:
       ```
       NODE_VERSION: 18
       ```

4. Deploy butonuna tıklayın

## Environment Variables

### Backend için:
- `MONGODB_URI`: MongoDB bağlantı URL'i
- `PORT`: Uygulama portu (default: 5000)

### Frontend için:
- `VITE_API_URL`: Backend API URL'i
- `VITE_WS_URL`: WebSocket bağlantı URL'i

## SSL ve Custom Domain Ayarları

1. Cloudflare DNS ayarlarından domain'inizi ekleyin
2. SSL/TLS ayarlarını "Full" olarak yapılandırın
3. Custom domain'i Pages projenize bağlayın

## Güvenlik Ayarları

1. Cloudflare'in güvenlik duvarını aktifleştirin
2. Rate limiting kuralları ekleyin
3. CORS ayarlarını yapılandırın

## Performans Optimizasyonu

1. Cloudflare'in cache özelliklerini kullanın
2. Auto-minify özelliğini aktifleştirin
3. Brotli sıkıştırmayı etkinleştirin

## Monitoring

1. Cloudflare Analytics'i aktifleştirin
2. Health check'leri yapılandırın
3. Alert'leri ayarlayın

## Sorun Giderme

Yaygın hatalar ve çözümleri:
- 502 Bad Gateway: Worker'ın timeout süresini kontrol edin
- CORS hataları: Güvenlik kurallarını gözden geçirin
- Build hataları: Node.js versiyonunu kontrol edin

## Önemli Notlar

- Production ortamında environment variable'ları Cloudflare dashboard üzerinden ayarlayın
- WebSocket bağlantıları için Cloudflare'in Durable Objects özelliğini kullanmayı düşünün
- Regular backuplar alın
- Monitoring araçlarını aktif kullanın

## Yardımcı Kaynaklar

- [Cloudflare Workers Dökümantasyonu](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Dökümantasyonu](https://developers.cloudflare.com/pages/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)