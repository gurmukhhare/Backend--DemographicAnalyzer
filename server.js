const express = require('express');
const bodyParser= require('body-parser');
const cors = require ('cors');
const bcrypt = require('bcrypt-nodejs');
const knex = require ('knex');

const db=knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',  //localhost, this is where our database lives
    user : 'gurmukhhare',
    password : '',
    database : 'smart-brain-2'
  }
});

db.select('*').from('users').then(data =>{
	console.log(data);
});

const app = express();

app.use(bodyParser.json());
app.use(cors());



app.get('/',(req,res)=>{
	res.json('this is working');
})

app.post('/signin',(req,res)=>{
	db.select('email', 'hash').from('login')
	.where('email','=',req.body.email)
	.then(data =>{
		const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
		if(isValid){
			return db.select('*').from('users')
			.where('email','=',req.body.email)
			.then(user =>{
				res.json(user[0])

			})
			.catch(err => res.status(400).json('unable to get user'))
			
		} else{
		res.status(400).json('wrong credentials')
		}

	})
	.catch(err => res.status(400).json('wrong credentials'))


})

app.post('/register',(req,res)=>{
	const { email,name,password }=req.body;
	const hash = bcrypt.hashSync(password);
		db.transaction(trx => {
			trx.insert({
				hash: hash,
				email: email
			})
			.into('login')
			.returning('email')
			.then(loginEmail =>{
				return trx('users')
				.returning('*')
				.insert({
					email: loginEmail[0],
					name: name,
					joined: new Date ()
				})
				.then(user =>{
					res.json(user[0]);


				})

			})
			.then(trx.commit)
			.catch(trx.rollback)
		})

		
	.catch(err => res.status(400).json('unable to register'))
})

app.get('/profile/:id',(req,res) => {
	const { id }=req.params;   /*parameters is an object containing 
	parameters values parsed from the url path. if we use :'' syntax in url, we can grab the parameter 
	using req.params*/
	db.select('*').from('users').where({
		id: id
	}).then(user =>{
		if(user.length){
			res.json(user[0])
		} else{
			res.status(400).json('not found')
		}

	})
	.catch(err => res.status(400).json('error getting user'))
	}) 

app.put('/image',(req,res)=>{
	const { id }=req.body;   /*parameters is an object containing 
	parameters values parsed from the url path. if we use :'' syntax in url, we can grab the parameter 
	using req.params*/
	db('users').where('id', '=', id)
  	.increment('entries',1).returning('entries').then(entries =>{
  		res.json(entries[0]);
  	})
  	.catch(err => res.status(400).json('cannot get entries'))
})



// Load hash from your password DB.
/*bcrypt.compare("bacon", hash, function(err, res) {
    // res == true
});
bcrypt.compare("veggies", hash, function(err, res) {
    // res = false
});

*/

app.listen(3000, ()=>{
	console.log('app is running');
});






/*

/ -->response = this is working

/signin- -> POST = responds with success or fail-->
**anytime you send secure data over the wire, you want to use POST to send it in the body of the request

/register -->POST = responds by returning the new created user object
/profile/:userID --> GET = reponds with the user
/image --> PUT = updates the total number of attempts count 
*/

