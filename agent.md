# Project Agent Notes: Northstar

## Workspace Rule

This project is managed under `/Users/fantasy/Desktop/workspace/project001_northstar`.
All future code, docs, test artifacts, screenshots, deploy packages, and temporary files for Northstar should stay inside this folder.

Before development, read:

- `/Users/fantasy/Desktop/workspace/全局工作台.md`
- `/Users/fantasy/Desktop/workspace/全局复利与踩坑日志.md`
- `/Users/fantasy/Desktop/workspace/新项目SOP.md`

## Project Summary

Northstar is a Vue-based personality/divination test site with a Node/Express backend for test APIs, orders, admin management, and payment callbacks.

Live domain:

- `https://northstar.fantasy-games.org`

Known server:

- Host: `8.216.9.60`
- User: `root`
- SSH key: `/Users/fantasy/.ssh/id_ed25519`
- Static root: `/var/www/northstar`
- Backend root: `/opt/northstar/server`
- Service: `northstar.service`

## Local Commands

```bash
npm run check:syntax
npm run build:static
npm run serve:static
npm --prefix server audit --omit=dev
```

## Notes

- Payment setup details live in `PAYMENT_SETUP.md`.
- Deployment notes live in `DEPLOYMENT.md`.
- Do not expose `.env`, `northstar.db`, `.git`, or server secrets through the public static artifact.
- The active visual system is derived from
  `design-sources/antigravity-animation-design`. Run
  `npm run import:antigravity` after replacing the desktop source package.
- Keep the Antigravity developer parameter panel out of the public product.
  Reuse its WebGL particles, dark glass surfaces, blue focus color, compact
  controls, and reduced-motion fallback while preserving Northstar workflows.
