async function main(params, redis) {
	//return {env: process.env}

	let ret ='Nothing done'
	if (params.get) {
		ret = await redis.get(params.get)

	} else if (params.set && params.value) {
		ret = await redis.set(params.set, params.value)

	} else if (params.del) {
		ret = await redis.del(params.del)
	}

	return {msg: ret}
}

exports.main = main;

