import express from 'express';
import bodyParser from 'body-parser';
import {MongoClient} from 'mongodb'
import path from 'path'

const app = express();

app.use(express.static(path.join(__dirname,'/build')))
app.use(bodyParser.json())

const wthDB = async (operations,res) =>{
        try{
            const client = await MongoClient.connect('mongodb://localhost:27017',{ useNewUrlParser:true,useUnifiedTopology:true})
            const db = client.db('my-blog')
           await operations(db);
            client.close();
        }catch{
            res.status(500).json({message:'error connecting to db',err})
        }
}

app.get('/api/articles/:name',async (req,res)=>{
    wthDB(async(db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name:articleName})
        res.status(200).json(articleInfo)
    },res)
})

app.post('/api/articles/:name/upvote',async(req,res)=>{
    wthDB(async(db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name:articleName})
        await db.collection('articles').updateOne({name:articleName},{
        '$set':{
            upvotes:articleInfo.upvotes+1
        }
        })
        const updated = await db.collection('articles').findOne({name:articleName})
        res.status(200).json(updated)
    },res)
})

app.post('/api/articles/:name/add-comment',async (req,res)=>{
    const {username,text} = req.body;
    const articleName = req.params.name;
    wthDB(async(db) => {
        
        const articleInfo = await db.collection('articles').findOne({name:articleName})
        await db.collection('articles').updateOne({name:articleName},{
        '$set':{
            comments:articleInfo.comments.concat({username,text})
        }
        })
        const updated = await db.collection('articles').findOne({name:articleName})
        res.status(200).json(updated)
    },res)
});

app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname+"/build/index.html"));
})

app.listen(8000,()=>console.log('Listening on port 8000'))