# Tri-Cities Election guide

This is the source code behind <https://tricitiesvote.com/>.

## Local setup (for site developers)

To bring up the repo locally (VM and/or container recommended in case husky or other deps get loose…), clone it and then:

```
HUSKY=0 npm install --legacy-peer-deps
npx gatsby telemetry --disable

# Linux, optional: if ENOSPC below due to gratuitous file watchers…
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

npm start
```


## Updating the content

Files you'll likely need to edit:

* `static/admin/config.yml` (if using alt repo/branch)
* `load-config-….json` files with current year metadata

Then something roughly like?

```
git checkout -b new-year
npm run loadfresh
```
