const mongoose = require('mongoose');
require('dotenv').config();

const imageNames = [
    'image-1773306603262.png',
    'image-1774428767880.png',
    'image-1775881633061.png',
    'image-1775802480162.png',
    'image-1775883306761.png',
    'image-1773302336907.png',
    'image-1775458053966.png',
    'image-1776673866562.png',
    'image-1770965851641.png',
    'image-1775443952753.png',
    'image-1770962988402.png',
    'image-1770965308938.png',
    'image-1775902552405.png',
    'image-1770964975523.png'
];

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('\nCollections found:', collections.length);

        console.log('\n=== Searching for missing images in all collections ===\n');

        let totalFound = 0;

        for (const collection of collections) {
            const collName = collection.name;
            try {
                const coll = db.collection(collName);
                const count = await coll.countDocuments();
                if (count === 0) continue;

                // Search using exact match for any of these image names
                const searchObj = {};
                for (const imgName of imageNames) {
                    // Search in any field that might contain this image
                    const regex = new RegExp(imgName.replace('.png', '').replace('image-', 'image-'));
                    const found = await coll.findOne({
                        $or: [
                            { image: { $regex: regex } },
                            { logo: { $regex: regex } },
                            { images: { $regex: regex } },
                            { pic: { $regex: regex } },
                            { photo: { $regex: regex } }
                        ]
                    });

                    if (found) {
                        console.log('=== Found in collection:', collName, '===');
                        console.log('Image:', imgName);
                        // Show which field contains it
                        const fields = ['image', 'logo', 'images', 'pic', 'photo'];
                        for (const field of fields) {
                            if (found[field] && found[field].toString().includes(imgName.replace('.png', ''))) {
                                console.log('Field:', field, '=', found[field]);
                            }
                        }
                        console.log('Document _id:', found._id);
                        console.log('');
                        totalFound++;
                    }
                }
            } catch (e) {
                // Skip collections we can't access
            }
        }

        if (totalFound === 0) {
            console.log('No images found in any collection.');
        } else {
            console.log('\nTotal images found:', totalFound);
        }

        await mongoose.connection.close();
        console.log('\nDone.');
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

connectDB();
