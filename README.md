# StatsNotTracks

Privacy focused web analytics middleware for [express.js](https://expressjs.com/). Records web site/app statistics w/out compromising user privacy. No tracking && no sharing data w/big tech.

**--- !!! --- !!! --- !!! --- !!! --- !!! ---**
**WORK IN PROGRESS --- THIS IS NOT FINISHED**
**--- !!! --- !!! --- !!! --- !!! --- !!! ---**

# Why?

B/c Google Analytics is [surveillance capitalism](https://en.wikipedia.org/wiki/Surveillance_capitalism) && surveillance capitalism [is bad](https://www.youtube.com/watch?v=hIXhnWUmMvw). In my never ending quest to avoid all surveillance tools/platforms (a seemingly impossible mission ¯\\_ (ツ)_/¯ but i can try my best) i started looking into alternatives to Google Analytics, i figured there must be libraries out there that help web devs like me keep track of web traffic stats without compromising the privacy (&& online agency) of the folks visiting my pages. Over the years i've found a few cool alternatives like [Matomo](https://matomo.org/) (formerly [Piwik](https://piwik.com/)), [Plausible](https://plausible.io/) && [Simple Analytics](https://simpleanalytics.com/). These all seem pretty solid in terms of privacy ethics: check out Matomo's sample [Privacy Policy](https://matomo.org/privacy-policy/), Plausible also has a great/simple write-up on [their approach to privacy](https://plausible.io/privacy-focused-web-analytics) which I used as a general guide when writing my code. My problem was that these were all paid 3rd party services && i was looking for an open source library/framework i could easily implement into my server stack myself. I've used various "stacks" over the years, but for the past few years most of my personal/client projects have been [node.js](https://nodejs.org/en/) servers built w/[express.js](https://expressjs.com/), so i hoping to find some flexible/hackable express middleware... which i couldn't find, so i wrote one.

# Privacy

As it turns out, recording web analytics without compromising privacy can be pretty tricky, even when u think u're "anonymizing" ur visitor's data... [it can be de-anonymized fairly easily](https://arstechnica.com/tech-policy/2009/09/your-secrets-live-online-in-databases-of-ruin/). Below are the steps i've taken to keep things ethical, but i'm very much interested/open to feedback on this, so if u're as invested in these sorts of convos as i am && have any ideas/critique please open an issue!

- **only collect what i need**: Google && other surveillance capitalist data barons have an unquenchable thirst to record + analyze + predict ur every move && thought. Putting aside how problematic this is, the fact is that for most of my use cases, it's overkill. I'm only recording the most basic stats (but also wrote an API for extending this for specific use cases, see docs below)

- **no cookies, fingerprints, IPs or PIDs**: As i mentioned above keeping the data anonymized but also useful was the [trickiest part](https://arstechnica.com/tech-policy/2009/09/your-secrets-live-online-in-databases-of-ruin/). Without creating cookies, browser fingerprinting, recording IP (Internet Protocol) addresses or any other PIDs (persistent identifiers) how do we associate specific page visits/actions to the same user to keep the page views && visitor counts accurate? Following the president set by [Plausible](https://plausible.io/data-policy#how-we-count-unique-users-without-cookies), i'm creating a random ID per visitor which only lasts for a day, which allows me to keep the stats reasonably accurate without recording personally identifiable information (PII) as well as avoid using cookies && other trackers (no GDPR issues here that i'm aware of). This means that:
  - the data is **accurate to a single day**, but if u view stats across multiple days the same user visiting ur page on diff days will be registered as diff "unique" visitors. This time-frame can be edited (but be careful, b/c the longer the TTL of these IDs the higher the [chance of compromising ur vsisitor's data](https://arstechnica.com/tech-policy/2009/09/your-secrets-live-online-in-databases-of-ruin/))
  - there's **no way to associate users across devices**, each device is considered a unique visitor (this is intentional, for my use case this isn't particularly helpful info, so why risk compromising user privacy).
  - there's **no tracking users across diff sites/apps**, Google Analytics does this not b/c it gives u better analytics data, but b/c it helps fuel their surveillance system, target ads, predict && manipulate user behavior. I'm not down w/that.

- **open source**: at the end of the day, if the code's not open source there's no way to know for sure anything i'm saying is true (same applies to any/every other digital tool u use. If it's proprietary/closed source, u better seriously trust whoever's behind it)


# How To

## installation

```
npm install git+https://github.com/nbriz/StatsNotTracks.git
```

Then on the server side add the following before defining any of the other routes u're recording analytics for:
```js
// assuming "app" is an instance of an express() app
require('stats-not-tracks').setup(app)
```

Then add the following to any pages u want to record stats for:

```html
<script src="/stats-not-tracks.js"></script>
```

## server side API

TODO

## client side API

TODO
