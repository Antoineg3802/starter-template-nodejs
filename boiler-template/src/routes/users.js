var express = require('express');
var router = express.Router();
var userController = require('../controller/userController');
const NodeCache = require('node-cache');
const cache = new NodeCache();

/* GET users listing. */
router.get('/', function (req, res) {
	const cacheKey = req.originalUrl || req.url;
	const cachedData = cache.get(cacheKey);

	if (cachedData){
		return res.status(304).send(cachedData);
	}

	userController.getAllUsers()
	.then((users) => {
			cache.set(cacheKey, users, 20);
			res.status(200).send(users);
		}).catch((err) => {
			res.status(500).send(err.message)
		})
});

router.get('/currentUser/', function (req, res) {
	if (req.headers.authorization == undefined){
		res.status(401).send({
			error: true,
			message: "Invalid JWT token"
		})
	}else {
		const authorization = req.headers.authorization.split(' ')
		if (authorization[0] == 'Bearer') {
			userController.getCurrentUser(authorization[1])
				.then((response) => {
					res.send(response)
				})
		} else {
			res.status(401).send({
				error: true,
				message: 'No JWT token submitted'
			})
		}
	} 
});

router.get('/one/:id', function (req, res) {
	if (!isNaN(parseInt(req.params.id))) {
		userController.getOneUser(parseInt(req.params.id))
			.then((user) => {
				if (user.error != undefined) {
					res.status(404).send(user)
				} else {
					res.status(200).send(user)
				}
			}).catch((err) => {
				res.status(500).send(err.message)
			})
	} else {
		res.status(400).send({
			code: 404,
			error: 'Invalid parameter'
		})
	}
});

router.post('/login', (req, res) => {
	if (req.body.password && req.body.email) {
		userController.logUser(req.body.email.toLowerCase(), req.body.password)
			.then((responseObject) => {
				if (responseObject.error) {
					res.status(responseObject.status).send({ error: true, message: responseObject.message })
				} else {
					res.status(200).send(responseObject)
				}
			})
	} else {
		res.status(400).send({
			error: true,
			message: 'Invalid credentials'
		})
	}
})

router.post('/register/', (req, res) => {
	if (req.body.firstname && req.body.lastname && req.body.email && req.body.password && req.body.phone) {
		userController.registerUser(req.body.firstname, req.body.lastname, req.body.email, req.body.password, req.body.phone)
			.then((objectResponse) => {
				if (!objectResponse.error) {
					res.status(201).send({ token: objectResponse.token, maxAge: 259560000 })
				} else {
					res.status(objectResponse.status).send({ error: true, message: objectResponse.message })
				}
			})
	} else {
		res.status(400).send({
			error: true,
			message: 'Invalid parameters'
		})
	}
})

router.patch('/modify/:userId', (req, res) => {
	let userId = req.params.userId
	const updateData = req.body;

	userController.updateUser(userId, updateData)
		.then(result => {
			res.send(result)
		})
})

router.delete('/', (req, res) => {
	if (req.headers.authorization == undefined){
		res.status(400).send({
			error: true,
			message: "Invalid JWT token"
		})
	}else{
		let authorization = req.headers.authorization.split(' ')
		if (authorization[0] == 'Bearer') {
			userController.deleteUser(authorization[1])
				.then(result => {
					if (result.error != undefined){
						res.status(404).send(result)
					}else{
						res.status(202).send()
					}
				})
		}else {
			res.status(400).send({
				error: true,
				message: "Invalid JWT token"
			})
		}	
	}
})

module.exports = router;
