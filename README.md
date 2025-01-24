# Tri-Cities Vote

This site is currently being rebuilt with a modern stack:
- Next.js frontend
- PostgreSQL database with Prisma
- Improved state data integration
- Better election cycle management

The old Gatsby-based site's code has been preserved in the `legacy/` directory for reference during the modernization process.

See `REFACTOR.md` for detailed information about the modernization plan and progress.

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

---

## Setting up a new election


The Basics:

1. Back up the site for the previous election
2. Create a branch for the current election
3. Delete old content
4. Get election data for configuration
5. Normalize names
6. Get PDC data for configuration
7. Reimport candidates
8. Load donor data
9. Set up the election views

### Back up the site for the previous election.

Configure netlify to deploy the prior election on a subdomain for historical archive purposes.

For example, deploy the `2022` branch at `2022.tricitiesvote.com`

### Create a branch for the current election.

Rather than keeping a `main` branch up to date, we just always work within the year and iterate forward.

We generally use the election year (eg `2023`) for branch names and can use `2023-primary` to denote a primary election if we cover it.

Along with this, you should edit `static/admin/config.yml` to refer to this branch, eg:

```
backend:
  name: github
  repo: tumbleweird/tricitiesvote.com
  branch: '2023'
```

This makes it so netlify cms knows which branch your content edits are targeting.

### Delete old content and push the new branch.

`npm run clean` will do that.

You can then push that code as a clean starting place for this year. Sort of.

This script leaves in place the previous config files `load-config-election.json` and `load-config-names.json` because it's easier to see how those scripts are intended to look and edit them than have to make them from scratch.

### Get election data for configuration

You'll need some IDs for the configs used by the data scraping scripts:

1. Election type ('general' or 'primary')
2. Election ID
3. Race IDs

**RaceIDs** are available from the Candidate List aka "Who Filed" for each election:

For the 2022 general, you can find that here: https://voter.votewa.gov/CandidateList.aspx?e=877

The `e=877` bit is the **electionID** (in this case for the 2022 general election). Click the dropdown and select the election you want to view:

<img width="653" alt="Screenshot 2023-10-05 at 7 19 57 PM" src="https://github.com/tumbleweird/tricitiesvote.com/assets/110551/284acb22-2edc-4c18-a086-4db5779a3023">

You can then find the election ID in the same place in the `?e=NNN` querystring.

From that point, you may want to filter by county in order to get the set of candidates.

Click on a candidate's name to see their profile.

In the url you will find a string containing the race id:

<img width="802" alt="Screenshot 2023-10-05 at 7 12 38 PM" src="https://github.com/tumbleweird/tricitiesvote.com/assets/110551/1421de78-8d43-49b8-835d-99728f07057d">

Once you have the information, add the election type, election ID, and race IDs to the config

```
{
	"year": "2022",
	"type": "general",
	"pdcDataset": "kv7h-kjye",
	"electionId": "877",
	"query": "",
	"raceIds": ["121112", "121113"]
}
```

I'm pretty sure the same pdcDataset always works? I got that from [here](https://data.wa.gov/Politics/Contributions-to-Candidates-and-Political-Committe/kv7h-kjye/data) and it still seems to show data from the current year.

And I don't remember what `query` was for above but it doesn't seem important because last year's was blank? 

Anyway.

### Normalize names

Names in state data are based on whatever candidates enter without any consistency or normalization, so... we do that by creating a config file that maps variants of their name that can be found in the original data sets to a normalized version.

You'll see a list of all names after you run `npm run load`

The formatting approach we take is, unsurprisingly, to use "Firstname Lastname" with, uh, normal capitalization.

The following exceptions apply:

1. Some candidates are commonly known by a nickname or a middle name and if that's the case, we just use that for their first name (eg we'd have just used "Doc Hastings" rather than Richard "Doc" Hastings )
2. If they have a "Jr." appended we keep that, of course: "Firstname Lastname, Jr."
3. If their name has an accent on a letter, use the appropriate character for it.
4. I think that's it.

### Get PDC data for configuration

WA PDC provides all the info related to campaign finance and donations. You'll need to find a set of IDs in order to configure `load-config-names.json`:

Candidate IDs are... annoying. 

They come in three flavors as illustrated by these three examples which each use a different separator in the ID.

1. `FITZC--352` - two dashes
2. `GERRB  353` — two spaces
3. `JONEJH 352` — one space

Yes, it's absolutely wild.

You'll need to get the ID for each candidate and add them to `load-config-names.json`. Sorry it's a pain. Each object should end up looking like this:

```
{
		"formattedName": "Theresa Richardson",
		"pdcId": "RICHT--352",
		"altNames": [
			"THERESA RICHARDSON"
		]
},
```

### Reimport candidates 

To rerun the candidate load script after you have correctly configured the normalization of all candidates' names:

`npm run loadfresh`

### Load donor data

To bring in donor data from Washington PDC, make sure everything above is configured properly and then:

`npm run donors`

(Note that you'll want to run this regularly in order to bring in the latest data from candidates' financial reports, which are submitted weekly.)

Donor data represents another place that there could be a different name format used. If you run into trouble matching up candidates with donors, you may need to add another normalization matcher to your config.

Then you can again run:

`npm run loadfresh`

and then:

`npm run donors`

### Set up the election views

The tricitiesvote.com site uses netlify cms in order to empower normal people who die when they see JSON files to keep the election site up to date.

It also uses netlify cms to create the views of a given election and set up the relationships between the following object types:

- `guides` (a collection of specific races relevant to a county or city)
- `offices` 
- `races` 

There is a standard form for how things are titled and relationships are set up. I don't remember what it is, but you can easily crib from browsing the branches of prior elections.

If you'd prefer to configure everything in text files (which is a perfectly reasonable life choice, I'll mind you), you can kind of avoid dealing with the user interface by taking a peek at a previous election of the same general type and just making sure you set up the various JSON files appropriately in the following folders:

If you configure everything properly, the auto-built titles of `office` and `position` in candidate data files should ensure candidates are properly associated with the proper data.

If that doesn't work: welp!

# Questionnaires
