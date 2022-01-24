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

app.post('/api/setVote', jsonParser, async (req, res) => {
  try {
    const voteListLength = req.body.voteListLength
    const voteElement = req.body.voteElement
    const voteDate = req.body.voteDate
    const newVoteArr = []
    await MongoClient.connect(dbUrl, async (err, client) => {
      const zaxeDB = client.db('zaxe-analytic').collection('analytics')

      if ((await zaxeDB.find({ date: voteDate }).toArray()).length > 0) {
        const selectedData = await zaxeDB.find({ date: voteDate }).toArray()
        const newVote = selectedData[0].votes[voteElement] + 1

        await zaxeDB.updateOne(
          { date: voteDate },
          { $set: { [`votes.${voteElement}`]: await newVote } }
        )
      } else {
        for (let x = 0; x < voteListLength; x++) {
          newVoteArr.push(0)
        }
        newVoteArr[voteElement] += 1
        await zaxeDB.insertOne({ date: voteDate, votes: newVoteArr })
      }
      await client.close()
    })
    await res
      .status(200)
      .json({ code: 200, message: 'Vote successfully sent.' })
  } catch (err) {
    await res.status(500).json({ code: 500, message: 'An error occured.' })
  }
})

app.listen(port, (err) => {
  console.log(`Server is running at ${port}!`)
})
