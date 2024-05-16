# React Conf Faces

See yourself as a part of the community at [React Conf 2024](https://www.youtube.com/watch?v=T8TZQ6k4SLE) using a snapshot of one of the slides from the keynote.

- A Remix app powered by Cloudflare Pages.
- OG Image snapshotting powered by Cloudflare Browser bindings and Durable Objects

## Development

Run the Vite dev server:

```sh
npm run dev
```

To run Wrangler:

```sh
npm run build
npm run start
```

## Deployment

- Deploy main app to Cloudflare Pages
- Manually deploy the snapshot worker to Cloudflare Workers, since you can't reference Browsers in Cloudflare Pages projects yet 🙃
