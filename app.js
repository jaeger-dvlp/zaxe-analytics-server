const MongoClient = require('mongodb').MongoClient
const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()
const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 3010

require('dotenv').config()

const app = express()
const dbUrl = process.env.ZAXE_DB_URL

const allowCrossDomain = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
  res.setHeader('Access-Control-Allow-Credentials', true)
  next()
}

app.use(cors())
app.use(allowCrossDomain)

const getCurrentTime = () => {
  let currentDate = new Date()
  let today = `${currentDate.getFullYear()} ${currentDate.toLocaleString('tr', {
    month: 'long'
  })} ${currentDate.toLocaleDateString('tr', {
    weekday: 'long'
  })}`
  return today
}

app.post('/api/setVote', jsonParser, async (req, res) => {
  MongoClient.connect(dbUrl, async (err, client) => {
    let zaxeDB = client.db('zaxe-analytic').collection('analytics')
    let now = getCurrentTime()
    const incomingQuery = req.body.query
    try {
      console.log(now)
      if ((await zaxeDB.find({ date: now }).toArray()).length > 0) {
        let selectedData = await zaxeDB.find({ date: now }).toArray()
        let voteNow = selectedData[0].votes[incomingQuery] + 1
        await zaxeDB.updateOne(
          { date: now },
          { $set: { [`votes.${incomingQuery}`]: await voteNow } }
        )
      } else {
        let newVote = [0, 0, 0, 0]
        newVote[incomingQuery] += 1
        await zaxeDB.insertOne({ date: now, votes: newVote })
      }
      await res.status(200).json({ message: 'Vote successfully sent.' })
    } catch (error) {
      console.log(error)
      await res.status(500).json({ message: 'An error occurred.' })
    }

    await client.close()
  })
})

app.listen(port, (err) => {
  console.log(`Server is running at ${port}!`)
})
