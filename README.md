# My Astro Sutra — Frontend

**Brand:** My Astro Sutra (`myastrosutra.live` · `cookstudio.live`)  
**Backend:** Shared Spring Boot API at `/api/v1`

## Design (different from The Bharat Astro)

| Aspect | The Bharat Astro | My Astro Sutra |
|--------|------------------|----------------|
| Theme | Purple / cosmic / glassmorphism | Saffron / maroon / teal Vedic |
| Nav | Top bar + burger slide-in | Top brand bar + pill nav + **bottom mobile nav** |
| Hero | 3D orbs + full-page video | **Split layout** with ornate video frame |
| Typography | Default | Cormorant Garamond + DM Sans |
| Background | Star field + global video | Warm gradient + mandala pattern (no global video) |
| Preloader | Generic video | Brand video + ॐ symbol |

## Hero / preloader video

```
https://vz-8af39f0e-519.b-cdn.net/85cd5368-8eb6-4210-aa7e-1464f618cd3d/play_720p.mp4
```

## Local dev

```bash
cd frontend-myastrosutra-live
npm install
npm run dev
```

## Deploy (separate www folder, same backend)

```bash
bash deploy-frontend.sh frontend-myastrosutra-live /var/www/vaszeen/myastrosutra-www
```

Domains: add both to backend `CORS_ALLOWED_ORIGINS` and Nginx `server_name` (see `backend-springboot/myastrosutra.nginx.conf` and `MULTI_FRONTEND.md`).
