const functions = require('firebase-functions');
// const firebase = require('firebase')
// require('firebase/firestore')
// const axios = require('axios')
const admin = require('firebase-admin')

admin.initializeApp();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

exports.getPhoneData = functions.https.onRequest((req, res) => {
    admin.firestore().collection('productList').orderBy('index', 'asc').get()
        .then(data => {
            let phoneData = [];
            data.forEach(doc => {
                phoneData.push({
                    index: doc.data().index,
                    itemId: doc.id,
                    company: doc.data().company,
                    title: doc.data().title,
                    img: doc.data().img,
                    price: doc.data().price,
                    info: doc.data().info
                })
            });
            return res.json(phoneData);
        })
        .catch(err => console.log(err))

})


exports.createPhoneData = functions.https.onRequest((req, res) => {
    const newPhoneData = {
        index: req.body.index,
        company: req.body.company,
        title: req.body.title,
        img: req.body.img,
        price: req.body.price,
        info: req.body.info
    };

    admin.firestore().
        collection("productList")
        .add(newPhoneData)
        .then((doc) => {
            res.json({ message: `document ${doc.id} created successfully` })
        })
        .catch(err => {
            res.status(500).json({ error: `something went wrong` });
            console.log(err)
        })

})

exports.addToCart = functions.https.onRequest((req, res) => {
    const cartPhoneData = {
        itemId: req.body.itemId,
        index: req.body.index,
        company: req.body.company,
        title: req.body.title,
        img: req.body.img,
        price: req.body.price,
        info: req.body.info
    };

    let docArray = []

    db.collection('cart')
        .get()
        .then(doc => {
            doc.forEach(item => {
                docArray.push(item.data())
            })
            console.log(docArray)
        }).then(() => {
            admin.firestore().
                collection("cart")
                .add(cartPhoneData)
                .then((doc) => {
                    res.json({ message: `document ${doc.id} created successfully` })
                })
                .catch(err => {
                    res.status(500).json({ error: `something went wrong` });
                    console.log(err)
                })
        })



        .catch(err => console.log(err))



})

exports.getCart = functions.https.onRequest((req, res) => {
    cartItems = [];
    db
        .collection('cart')
        .get()
        .then(doc => {
            doc.forEach(item => {
                cartItems.push(item.data())
            })
        })
        .then(() => res.json(cartItems))


        .catch(err => console.log(err))
})

exports.removeFromCart = functions.https.onRequest((req, res) => {
    console.log(req.body)
    console.log(req.body.itemId)
    let docRef = []

    db
        .collection('cart')
        .where("index", '==', req.body.index)
        .get()
        .then(doc => {
            doc.forEach(item => {
                docRef.push(item.id)
            })
        })
        .then(() => {
            if (docRef.length > 0) {
                console.log(docRef.length)
                docRef.forEach(item => {
                    db.collection('cart').doc(item).delete()
                    return res.json({ message: "document deleted succesfully" })
                })
            }
            else {
                return res.json({ error: "item not in cart" })

            }

        })
        .catch(err => console.log(err))
})

exports.lowerQuantity = functions.https.onRequest((req, res) => {
    let docRef = [];

    db
        .collection('cart')
        .where("index", '==', req.body.index)
        .get()
        .then(doc => {
            doc.forEach(item => {
                docRef.push(item.id)
            })
        })
        .then(() => {
            if (docRef.length > 0) {
                db.collection('cart').doc(docRef[0]).delete()
                return res.json({ message: "document deleted succesfully" })
            } else {
                return res.json({ error: "item not in cart" })
            }

        })
        .catch(err => console.log(err))

})

exports.uploadImage = functions.https.onRequest((req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let imageToBeUploaded = {};
    let imageFileName;

    // let generatedToken = uuid();

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({ error: 'wrong file type submitted' })
        }
        else {
            const imageExtension = filename.split('.')[(filename.split('.')).length - 1];
            const imageName = filename.split('.')[0];
            imageFileName = `${imageName}.${imageExtension}`;
            const filePath = path.join(os.tmpdir(), imageFileName);
            imageToBeUploaded = { filePath, mimetype };
            file.pipe(fs.createWriteStream(filePath));
        }
    });
    busboy.on('finish', () => {
        admin
            .storage()
            .bucket()
            .upload(imageToBeUploaded.filePath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype
                    },
                },
            })
            .then(() => {
                return res.json({ message: 'image uploaded successfully' })
            })
            .catch(err => {
                console.log(err);
                return res.status(500).json({ error: "something went wrong" })
            })
    });
    busboy.end(req.rawBody)
});
