# Tri-Cities Election guide

Local setup (VM and/or container recommended in case husky or other deps get loose…):

```
HUSKY=0 npm install --legacy-peer-deps
npx gatsby telemetry --disable

# Linux, optional: if ENOSPC below due to gratuitous file watchers…
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

npm start
```

Edit:

* `static/admin/config.yml` (if using alt repo/branch)
* `load-config-….json` files with current year metadata


Then something roughly like?

```
git checkout -b new-year
npm run loadfresh
```
