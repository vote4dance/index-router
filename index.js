const { Router } = require('./lib/router');

const log = require('debug')('index-router');
const crypto = require('crypto');

const routers = {};

exports.handler = async function (event, context) {
    // log("Event", JSON.stringify(event));
    // log("Context", JSON.stringify(context));

    const router = (() => {
        const assetsUrl = event.stageVariables['ASSETS_URL'];
        const apiUrl = event.stageVariables['API_URL'];
        const stage = event.requestContext.stage;

        const hash = crypto.createHash('md5').update(assetsUrl).update(apiUrl).update(stage).digest('hex');

        const _r = routers[hash];
        if (_r) {
            log(`Retrieving router for '${stage} (${hash})'`);
            return _r;
        }

        log(`Created router for '${stage} (${hash})':`, { assetsUrl, apiUrl });

        const _n = new Router(assetsUrl, apiUrl);
        routers[hash] = _n;

        return _n;
    })();

    const cacheAge = (age => {
        if (!age) {
            return undefined;
        }

        return parseInt(age);
    })(event.stageVariables['CACHE_AGE']);

    const clientAge = (age => {
        if (!age) {
            return undefined;
        }

        return parseInt(age);
    })(event.stageVariables['CLIENT_AGE']);

    return router.route(event.path ? event.path : '/', {
        cacheAge,
        clientAge
    });
};
