const redis = require("redis");
const client = redis.createClient({host: "openwhisk_redis_1"});
const { promisify } = require("util");
const get = promisify(client.get).bind(client);
const set = promisify(client.set).bind(client);

async function main(params) {
	if (params.get) {
		const value = await get(params.get)
		return {success: true, msg: 'Value gotten', value}
	} else if (params.set && params.value) {
		const ret = await set(params.set, params.value)
		return {success: true, msg: 'Value set', ret}
	} else {
		return {success: true, msg: 'Nothing done'}
	}
}

exports.main = main;

