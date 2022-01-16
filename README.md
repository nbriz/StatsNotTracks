# StatsNotTracks

Privacy focused web analytics middleware for [express.js](https://expressjs.com/). Records web site/app statistics w/out compromising user privacy. No tracking && no sharing data w/big tech.

**--- !!! --- !!! --- !!! --- !!! --- !!! ---**
**WORK IN PROGRESS --- THIS IS NOT FINISHED**
**--- !!! --- !!! --- !!! --- !!! --- !!! ---**

# Why

b/c Google Analytics is [surveillance capitalism](https://en.wikipedia.org/wiki/Surveillance_capitalism) && surveillance capitalism [is bad](https://www.youtube.com/watch?v=hIXhnWUmMvw).

In my never ending quest to avoid all surveillance tools/platforms (a seemingly impossible mission ¯\\_ (ツ)_/¯ but i can [try my best](https://howthey.watch/us/short-term-solutions.html)) i started looking into alternatives to Google Analytics, i figured there must be libraries out there that help web devs like me keep track of web traffic stats without compromising the privacy (&& online agency) of the folks visiting my pages. Over the years i've found a few cool alternatives like [Matomo](https://matomo.org/) (formerly [Piwik](https://piwik.com/)), [Plausible](https://plausible.io/) && [Simple Analytics](https://simpleanalytics.com/). These all seem pretty solid in terms of privacy ethics: check out Matomo's sample [Privacy Policy](https://matomo.org/privacy-policy/), Plausible also has a great/simple write-up on [their approach to privacy](https://plausible.io/privacy-focused-web-analytics) which I used as a general guide when writing my code. My problem was that these were all paid 3rd party services && i was looking for an open source library/framework i could easily implement into my server stack myself. I've used various "stacks" over the years, but for the past few years most of my personal/client projects have been [node.js](https://nodejs.org/en/) servers built w/[express.js](https://expressjs.com/), so i was hoping to find some flexible/hackable express middleware... which i couldn't find, so i wrote one.

## Privacy

As it turns out, recording web analytics without compromising privacy can be pretty tricky, even when u think u're "anonymizing" ur visitor's data... [it can be de-anonymized fairly easily](https://arstechnica.com/tech-policy/2009/09/your-secrets-live-online-in-databases-of-ruin/). Below are the steps i've taken to keep things ethical, but i'm very much interested/open to feedback on this, so if u're as invested in these sorts of convos as i am && have any ideas/critique please open an [issue](https://github.com/nbriz/StatsNotTracks/issues)!

- **only collect what i need**: Google && other surveillance capitalist data barons have an unquenchable thirst to record + analyze + predict ur every move && thought. Putting aside how problematic this is, the fact is that for most of my use cases, it's overkill. I'm only recording the most basic stats (but also wrote an API for extending this for specific use cases, see docs below)

- **no cookies, fingerprints, IPs or PIDs**: As i mentioned above keeping the data anonymized but also useful was the [trickiest part](https://arstechnica.com/tech-policy/2009/09/your-secrets-live-online-in-databases-of-ruin/). Without creating cookies, browser [fingerprinting](https://howthey.watch/), recording IP (Internet Protocol) addresses or any other PIDs (persistent identifiers) how do we associate specific page visits/actions to the same user to keep the page views && visitor counts accurate? Following the president set by [Plausible](https://plausible.io/data-policy#how-we-count-unique-users-without-cookies), i'm creating a random ID per visitor which only lasts for a day, which allows me to keep the stats reasonably accurate without recording personally identifiable information (PII) as well as avoid using cookies && other trackers (no GDPR issues here that i'm aware of). This means that:
  - the data is **accurate to a single day**, but if u view stats across multiple days the same user visiting ur page on diff days will be registered as diff "unique" visitors. This time-frame can be edited (but be careful, b/c the longer the TTL of these IDs the higher the [chance of compromising ur vsisitor's data](https://arstechnica.com/tech-policy/2009/09/your-secrets-live-online-in-databases-of-ruin/))
  - there's **no way to associate users across devices**, each device is considered a unique visitor (this is intentional, for my use case this isn't particularly helpful info, so why risk compromising user privacy).
  - there's **no tracking users across diff sites/apps**, Google Analytics does this not b/c it gives u better analytics data, but b/c it helps fuel their surveillance system, target ads, predict && manipulate user behavior. I'm not down w/that.

- **open source**: at the end of the day, if the code's not open source there's no way to know for sure anything i'm saying is true (same applies to any/every other digital tool u use. If it's proprietary/closed source, u better seriously trust whoever's behind it)


# How To

## installation / setup

```
npm install git+https://github.com/nbriz/StatsNotTracks.git
```

Then on the server side add the following before defining any of the other routes u're recording analytics for (assuming the variable `app` is an instance of an `express()` app):
```js
require('stats-not-tracks').setup(app)
```

Then add the following to any pages u want to record stats for:

```html
<script src="/stats-not-tracks.min.js"></script>
```
&& that's it!

-----

The API docs below are optional bits for customizing some of the details

## server side API

The instance of the module is an object that contains the `setup()` method, but it also contains a `live()` method which can be used to display how many visitors are currently on ur page (although this serves no purpose if u don't have the admin panel enabled, b/c there's no where to "display" that number. more on that below)

```js
const ANALYTICS = require('stats-not-tracks')
// assuming "app" is an instance of express()
ANALYTICS.setup(app)
// assuming "server" is an instance of an express.js server
ANALYTICS.live(server)
```

The `live()` method makes use of [socket.io](https://socket.io/), but if u're already using socket.io it's best to pass ur own instance of it as the second argument.

```js
ANALYTICS.live(server, io)
```
The `setup()` method also takes an optional second argument, a config object used to change some of the default settings.

```js
ANALYTICS.setup(app, {
  debug: true, // print debug logs to console
  path: `${__dirname}/analytics`, // path to store data
  idttl: 1000 * 60 * 60 * 24, // (1 day) how long before anonimyzing user id
  admin: true // enable REST API and client-side admin dashboard
})
```

In the example above the `admin` property is set to `true`, which means we've exposed routes for the REST API as well as the default client-side admin dashboard. This is served publicly by default, meaning anyone witch access to this app/site could visit `https://[YOUR_SITE]/stats-not-tracks` as well as request data from the api `https://[YOUR_SITE]/snt-api/data/hits`. That said, you can edit these && other admin defaults by passing an optional config object to the `admin` property instead of a boolean.

```js
ANALYTICS.setup(app, {
  debug: true, // print debug logs to console
  path: `${__dirname}/analytics`, // path to store data
  idttl: 1000 * 60 * 60 * 24, // (1 day) how long before anonimyzing user id
  admin: { // enable admin API/dashboard (could also be set to: true)
    // path to custom dashboard.html && login.html files
    dashboard: `${__dirname}/www/custom-analytics-gui`,
    // custom URL to access admin dashboard: http://[host]/analytics
    route: 'analytics',
    // custom secret used to create the session cookie/token
    secret: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    // custom admin password hash
    // generated by: npm run hashpw [PW]; or by: node js/hashpw.js
    hash: 'abcabcabcabcabcabcabcabcabcabcabcabcabcabc',
    // name of session cookie (json-web-token)
    token: 'CustomCookieName',
    // how long the session cookie should last
    ttl: 5000 // 5 seconds
  }
})
```

To protect the admin dashboard behind a login page the `admin.hash` property can be used to pass a hashed password used to authenticate admins (these hashes can be generated w/a helper node script i made included in this repo called [hashpw.js](https://github.com/nbriz/StatsNotTracks/blob/main/js/hashpw.js)). When the admin logins successfully a session cookie with a JWT (json-web-token) gets stored in the admin's browser. The generation of a JWT requires a "secret" string, this can be changed by passing your own secret string to the `admin.secret` property. The token that gets generated is called "sntAdminToken" by default && will last 1 day, to change this edit the `admin.token` && `admin.ttl` as demonstrated in the example above.

As mentioned before, the dashboard is served at `/stats-not-tracks` by default, but u can change this to a custom route by editing the `admin.route` property. This module includes a default "login.html" && "dashbaord.html" page, but u can also create ur own login/dashboard html pages (more on this below), these should be in a protected directory (ie. should **not** be served publicly by ur server), the route for which u can pass to the `admin.dashboard` property.


## client side API

This module also comes with an optional client-side dashboard (enabled by setting the `.setup()` method a config object with the `admin` property to `true` or passing it an optional object with details. see example above). While it isn't necessary to enable this, without it u're ultimately just collecting data in an SQLite database with no view (though u could always open the db file up w/an app like [DB Browser for SQLite](https://sqlitebrowser.org/)). I made this module for a few different projects && so I wanted the ability to quickly customize these dashboards && while I don't have the time to *fully* document all the details, here's the general idea...

### custom analytics "actions"

As mentioned in the "installation / setup" section above, after u've required + setup the node module on ur express server, all u need to do to start recording the analytics of any given html page on ur site is include the `<script src="/stats-not-tracks.min.js"></script>` within that page.

By default this script will log 4 different types of actions to the database, each of these actions will record the same type of default payload, an object with the following properties `{ width, height, query }`, where "width/height" are the dimensions of the window at the time that action fired (in px) && "query" is any URL parameters (if any) present in the URL at the time of that action:
- **load**: this action fires as soon as a visitor loads the page
- **hidden**: this action fires if the visitor hides the page, but doesn't close it, if they switch browser tabs for example.
- **visible**: this action fires when the user views a page they had previously opened, if they switch back to that browser tab for example.
- **unload**: this action fires when the visitor ends their session, for example when they close that tab or quit their browser.

You can record ur own custom actions (maybe for split testing or other purposes) by using the `SNT` object included in the client side script `stats-not-tracks.min.js`. For example, maybe u have a custom 404 page && u want to keep track of how many times folks land on it, u could create a custom action object like this:
```js
  // create a custom action
  const obj = SNT.dataObj('404')
  // post it to the server to get logged in the database
  SNT.post(obj)
```
This will return an object which looks like:
```js
{
  action: '404',
  referrer: '[referrer-URL]', // if any
  host: '[host-URL]', // ex: mywebsite.com
  path: '[path-URL]', // ex: /example/path.html
  payload: {
    width: 1920, // window width
    height: 955, // window height
    query: '[URL-query]' // ex: ?test=value&other=value
  }
}
```

u can also pass an optional custom payload object

```js
  const obj = SNT.dataObj('color-select', { color: value })
  SNT.post(obj)
```

### custom login/dashboard

As explained above u can create your own "login.html" && "dashboard.html" pages, the paths for which u can pass into the server-side `.setup()` method's config object's `admin.dashbaord` property. There are some statically served files u can use to create these pages, these include:

- **snt-styles.css**: the CSS stylesheet used by the default login/dashbaord pages, which u can include in ur own html pages like so: `<link rel="stylesheet" href="/snt-styles.css">`

- **/snt-libs/snt-row.js**: the custom HTML element i use to create the various rows of stats in the dashboard, which u can include in ur own html pages like so: `<script src="/snt-libs/snt-row.js"></script>`
  ```html
  <!-- a row element with the content "phone" && a meter filled halfway -->
  <snt-row val="50" max="100" txt="phone"></snt-row>
  ```

- **/snt-libs/snt-modal.js**: the custom HTML element i use to create the various modals in the dashboard, which u can include in ur own html pages like so: `<script src="/snt-libs/snt-modal..js"></script>`
  ```html
  <!-- a modal element (hidden by default) -->
  <snt-modal zIndex="1000"></snt-modal>

  <script>
    // will update the modal's content && display it
    $('snt-modal').update({
      title: 'Info Modal',
      html: '<p>some information</p>'
    })
  </script>
  ```

- **/snt-libs/chart.min.js**: which is a copy of the [Chart.js](https://www.chartjs.org/) library, v3.6.1 (at the time of this writing), which u can include in ur own html pages like so: `<script src="/snt-libs/chart.min.js"></script>`

- **/snt-libs/utils.js**: this includes a series of helper functions i use to create the default login/dashboard pages, which u can include in ur own html pages like so: `<script src="/snt-libs/utils.js"></script>`

The `utils.js` library includes a jquery style `$` function which returns any elements matching the query selector string, for example `$('#container')`, as well as an `SNT` object with the following methods:

- `SNT.login(passwordString, callback)`: to authenticate the admin to view the dashbaord && send requests to the REST API.
- `SNT.logout()`: to delete the session cookie, effectively logging out the admin
- `SNT.getData(queryString, callback)`: sends a query to the REST API  && returns all the same data documented bellow in addition to a "dict" object merging them all into a single dictionary object.
- `SNT.getViews(dict)`: takes the dictionary object generated by `getData` && returns an object with calculated page views (keep in mind what gets recorded to the analytics database are "hits" generated by the "actions" described above. A "view" is based on the amount of "load" && "visible" actions logged).
- `SNT.avgTimes(dict)`: takes the dictionary object generated by `getData` && calculates + returns an object with the average time spent on each page (as well as the average time spent on the site over all)
- `SNT.chartViews(canvas, range, cal)`: uses [Chart.js](https://www.chartjs.org/) to create a chart of page views over time. "canvas" is an instance of a canvas element, "range" is the date range u want to chart, an object with "to" && "from" properties whose values are date strings like "YYYY-MM-DD", for ex `{ from: "2021-12-17", to: "2022-01-17" }`, && "cal" is the `.cal` property returned by `getViews`
- `SNT.loading(status, opts)`: when "status" is `true` it creates a loading overlay, when it's `false` the overlay is removed. "opts" is an optional object which can include "background", "color" && "zIndex" properties.
- `SNT.month`: returns the value of a month in milliseconds
- `SNT.day`: returns the value of a day in milliseconds
- `SNT.order(dict)`: takes a dictionary with number values (views, visits, etc) and returns an ordered array (from largest to smallest)
- `SNT.tallyStats(obj)`: some of the objects returned by `getViews` are multi-dimentional, this method tallies up all the views within one of these objects.
- `SNT.tallyGeo(locations, by)`: takes an array of location objects (like those returned by the REST API) && tallies them up by country by default (or by whatever property u pass as the "by" argument)
- `SNT.date2str(date)`: converts a `Date` object into a date "YYYY-MM-DD" string
- `SNT.str2date(string)`: converts a date string into a `Date` object
- `SNT.str2timestamp(string)`: converts a date string into a unicode timestamp
- `SNT.timestamp2str(number)`: converts a unicode timestamp into a date string
- `SNT.ms2tc(number)`: converts a value in milliseconds to a timecode "HH:MM:SS" string
- `SNT.abrevNum(number)`: abbreviates large numbers, for example 1000 becomes 1K.
- `SNT.map(value, sourceMin, sourceMax, destMin, destMax)`: maps a value to a given range
- `SNT.urlTrim(string)`: remove protocol && trailing slashes from a URL

## REST API

When the `admin` property of the config object passed to the server side module's `setup()` method is set to true (or passed it's own optional config object, see examples above) the REST API is enabled. Below are the API's endpoints:

- **POST** `/snt-api/login`: expects the body to include a "password" string, used to authenticate an admin which can then view the client-side dashboard or make GET requests to this API
- **POST** `/snt-api/logout`: used to delete the session cookie created by the admin login
- **GET**: `/snt-api/data/:type`: used to request analytics data from the database, returns data in json format. where "type" can be:
  - `hits`, optionally pass a date range (values specified in unicode timestamps) like `?from=XXX&to=XXX` as well as other optional params like `path=XXX` to return only hits URL paths matching the specified value, or `referrer=XXX` to return only hits with matching referrer values, or `hash=XXX` to return only hits with matching the daily-anonymized user id.
  - `visitors`, optionally pass a date range (see "hits" above) or other optional params to return only visitors with matching values like `device=XXX` (device type), `os=XXX` (system type), `client=XXX` (client/browser type)
  - `locations`, optionally pass a date range (see "hits" above) or other optional params to return only visitors with matching values like `country=XXX` or other fields in the Locations table of the database.
