# Load testing tools for Normandy

## wrk

[wrk](https://github.com/wg/wrk) is a configurable HTTP benchmarking tool.

It can be used like

```bash
$ wrk --duration 5m --connection 64 --threads 4 --script prod-like.lua
```

These paramaters can produce interesting amounts of load on a developer
installation of Normandy. They should be tweaked as desired for other
environments.

`prod-like.lua` is a script that creates traffic to multiple endpoints on a
server. The endpoints and proportions are based on traffic logs of the
production Normandy service. The order is randomized.
